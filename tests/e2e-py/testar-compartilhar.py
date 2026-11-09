# T-22 · Compartilhar. Uso: python3 tests/e2e-py/testar-compartilhar.py
import subprocess, sys, time, os, json
from playwright.sync_api import sync_playwright
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "site")
PORTA = 8806; BASE = f"http://localhost:{PORTA}"
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
falhas, erros = [], []
def ok(c, m):
    print(("ok    " if c else "FALHA ") + m)
    if not c: falhas.append(m)
# simula o navegador: «com» (share resolve), «cancela» (AbortError), «erro» (outro erro), «sem» (sem canShare)
def mock(modo):
    if modo == "sem": return "delete Navigator.prototype.canShare; delete Navigator.prototype.share;"
    corpo = {"com": "return Promise.resolve()", "cancela": "return Promise.reject(Object.assign(new Error('x'),{name:'AbortError'}))", "erro": "return Promise.reject(new Error('falhou'))"}[modo]
    return ("window.__s=[];Object.defineProperty(Navigator.prototype,'canShare',{value:function(d){window.__c=(d.files||[]).length;return true},configurable:true});"
            "Object.defineProperty(Navigator.prototype,'share',{value:function(d){window.__s.push({n:d.files.map(f=>f.name),t:d.files[0].type,z:d.files[0].size,ativo:navigator.userActivation.isActive});" + corpo + "},configurable:true});")
def ate_concluido(pg, fmt=None, mob=False):
    pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500); pg.click("#go2" if mob else "#go"); pg.wait_for_timeout(250)
    pg.click("#pv-okl"); pg.click("#pv-g"); pg.wait_for_timeout(500); pg.click("#go"); pg.wait_for_timeout(300)
    if fmt: pg.evaluate("f=>{var o=JSON.parse(sessionStorage.getItem('pl-exportar'));Object.assign(o,f);sessionStorage.setItem('pl-exportar',JSON.stringify(o))}", fmt)
    pg.goto(BASE + "/app/editor/gerar/#estado-concluido"); pg.wait_for_timeout(300)
    pg.click("#b-compart"); pg.wait_for_timeout(500)
try:
    time.sleep(1)
    with sync_playwright() as p:
        b = p.chromium.launch()
        def nova(modo, w=1440):
            c = b.new_context(viewport={"width": w, "height": 900}, accept_downloads=True); c.add_init_script(mock(modo))
            pg = c.new_page(); pg.on("pageerror", lambda e: erros.append(str(e))); return pg
        # trava: sem arquivo gerado
        pg = nova("com"); pg.goto(BASE + "/app/editor/compartilhar/"); pg.wait_for_timeout(300)
        ok(pg.locator("#trava").is_visible() and not pg.locator("#corpo").is_visible() and "Falta gerar" in pg.inner_text("#trava"), "sem arquivo gerado: trava com caminho para Exportar")
        # com suporte: PDF
        ate_concluido(pg)
        ok(pg.url.endswith("/app/editor/compartilhar/"), "«Compartilhar» do concluído leva à T-22")
        ok("Polar-Life.pdf" in pg.inner_text("#arqs") and "1 arquivo" in pg.inner_text("#resumo"), "lista o arquivo com nome neutro (BR-11)")
        ok(pg.inner_text("#ir-t") == "Compartilhar" and pg.locator("#ir").is_enabled() and not pg.locator("#aviso").is_visible(), "canShare confirma: botão «Compartilhar», sem aviso")
        pg.click("#ir"); pg.wait_for_timeout(300); s = pg.evaluate("window.__s")
        ok(len(s) == 1 and s[0]["n"] == ["Polar-Life.pdf"] and s[0]["t"] == "application/pdf" and s[0]["z"] > 0, "share recebe o arquivo pronto (PDF, com conteúdo)")
        ok(s[0]["ativo"] is True, "share é chamado dentro do clique (ativação do usuário)")
        ok(pg.locator("#toast").is_visible(), "compartilhou: confirmação curta")
        ok(pg.evaluate("window.__c") == 1 and pg.evaluate("document.querySelectorAll('.led-btn').length") == 1, "um só LED na tela")
        pg.context.close()
        # cancelou
        pg = nova("cancela"); ate_concluido(pg); pg.click("#ir"); pg.wait_for_timeout(300)
        ok(not pg.locator("#toast").is_visible() and not pg.locator("#aviso").is_visible() and pg.inner_text("#ir-t") == "Compartilhar", "AbortError: sem mensagem e o botão continua «Compartilhar»")
        pg.context.close()
        # outro erro
        pg = nova("erro"); ate_concluido(pg); pg.click("#ir"); pg.wait_for_timeout(300)
        ok(pg.inner_text("#ir-t") == "Baixar PDF" and "Não foi possível abrir o menu" in pg.inner_text("#aviso"), "outro erro: troca para «Baixar PDF» com aviso")
        with pg.expect_download() as d: pg.click("#ir")
        ok(d.value.suggested_filename == "Polar-Life.pdf", "baixa o arquivo com nome neutro")
        ok("escolha o PDF" in pg.inner_text("#baixado") and pg.evaluate("document.activeElement.id") == "baixado", "instrução do destino com foco")
        pg.context.close()
        # sem suporte, imagens das folhas (6 arquivos)
        pg = nova("sem"); ate_concluido(pg, {"f": "folhas", "tipo": "png", "ppi": 300, "zip": False, "v": 1, "mb": 54})
        ok(pg.inner_text("#ir-t") == "Baixar imagens" and "Este navegador não compartilha arquivos" in pg.inner_text("#aviso"), "sem canShare: «Baixar imagens» e aviso com ícone")
        ok("6 arquivos" in pg.inner_text("#resumo") and "Folha-01.png" in pg.inner_text("#arqs"), "6 imagens de folha na lista")
        with pg.expect_download() as d: pg.click("#ir")
        ok(d.value.suggested_filename == "Folha-01.png", "baixa a primeira imagem como PNG")
        ok("escolha a imagem na galeria" in pg.inner_text("#baixado"), "instrução: «escolha a imagem na galeria»")
        ok(pg.evaluate("document.querySelectorAll('.rotas li').length") == 3, "tabela de destinos (celular, computador, Instagram)")
        pg.context.close()
        # com suporte, várias imagens
        pg = nova("com"); ate_concluido(pg, {"f": "folhas", "tipo": "jpeg", "ppi": 300, "zip": False, "v": 1, "mb": 12}); pg.click("#ir"); pg.wait_for_timeout(300)
        s = pg.evaluate("window.__s")
        ok(pg.evaluate("window.__c") == 6 and s[0]["t"] == "image/jpeg" and s[0]["n"][0] == "Folha-01.jpg", "canShare e share recebem as 6 imagens JPEG")
        pg.context.close()
        # estados de revisão
        pg = nova("com")
        for h, txt in (("sem-suporte", "Este navegador não compartilha"), ("erro", "Não foi possível abrir o menu"), ("baixado", "Arquivo baixado")):
            pg.goto(BASE + "/app/editor/compartilhar/#estado-" + h); pg.reload(); pg.wait_for_timeout(300)
            ok(txt in pg.inner_text("#corpo") and pg.inner_text("#ir-t") == "Baixar PDF", f"#estado-{h}")
        # celular
        pg.context.close(); pg = nova("com", 390); ate_concluido(pg, mob=True)
        ok(pg.evaluate("document.documentElement.scrollWidth<=innerWidth") and pg.locator("#ir").is_visible(), "390: sem rolagem horizontal e botão visível")
        ok(pg.evaluate("document.getElementById('ir').getBoundingClientRect().height>=44&&document.getElementById('voltar').getBoundingClientRect().height>=44"), "390: botões com alvo de toque de 44 px ou mais")
        b.close()
finally:
    srv.terminate()
ok(not erros, "sem erro de script " + str(erros))
print(f"\n{'✖ ' + str(len(falhas)) + ' falha(s)' if falhas else '✔ Compartilhar: sem falhas'}"); sys.exit(1 if falhas else 0)
