# T-03: arquivo inválido no estilo T-31. Uso: python3 scripts/testar-adicionar.py
import subprocess, sys, time, os, tempfile
from playwright.sync_api import sync_playwright
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
PORTA = 8809; BASE = f"http://localhost:{PORTA}"
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
falhas, erros = [], []
def ok(c, m):
    print(("ok    " if c else "FALHA ") + m)
    if not c: falhas.append(m)
try:
    time.sleep(1)
    d = tempfile.mkdtemp(); pdf = os.path.join(d, "documento.pdf"); jpg = os.path.join(d, "a.jpg")
    open(pdf, "wb").write(b"%PDF-1.4"); open(jpg, "wb").write(b"\xff\xd8\xff")
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 390, "height": 900})
        pg.on("pageerror", lambda e: erros.append(str(e)))
        pg.goto(BASE + "/app/adicionar-fotos/"); pg.wait_for_timeout(300)
        ok(pg.locator("a[href='../conexoes/']").count() == 1, "link «Verificar conexão» aponta para a Central")
        pg.set_input_files("#f-device", pdf); pg.wait_for_timeout(200)
        t = pg.inner_text("#got")
        ok("Este arquivo não é uma foto" in t and "documento.pdf" in t, "um arquivo inválido: mensagem T-31 com o nome")
        ok(pg.locator(".msg--err svg").count() == 1 and pg.eval_on_selector(".msg--err", "e=>getComputedStyle(e).borderTopWidth") == "2px", "erro = ✕ + borda 2 px")
        pg.set_input_files("#f-device", [pdf, jpg]); pg.wait_for_timeout(200)
        t = pg.inner_text("#got")
        ok("1 foto escolhida" in t and "Este arquivo não é uma foto" in t, "mistura: foto aceita + erro")
        ok(pg.evaluate("document.documentElement.scrollWidth<=innerWidth"), "390 px sem rolagem horizontal")
        b.close()
    ok(not erros, f"sem erro de script {erros}")
finally:
    srv.terminate()
print(f"\n{len(falhas)} falha(s)"); sys.exit(1 if falhas else 0)
