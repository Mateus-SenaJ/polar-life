# T-20 · Gerando, recuperação, concluído. Uso: python3 scripts/testar-gerar.py
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
PORTA = 8803; BASE = f"http://localhost:{PORTA}"
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
falhas, erros = [], []
def ok(c, m):
    print(("ok    " if c else "FALHA ") + m)
    if not c: falhas.append(m)
def ate_exportar(pg, mob=False):
    pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500); pg.click("#go2" if mob else "#go"); pg.wait_for_timeout(250)
    pg.click("#pv-okl"); pg.click("#pv-g"); pg.wait_for_timeout(500)
def gerar(pg):
    pg.click("#go"); pg.wait_for_timeout(300)
try:
    time.sleep(1)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1440, "height": 900})
        pg.on("pageerror", lambda e: erros.append(str(e)))
        pg.goto(BASE + "/app/editor/gerar/"); pg.wait_for_timeout(300)
        ok(pg.locator("#trava").is_visible() and not pg.locator("#corpo").is_visible(), "sem exportação escolhida, a tela manda voltar")
        ate_exportar(pg); gerar(pg)
        ok(pg.url.endswith("/app/editor/gerar/") and "Folha 1 de 6" in pg.inner_text("#lbl"), "«Gerar» leva à T-20 com «Folha 1 de 6»")
        ok(pg.get_attribute("#prog", "role") == "progressbar" and pg.get_attribute("#prog", "aria-valuenow") is not None, "barra de progresso com papel e valor")
        # cancelar
        pg.click("#cancel"); pg.wait_for_timeout(100)
        ok(pg.locator("#dl-cancel").is_visible() and pg.evaluate("document.activeElement.id") == "dc-nao", "Cancelar abre o pop-up com foco em «Continuar gerando»")
        pg.keyboard.press("Escape"); pg.wait_for_timeout(100)
        ok(not pg.locator("#dl-cancel").is_visible() and pg.evaluate("document.activeElement.id") == "cancel", "Esc continua a geração e devolve o foco")
        # concluir
        pg.wait_for_selector("#fase-ok:not([hidden])", timeout=15000)
        ok("Concluído · 1 arquivo · 58 MB" in pg.inner_text("#ok-box"), "concluído: «Concluído · 1 arquivo · 58 MB»")
        ok(pg.locator("text=Abrir pasta").count() == 0, "não existe «Abrir pasta»")
        ok(pg.locator("#b-imprimir").is_visible() and pg.locator("#b-baixar").is_visible() and pg.locator("#b-novo").is_visible() and pg.locator("#b-compart").is_visible(), "ações: Baixar, Baixar novamente, Imprimir agora, Compartilhar")
        # parar e descartar
        ate_exportar(pg); gerar(pg); pg.click("#cancel"); pg.click("#dc-sim"); pg.wait_for_timeout(400)
        ok(pg.url.endswith("/app/editor/exportar/"), "«Parar e descartar» volta à Exportar")
        # falha: 4 opções
        pg.goto(BASE + "/app/editor/gerar/#estado-falha"); pg.wait_for_selector("#dl-falha:not([hidden])", timeout=8000)
        t = pg.inner_text("#dl-falha")
        ok("2 fotos não puderam ser lidas" in t and "Foto 7" in t and "Foto 19" in t, "«2 fotos não puderam ser lidas» lista as fotos")
        ok(all(x in t for x in ["Tentar de novo", "Trocar foto", "Gerar sem elas", "Cancelar"]), "4 opções: Tentar de novo · Trocar foto · Gerar sem elas · Cancelar")
        ok(pg.evaluate("document.getElementById('df-troca').href").endswith("/app/editor/quadro/#foto-7"), "«Trocar foto» leva ao Quadro, na foto 7")
        pg.click("#df-tenta"); pg.wait_for_timeout(200)
        ok("1 foto não pôde ser lida" in pg.inner_text("#dl-falha"), "«Tentar de novo»: a foto 7 volta, a 19 continua falhando")
        pg.click("#df-sem"); pg.wait_for_timeout(300)
        ok(pg.locator("#nota").is_visible() and "23 fotos" in pg.inner_text("#nota"), "«Gerar sem elas» repagina com 23 fotos (sobrou só a 19 fora) e avisa")
        pg.wait_for_selector("#fase-ok:not([hidden])", timeout=15000)
        ok("1 arquivo" in pg.inner_text("#ok-box"), "geração recomeça e conclui")
        # estados de revisão
        pg.goto(BASE + "/app/editor/gerar/#estado-concluido"); pg.wait_for_timeout(300)
        ok(pg.locator("#fase-ok").is_visible(), "#estado-concluido abre direto o concluído")
        pg.goto(BASE + "/app/editor/gerar/#estado-gerando"); pg.wait_for_timeout(300)
        ok("Folha 3 de 6" in pg.inner_text("#lbl"), "#estado-gerando para na «Folha 3 de 6»")
        # imagens sem ZIP: muitos arquivos
        pg.goto(BASE + "/app/editor/exportar/"); pg.wait_for_timeout(300)
        pg.click("label.fmt:nth-child(4)"); pg.evaluate("document.getElementById('zip').click()"); gerar(pg)
        ok("Polaroid 1 de 24" in pg.inner_text("#lbl"), "polaroids avulsas contam «Polaroid 1 de 24»")
        pg.goto(BASE + "/app/editor/gerar/#estado-concluido"); pg.wait_for_timeout(300)
        ok("24 arquivos" in pg.inner_text("#ok-box") and not pg.locator("#b-imprimir").is_visible(), "24 imagens: 24 arquivos e sem «Imprimir agora»")
        # celular
        pg.set_viewport_size({"width": 390, "height": 844}); pg.evaluate("sessionStorage.clear()")
        ate_exportar(pg, True); gerar(pg)
        pg.goto(BASE + "/app/editor/gerar/#estado-concluido"); pg.wait_for_timeout(300)
        ok(not pg.locator("#b-imprimir").is_visible() and pg.evaluate("document.documentElement.scrollWidth<=innerWidth"), "390: sem «Imprimir agora» e sem rolagem lateral")
        b.close()
finally:
    srv.terminate()
ok(not erros, "sem erro de script " + str(erros))
print(f"\n{'✖ ' + str(len(falhas)) + ' falha(s)' if falhas else '✔ Gerar: sem falhas'}"); sys.exit(1 if falhas else 0)
