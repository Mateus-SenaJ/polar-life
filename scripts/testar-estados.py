# T-31 Estados vazios e erros + 404. Uso: python3 scripts/testar-estados.py
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
PORTA = 8808; BASE = f"http://localhost:{PORTA}"
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
falhas, erros = [], []
def ok(c, m):
    print(("ok    " if c else "FALHA ") + m)
    if not c: falhas.append(m)
try:
    time.sleep(1)
    with sync_playwright() as p:
        b = p.chromium.launch()
        def nova(w=1440):
            c = b.new_context(viewport={"width": w, "height": 900}); pg = c.new_page()
            pg.on("pageerror", lambda e: erros.append(str(e))); return pg
        pg = nova(); pg.goto(BASE + "/app/estados/"); pg.wait_for_timeout(300)
        ok(pg.locator(".msg").count() == 6, "6 estados: vazio, inválido, leitura, não cabe, sem suporte, carregando")
        ok(pg.locator(".led-btn").count() == 1, "um só LED na tela")
        ok(all(pg.locator(".msg--erro").nth(i).locator("svg.msg__ico").count() == 1 for i in range(3)), "erro = ✕ + texto (nunca só cor)")
        ok(pg.locator(".msg--erro").first.evaluate("e=>getComputedStyle(e).borderTopWidth") == "2px", "erro com borda de 2 px")
        ok("A polaroid não cabe neste papel" in pg.inner_text("#nao-cabe"), "mensagem fixa «A polaroid não cabe neste papel»")
        ok(pg.locator(".esq i").count() == 3 and pg.locator("#carregando[aria-busy=true]").count() == 1, "esqueleto sem cinza, com aria-busy")
        ok(pg.evaluate("document.documentElement.scrollWidth<=innerWidth"), "1440 sem rolagem horizontal")
        pg.goto(BASE + "/404.html"); pg.wait_for_timeout(200)
        ok("Página não encontrada" in pg.inner_text("h1") and pg.locator(".led-btn").count() == 1, "404 com logo vertical e um LED")
        m = nova(390); m.goto(BASE + "/app/estados/"); m.wait_for_timeout(300)
        ok(m.evaluate("document.documentElement.scrollWidth<=innerWidth"), "390 px sem rolagem horizontal")
        ok(m.evaluate("[...document.querySelectorAll('.msg__act .btn2,.msg__act .led-btn')].every(e=>e.getBoundingClientRect().height>=44)"), "botões com 44 px ou mais no celular")
        b.close()
    ok(not erros, f"sem erro de script {erros}")
finally:
    srv.terminate()
print(f"\n{len(falhas)} falha(s)"); sys.exit(1 if falhas else 0)
