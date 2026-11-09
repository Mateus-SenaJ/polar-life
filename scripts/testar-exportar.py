# T-19 · Exportar: trava sem pré-voo, cartões, estimador, volumes, celular. Uso: python3 scripts/testar-exportar.py
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
PORTA = 8801; BASE = f"http://localhost:{PORTA}"
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
falhas, erros = [], []
def ok(c, m):
    print(("ok    " if c else "FALHA ") + m)
    if not c: falhas.append(m)
def pelo_prevoo(pg):
    pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500); pg.click("#go"); pg.wait_for_timeout(250)
    pg.click("#pv-okl"); pg.click("#pv-g"); pg.wait_for_timeout(500)
try:
    time.sleep(1)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1440, "height": 900})
        pg.on("pageerror", lambda e: erros.append(str(e)))
        # 1) direto, sem pré-voo: trava
        pg.goto(BASE + "/app/editor/exportar/"); pg.wait_for_timeout(300)
        ok(pg.locator("#trava").is_visible() and not pg.locator("#corpo").is_visible(), "sem pré-voo, a tela trava e manda revisar")
        pg.click("#trava a"); pg.wait_for_timeout(500)
        ok(pg.locator("#pv-dlg").is_visible(), "«Revisar impressão» abre o pré-voo")
        # 2) pelo pré-voo
        pg.click("#pv-v"); pelo_prevoo(pg)
        ok(pg.url.endswith("/app/editor/exportar/") and pg.locator("#corpo").is_visible(), "«Gerar PDF» do pré-voo leva à Exportar")
        ok("6 folhas · 24 fotos · A4 retrato" in pg.inner_text("#resumo"), "resumo: 6 folhas, 24 fotos, A4 retrato")
        ok(pg.locator("input[name=fmt]:checked").get_attribute("value") == "pdf", "PDF alta qualidade vem marcado")
        ok("58 MB" in pg.inner_text("#est-v") and "1 arquivo" in pg.inner_text("#est-s"), "estimador do PDF: ≈ 58 MB, 1 arquivo")
        ok(pg.locator("#aviso-100").is_visible() and not pg.locator("#opts").is_visible(), "PDF mostra o aviso «Tamanho real (100%)»; sem opções de imagem")
        ok("Gerar PDF (6 folhas)" in pg.inner_text("#go"), "botão «Gerar PDF (6 folhas)»")
        # 3) folhas em PNG 600 → volumes
        pg.click("label.fmt:nth-child(3)"); pg.wait_for_timeout(100)
        ok(pg.locator("#opts").is_visible() and not pg.locator("#aviso-100").is_visible(), "imagens mostram opções (arquivo, resolução, ZIP)")
        pg.evaluate("document.querySelector('input[name=ppi][value=\"600\"]').click()"); pg.wait_for_timeout(100)
        ok("volumes de até 150 MB" in pg.inner_text("#est-s"), "PNG a 600 PPI passa de 150 MB e divide em volumes")
        pg.evaluate("document.querySelector('input[name=tipo][value=jpeg]').click()"); pg.wait_for_timeout(100)
        ok("1 arquivo" in pg.inner_text("#est-s"), "JPEG a 600 PPI cabe em 1 arquivo")
        # 4) polaroids avulsas sem ZIP
        pg.click("label.fmt:nth-child(4)"); pg.evaluate("document.getElementById('zip').click()"); pg.wait_for_timeout(100)
        ok("24 arquivos separados" in pg.inner_text("#est-s") and "Gerar imagens (24 polaroids)" in pg.inner_text("#go"), "polaroids sem ZIP: 24 arquivos separados")
        # 5) teclado: setas trocam o cartão
        pg.focus("input[name=fmt]:checked"); pg.keyboard.press("ArrowUp"); pg.wait_for_timeout(100)
        ok(pg.locator("input[name=fmt]:checked").get_attribute("value") == "folhas", "setas do teclado trocam o formato")
        # 6) guardar opções
        pg.click("#go"); pg.wait_for_timeout(100)
        ok(pg.evaluate("JSON.parse(sessionStorage.getItem('pl-exportar')).f") == "folhas", "«Gerar» guarda as opções escolhidas")
        # 7) projeto muda depois do pré-voo: perde a validade
        pg.evaluate("sessionStorage.setItem('pl-folhas',JSON.stringify({papel:'A3',margem:10,gap:4}))")
        pg.reload(); pg.wait_for_timeout(300)
        ok(pg.locator("#trava").is_visible() and "mudou" in pg.inner_text("#trava").lower(), "mudou o projeto: pede nova revisão")
        # 8) celular 390: limite de 60 MB, sem rolagem lateral
        pg.set_viewport_size({"width": 390, "height": 844}); pg.evaluate("sessionStorage.clear()")
        pelo_prevoo_m = lambda: (pg.goto(BASE + "/app/editor/"), pg.wait_for_timeout(500), pg.click("#go2"), pg.wait_for_timeout(250), pg.click("#pv-okl"), pg.click("#pv-g"), pg.wait_for_timeout(500))
        pelo_prevoo_m()
        ok("60 MB" in pg.inner_text(".est__n") and "1 arquivo" in pg.inner_text("#est-s"), "celular: limite de 60 MB; o PDF de ≈ 58 MB ainda cabe em 1 arquivo")
        pg.click("label.fmt:nth-child(3)"); pg.evaluate("document.querySelector('input[name=ppi][value=\"600\"]').click()"); pg.wait_for_timeout(100)
        ok("volumes de até 60 MB" in pg.inner_text("#est-s") and "celular" in pg.inner_text("#est-s"), "celular: PNG a 600 PPI divide em volumes de até 60 MB")
        ok(pg.evaluate("document.documentElement.scrollWidth<=innerWidth"), "390: sem rolagem horizontal")
        b.close()
finally:
    srv.terminate()
ok(not erros, "sem erro de script " + str(erros))
print(f"\n{'✖ ' + str(len(falhas)) + ' falha(s)' if falhas else '✔ Exportar: sem falhas'}"); sys.exit(1 if falhas else 0)
