# T-23 Central de conexões e T-24 Verificação. Uso: python3 tests/e2e-py/testar-conexoes.py
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "site")
PORTA = 8807; BASE = f"http://localhost:{PORTA}"
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
falhas, erros = [], []
def ok(c, m):
    print(("ok    " if c else "FALHA ") + m)
    if not c: falhas.append(m)
try:
    time.sleep(1)
    with sync_playwright() as p:
        b = p.chromium.launch()
        def nova(w=1440, sem_share=False):
            c = b.new_context(viewport={"width": w, "height": 900})
            if sem_share: c.add_init_script("delete Navigator.prototype.canShare;delete Navigator.prototype.share;")
            pg = c.new_page(); pg.on("pageerror", lambda e: erros.append(str(e))); return pg
        pg = nova(); pg.goto(BASE + "/app/conexoes/"); pg.wait_for_timeout(300)
        ok(pg.locator(".cx").count() == 9, "9 cartões em 2 seções")
        ok(pg.locator("#trazer .cx").count() == 6 and pg.locator("#levar .cx").count() == 3, "Trazer fotos (6) e Levar para as redes (3)")
        ok("Suas fotos continuam no seu aparelho. Você escolhe o que trazer." in pg.inner_text(".head"), "texto fixo do topo")
        ok(pg.locator(".led-btn").count() == 1, "um só LED na tela")
        ok(all(pg.locator(".sel").nth(i).locator("svg").count() == 1 for i in range(9)), "todo selo de estado tem ícone + texto")
        txt = pg.inner_text("#levar")
        ok("Conectado" not in txt and "Importar" not in txt.replace("Importar por", ""), "Instagram e Facebook nunca «Conectado» nem «Importar»")
        ok(pg.locator("#aparelho").is_visible(), "«Escolher do aparelho» sempre presente")
        # Ver como fazer
        pg.click("#instagram >> xpath=ancestor::article//button[@data-g]" if False else "button[data-g=rede] >> nth=0"); pg.wait_for_timeout(200)
        ok(pg.locator("#dlg").is_visible() and pg.locator(".pas li").count() == 3, "«Ver como fazer» abre folha com 3 passos")
        pg.keyboard.press("Escape"); ok(pg.locator("#dlg").is_hidden(), "Esc fecha a folha")
        # Testar conexão do aparelho: não menciona baixar foto
        pg.click("button[data-t=dev]" if False else "button[data-t=aparelho]"); pg.wait_for_timeout(2200)
        ok(pg.locator(".lin li").count() == 3, "teste do aparelho roda 3 linhas")
        ok("Tudo pronto" in pg.inner_text("#rs") or "aviso" in pg.inner_text("#rs"), "resumo em texto no fim")
        ok("baix" not in pg.inner_text("#dlg-c").lower().replace("baixar imagem", ""), "o teste não fala em baixar fotos")
        pg.keyboard.press("Escape")
        # Instagram: API indisponível
        pg.click("button[data-t=instagram]"); pg.wait_for_timeout(2200)
        ok("Indisponível por regra da plataforma" in pg.inner_text("#ln") and "Use Do aparelho" in pg.inner_text("#rs"), "Instagram: API indisponível e resumo manda para Do aparelho")
        pg.keyboard.press("Escape")
        # Cancelar durante o teste
        pg.click("button[data-t=aparelho]"); pg.wait_for_timeout(200); pg.click("#cancela"); pg.wait_for_timeout(1500)
        ok(pg.locator("#dlg").is_hidden(), "Cancelar encerra o teste")
        # sem suporte a compartilhar → atenção, não erro
        pg2 = nova(sem_share=True); pg2.goto(BASE + "/app/conexoes/"); pg2.click("button[data-t=compartilhar]"); pg2.wait_for_timeout(2200)
        ok("Atenção" in pg2.inner_text("#ln") and "baixado" in pg2.inner_text("#ln"), "sem canShare: atenção e cai em «Baixar»")
        # estados de revisão
        pg3 = nova(); pg3.goto(BASE + "/app/conexoes/#estado-erro"); pg3.wait_for_timeout(300)
        ok("Não foi possível verificar agora" in pg3.inner_text("#levar") and "Tentar de novo" in pg3.inner_text("#levar"), "#estado-erro mostra erro temporário com «Tentar de novo»")
        # celular
        pm = nova(390); pm.goto(BASE + "/app/conexoes/"); pm.wait_for_timeout(300)
        ok(pm.evaluate("document.documentElement.scrollWidth<=window.innerWidth"), "390 px sem rolagem horizontal")
        ok(pm.evaluate("[...document.querySelectorAll('.btn2,.led-btn')].every(e=>e.getBoundingClientRect().height>=44)"), "botões com 44 px ou mais no celular")
        b.close()
    ok(not erros, "sem erro de script " + str(erros))
finally:
    srv.terminate()
print("\n%d falha(s)" % len(falhas)); sys.exit(1 if falhas else 0)
