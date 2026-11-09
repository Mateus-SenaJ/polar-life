# T-31 «Carregando»: esqueleto na T-01 e no editor (T-07, T-08). Uso: python3 scripts/testar-esqueleto.py
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
PORTA = 8811; BASE = f"http://localhost:{PORTA}"
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
falhas, erros = [], []
def ok(c, m):
    print(("ok    " if c else "FALHA ") + m)
    if not c: falhas.append(m)
try:
    time.sleep(1)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 390, "height": 900})
        pg.on("pageerror", lambda e: erros.append(str(e)))
        # T-01
        pg.goto(BASE + "/app/#carregando"); pg.wait_for_timeout(900)
        ok(pg.is_visible(".esq-sk--home") and pg.get_attribute(".esq-sk--home", "role") == "status", "T-01 #carregando: esqueleto visível com role=status")
        ok(not pg.is_visible("#lista") and not pg.is_visible("#top"), "T-01 #carregando: lista e título escondidos")
        ok("100% local" in pg.inner_text(".esq-sk--home") and pg.eval_on_selector(".esq-sk__msg", "e=>getComputedStyle(e).borderTopWidth") == "1px", "T-01: mensagem de informação (cadeado azul, borda 1 px)")
        ok(pg.evaluate("document.documentElement.scrollWidth<=innerWidth"), "T-01 390 px sem rolagem horizontal")
        pg.goto(BASE + "/app/"); pg.wait_for_timeout(1400)
        ok(not pg.is_visible(".esq-sk--home") and pg.is_visible("#lista") and pg.is_visible("#card1"), "T-01 normal: esqueleto some e o projeto aparece")
        pg.goto(BASE + "/app/#vazia"); pg.wait_for_timeout(1400)
        ok(pg.is_visible("#vazio") and not pg.is_visible("#lista"), "T-01 #vazia: estado vazio preservado")
        # editores
        for rota, mesa, nome in (("/app/editor/", "#mesa", "T-07"), ("/app/editor/quadro/", "#main .grid", "T-08")):
            pg.set_viewport_size({"width": 1440, "height": 900})
            pg.goto(BASE + rota + "#carregando"); pg.wait_for_timeout(900)
            ok(pg.is_visible(".esq-sk--ed"), f"{nome} #carregando: esqueleto visível")
            box = pg.eval_on_selector(".esq-sk--ed", "e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]}")
            ok(box[0] >= 200 and box[1] >= 60 and box[2] >= 1430 and box[3] >= 890, f"{nome}: camada cobre a área da mesa (sem cobrir cabeçalho e trilho) {box}")
            ok(pg.eval_on_selector(".esq-sk--ed i", "e=>getComputedStyle(e).backgroundColor") == "rgb(255, 255, 255)", f"{nome}: sem cinza (blocos brancos com borda)")
            pg.goto(BASE + rota); pg.wait_for_timeout(1400)
            ok(not pg.is_visible(".esq-sk--ed") and pg.is_visible(mesa), f"{nome} normal: esqueleto some e a mesa aparece")
            pg.set_viewport_size({"width": 390, "height": 800})
            pg.goto(BASE + rota + "#carregando"); pg.wait_for_timeout(600)
            ok(pg.is_visible(".esq-sk--ed") and pg.evaluate("document.documentElement.scrollWidth<=innerWidth"), f"{nome} 390 px: esqueleto sem rolagem horizontal")
        # movimento reduzido
        ctx = b.new_context(reduced_motion="reduce", viewport={"width": 390, "height": 800}); r = ctx.new_page()
        r.goto(BASE + "/app/#carregando"); r.wait_for_timeout(500)
        ok(r.evaluate("getComputedStyle(document.querySelector('.esq-sk i'),'::after').animationName") == "none", "prefers-reduced-motion: sem animação")
        b.close()
    ok(not erros, f"sem erro de script {erros}")
finally:
    srv.terminate()
print(f"\n{len(falhas)} falha(s)"); sys.exit(1 if falhas else 0)
