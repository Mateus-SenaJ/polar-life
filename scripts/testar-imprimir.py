# T-21 · Imprimir agora e calibração. Uso: python3 scripts/testar-imprimir.py
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
PORTA = 8805; BASE = f"http://localhost:{PORTA}"
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
falhas, erros = [], []
def ok(c, m):
    print(("ok    " if c else "FALHA ") + m)
    if not c: falhas.append(m)
try:
    time.sleep(1)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1440, "height": 900})
        pg.on("pageerror", lambda e: erros.append(str(e)))
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500); pg.click("#go"); pg.wait_for_timeout(250)
        pg.click("#pv-okl"); pg.click("#pv-g"); pg.wait_for_timeout(500); pg.click("#go"); pg.wait_for_timeout(300)
        pg.goto(BASE + "/app/editor/gerar/#estado-concluido"); pg.wait_for_timeout(300)
        pg.click("#b-imprimir"); pg.wait_for_timeout(300)
        ok(pg.url.endswith("/app/editor/imprimir/"), "«Imprimir agora» do concluído leva à T-21")
        t = pg.inner_text("#corpo")
        ok("Tamanho real (100%)" in t and "Nenhuma" in t and "cabeçalhos e rodapés" in t, "dicas: Tamanho real, margens Nenhuma, sem cabeçalhos e rodapés")
        ok("A4 · 6 folhas · retrato" in pg.inner_text("#info-papel") and "Imprimir agora (6 folhas)" in pg.inner_text("#imprimir"), "papel e «Imprimir agora (6 folhas)»")
        ok(pg.locator("#aviso-cal").is_visible(), "sem calibração: aviso com a página de teste")
        pg.click("#imprimir"); ok(pg.locator("#toast").is_visible(), "«Imprimir agora» responde (gerador ainda não ligado)")
        # passo 1
        pg.click("#teste"); pg.wait_for_timeout(500)
        pg.wait_for_selector("#p1.feito", timeout=3000)
        txt = pg.evaluate("document.getElementById('quadro-teste').contentDocument.body.innerText")
        css = pg.evaluate("document.getElementById('quadro-teste').contentDocument.head.innerHTML")
        ok("Traço horizontal · 100 mm" in txt and "Traço vertical · 100 mm" in txt, "página de teste tem os dois traços de 100 mm")
        ok("@page{size:210mm 297mm;margin:0}" in css and "width:100mm" in css, "página de teste no tamanho do papel, sem margem")
        ok(not pg.locator("#bloq").is_visible(), "impressão aberta: sem aviso de bloqueio")
        # passo 2
        pg.fill("#mx", "50"); pg.wait_for_timeout(100)
        ok(pg.locator("#m-erro").is_visible() and pg.locator("#guardar").is_disabled() and pg.get_attribute("#mx", "aria-invalid") == "true", "medida fora de 80–120 mm: erro com ✕ e «Guardar» desativado")
        pg.fill("#mx", "99,5"); pg.fill("#my", "100"); pg.wait_for_timeout(100)
        ok("horizontal 100,5%" in pg.inner_text("#res") and "vertical 100,0%" in pg.inner_text("#res") and pg.locator("#guardar").is_enabled(), "99,5 mm vira escala de 100,5% (vírgula aceita)")
        # passo 3
        pg.fill("#nome", "HP Casa"); pg.click("#guardar"); pg.wait_for_timeout(200)
        ok("Calibrado em" in pg.inner_text("#cal-ok") and "HP Casa · A4" in pg.inner_text("#cal-ok") and not pg.locator("#aviso-cal").is_visible(), "guardar: «Calibrado em DD/MM/AAAA · HP Casa · A4»")
        ok(pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('pl-calib')))[0]") == "HP Casa|A4", "perfil guardado por impressora e papel")
        pg.reload(); pg.wait_for_timeout(300)
        ok(pg.locator("#cal-ok").is_visible() and all(pg.locator(f"#p{i}.feito").count() == 1 for i in (1, 2, 3)), "recarregar mantém a calibração e os 3 passos marcados")
        # pré-voo reconhece
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500); pg.click("#go"); pg.wait_for_timeout(250)
        ok("não foi calibrada" not in pg.inner_text("#pv-dlg"), "pré-voo deixa de pedir calibração")
        pg.click("#pv-v")
        # bloqueio de pop-up
        pg.goto(BASE + "/app/editor/imprimir/#estado-bloqueio"); pg.wait_for_timeout(300)
        ok("bloqueou a janela de impressão" in pg.inner_text("#bloq") and pg.evaluate("document.activeElement.id") == "bloq", "#estado-bloqueio: aviso com ✕, instrução e foco")
        # celular
        pg.set_viewport_size({"width": 390, "height": 844}); pg.goto(BASE + "/app/editor/imprimir/"); pg.wait_for_timeout(300)
        ok(pg.locator("#so-desktop").is_visible() and not pg.locator("#corpo").is_visible() and pg.evaluate("document.documentElement.scrollWidth<=innerWidth"), "390: «só existe no computador», sem rolagem lateral")
        b.close()
finally:
    srv.terminate()
ok(not erros, "sem erro de script " + str(erros))
print(f"\n{'✖ ' + str(len(falhas)) + ' falha(s)' if falhas else '✔ Imprimir: sem falhas'}"); sys.exit(1 if falhas else 0)
