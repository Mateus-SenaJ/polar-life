# T-18 · Pré-voo: 3 severidades, bloqueio, confirmação, Esc, foco, celular. Uso: python3 scripts/testar-prevoo.py
import subprocess, sys, time, os
from playwright.sync_api import sync_playwright
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "site")
PORTA = 8797; BASE = f"http://localhost:{PORTA}"
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
falhas = []
def ok(c, m):
    print(("ok    " if c else "FALHA ") + m)
    if not c: falhas.append(m)
erros = []
def abre(pg):
    pg.click("#go"); pg.wait_for_timeout(250)
try:
    time.sleep(1)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1440, "height": 900})
        pg.on("pageerror", lambda e: erros.append(str(e)))
        # 1) projeto de exemplo: foto 12 com 140 PPI + sem calibração → pede confirmação; nada bloqueia
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500)
        abre(pg)
        d = pg.locator("#pv-dlg")
        ok(d.is_visible() and "Tudo pronto para o papel?" in d.inner_text(), "pop-up «Tudo pronto para o papel?» abre")
        t = d.inner_text().lower()
        ok("pede confirmação" in t and "informa" in t and "bloqueia" not in t, "mostra «Pede confirmação» e «Informa»; sem «Bloqueia»")
        ok("foto 12 (140 ppi)" in t, "foto 12 com 140 PPI aparece")
        ok("6" == pg.inner_text("#pv-f").strip() and "%" in pg.inner_text("#pv-a"), "grade: total de folhas e aproveitamento")
        ok(pg.locator("#pv-g").is_disabled(), "«Gerar PDF» desativado até confirmar")
        pg.click("#pv-okl")
        ok(pg.locator("#pv-g").is_enabled(), "«Revisei e quero continuar» libera «Gerar PDF»")
        ok("Gerar PDF (6 folhas)" in pg.inner_text("#pv-g"), "rótulo «Gerar PDF (6 folhas)»")
        pg.keyboard.press("Escape"); pg.wait_for_timeout(100)
        ok(not d.is_visible() and pg.evaluate("document.activeElement.id") == "go", "Esc fecha e devolve o foco")
        # 2) bloqueio: guias e contorno juntos
        pg.evaluate("sessionStorage.setItem('pl-folhas',JSON.stringify({papel:'A4',margem:10,gap:4,guias:true,contorno:true}))")
        pg.reload(); pg.wait_for_timeout(500); abre(pg)
        ok("bloqueia" in pg.inner_text("#pv-dlg").lower() and pg.locator("#pv-g").is_disabled() and not pg.locator("#pv-okl").is_visible(), "guias × contorno bloqueia; sem caixa de confirmação")
        pg.click("#pv-v")
        # 3) polaroid não cabe
        pg.evaluate("sessionStorage.setItem('pl-folhas',JSON.stringify({papel:'10x15',margem:40,gap:4,guias:true,contorno:false}))")
        pg.reload(); pg.wait_for_timeout(500); abre(pg)
        ok("não cabe" in pg.inner_text("#pv-dlg").lower() and pg.locator("#pv-g").is_disabled(), "polaroid que não cabe bloqueia")
        pg.click("#pv-v")
        # 4) coordenadas no texto bloqueiam
        pg.evaluate("sessionStorage.removeItem('pl-folhas')")
        pg.goto(BASE + "/app/editor/quadro/#foto-2"); pg.wait_for_timeout(400)
        pg.evaluate("PLQ.ST()[2].txt='-22.7500, -45.6000'; PLQ.commit('t')")
        pg.click("#go"); pg.wait_for_timeout(700)
        ok(pg.url.endswith("/app/editor/") and pg.locator("#pv-dlg").is_visible(), "«Revisar impressão» do Quadro abre o pré-voo nas Folhas")
        ok("coordenadas" in pg.inner_text("#pv-dlg").lower() and pg.locator("#pv-g").is_disabled(), "texto com coordenadas bloqueia")
        # 5) legenda fora da área segura em qualquer folha bloqueia
        pg.click("#pv-v")
        pg.evaluate("(()=>{var q=JSON.parse(sessionStorage.getItem('pl-quadro'));q[2].txt='Dias de sol';q[5].txt='Uma legenda muito mais comprida que a janela inteira da polaroid';q[0].leg={pos:'abaixo',preset:'simples',dx:0,dy:0,inc:0,txt:{on:true,font:'Caveat',pt:32,fit:false,caixa:'normal',esp:0,cor:'preto'},data:{on:true,font:'IBM Plex Mono',pt:8,fmt:0,cor:'preto'},loc:{on:true,font:'IBM Plex Mono',pt:8,cor:'preto',uf:'sigla',pais:'oculto',ocBR:true,sep:', ',ordem:'cidade'}};sessionStorage.setItem('pl-quadro',JSON.stringify(q))})()")
        pg.reload(); pg.wait_for_timeout(500); abre(pg)
        ok("área segura" in pg.inner_text("#pv-dlg").lower() and pg.locator("#pv-g").is_disabled(), "legenda fora da área segura bloqueia (todas as folhas)")
        pg.click("#pv-v")
        # 6) celular 390: sem rolagem horizontal, botões em coluna
        pg.set_viewport_size({"width": 390, "height": 800}); pg.evaluate("sessionStorage.clear()")
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500); pg.click("#go2"); pg.wait_for_timeout(250)
        ok(pg.evaluate("document.documentElement.scrollWidth<=innerWidth") and pg.locator("#pv-dlg").is_visible(), "390: pop-up sem rolagem horizontal")
        b.close()
finally:
    srv.terminate()
ok(not erros, "sem erro de script " + str(erros))
print(f"\n{'✖ ' + str(len(falhas)) + ' falha(s)' if falhas else '✔ Pré-voo: sem falhas'}"); sys.exit(1 if falhas else 0)
