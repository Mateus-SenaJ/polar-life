# T-04: falha de leitura (fotos 7 e 19) no estilo T-31. Uso: python3 tests/e2e-py/testar-processando.py
import subprocess, sys, time, os, tempfile
from playwright.sync_api import sync_playwright
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "site")
PORTA = 8810; BASE = f"http://localhost:{PORTA}"
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
falhas, erros = [], []
def ok(c, m):
    print(("ok    " if c else "FALHA ") + m)
    if not c: falhas.append(m)
try:
    time.sleep(1)
    d = tempfile.mkdtemp(); pdf = os.path.join(d, "documento.pdf"); jpg = os.path.join(d, "troca.jpg")
    open(pdf, "wb").write(b"%PDF-1.4"); open(jpg, "wb").write(b"\xff\xd8\xff")
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 390, "height": 900})
        pg.on("pageerror", lambda e: erros.append(str(e)))
        pg.goto(BASE + "/app/processando/#erro"); pg.wait_for_timeout(300)
        ok(pg.inner_text("#err-t") == "Não foi possível ler 2 fotos", "título T-31: «Não foi possível ler 2 fotos»")
        d_ = pg.inner_text("#err-d")
        ok("As fotos 7 e 19 estão danificadas ou ficaram indisponíveis." in d_ and "As outras 22 seguem prontas." in d_, "frase cita as fotos 7 e 19 e as 22 prontas")
        ok(pg.get_attribute("#errbox", "role") == "alert", "erro com role=alert ao terminar")
        ok(pg.eval_on_selector("#errbox", "e=>getComputedStyle(e).borderTopWidth") == "2px" and pg.locator("#errbox > svg").count() == 1, "erro = ✕ + borda 2 px")
        ok(pg.locator("#fail button[data-a=retry]").count() == 2 and pg.locator("#fail button[data-a=swap]").count() == 2, "«Tentar de novo» e «Trocar foto» em cada foto")
        ok(pg.evaluate("document.documentElement.scrollWidth<=innerWidth"), "390 px sem rolagem horizontal")
        # foto 7: tentar de novo funciona
        pg.locator("#fail button[data-a=retry]").first.click(); pg.wait_for_timeout(1300)
        ok(pg.inner_text("#err-t") == "Não foi possível ler 1 foto" and "A foto 19 está danificada" in pg.inner_text("#err-d"), "foto 7 recuperada; sobra a 19 no singular")
        # foto 19: tentar de novo continua falhando, com aviso
        pg.locator("#fail button[data-a=retry]").first.click(); pg.wait_for_timeout(1300)
        ok(pg.is_visible("#toast") and "Ainda não foi possível" in pg.inner_text("#toast-t"), "foto 19: tentar de novo avisa que ainda falha")
        # trocar foto: arquivo inválido é recusado
        with pg.expect_file_chooser() as fc:
            pg.locator("#fail button[data-a=swap]").first.click()
        fc.value.set_files(pdf); pg.wait_for_timeout(200)
        ok(pg.locator("#fail li").count() == 1 and "não é uma foto" in pg.inner_text("#toast-t"), "trocar por PDF: recusado com aviso, foto 19 segue na lista")
        # trocar foto: arquivo válido resolve
        with pg.expect_file_chooser() as fc:
            pg.locator("#fail button[data-a=swap]").first.click()
        fc.value.set_files(jpg); pg.wait_for_timeout(300)
        ok(pg.locator("#errbox").is_hidden() and pg.is_visible("#done"), "trocar por JPEG: erro some e aparece «Concluído»")
        ok("Continuar com 24 fotos" in pg.inner_text("#go-t"), "botão «Continuar com 24 fotos»")
        pg.goto(BASE + "/app/processando/#concluido"); pg.wait_for_timeout(300)
        ok(pg.locator("#errbox").is_hidden(), "#concluido sem erro")
        b.close()
    ok(not erros, f"sem erro de script {erros}")
finally:
    srv.terminate()
print(f"\n{len(falhas)} falha(s)"); sys.exit(1 if falhas else 0)
