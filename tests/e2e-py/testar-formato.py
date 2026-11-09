#!/usr/bin/env python3
"""Teste em navegador: pop-up «Trocar formato» (T-12), T-07 com o formato e a legenda do Quadro, ida e volta.
Uso: python3 tests/e2e-py/testar-formato.py"""
import subprocess, sys, time, pathlib
from playwright.sync_api import sync_playwright
RAIZ = pathlib.Path(__file__).resolve().parents[2] / "site"
PORTA = 8792; BASE = f"http://localhost:{PORTA}"
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2); falhas = []; erros = []
def ok(c, m):
    print(("ok    " if c else "FALHA ") + m)
    if not c: falhas.append(m)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1440, "height": 900})
        pg.on("pageerror", lambda e: erros.append(str(e)))
        t = lambda s: pg.inner_text(s).strip().lower()
        pg.goto(BASE + "/app/editor/quadro/#foto-3"); pg.wait_for_timeout(400)
        pg.click("#tab-molduras"); pg.wait_for_timeout(100)
        pg.click('[data-fmt="mini"]'); pg.wait_for_timeout(100)
        ok(pg.is_visible("#fmt-dlg") and t("#fmt-t") == "trocar para mini quadrado?", "pop-up abre com o título do formato")
        ok(t("#fmt-a3") == "6 folhas em a4" and t("#fmt-d3") == "3 folhas em a4", "antes 6 folhas, depois 3 folhas (A4): " + t("#fmt-a3") + " / " + t("#fmt-d3"))
        ok("88 × 107" in t("#fmt-a2") and "60 × 73" in t("#fmt-d2"), "medidas antes e depois")
        ok(pg.evaluate("document.activeElement.id") == "fmt-nao", "foco inicial em «Manter formato atual»")
        pg.keyboard.press("Tab"); pg.keyboard.press("Tab"); ok(pg.evaluate("document.activeElement.id") == "fmt-nao", "foco preso")
        pg.keyboard.press("Escape"); pg.wait_for_timeout(100)
        ok(pg.is_hidden("#fmt-dlg") and pg.evaluate("PLQ.ST()[0].fr.fmt") == "classico", "Esc mantém o formato")
        pg.click('[data-fmt="mini"]'); pg.click("#fmt-nao"); pg.wait_for_timeout(100)
        ok(pg.evaluate("PLQ.ST()[0].fr.fmt") == "classico", "«Manter formato atual» mantém")
        pg.click('[data-fmt="classico"]'); pg.wait_for_timeout(100)
        ok(pg.is_hidden("#fmt-dlg"), "clicar no formato já ativo não abre pop-up")
        pg.click('[data-fmt="mini"]'); pg.click("#fmt-sim"); pg.wait_for_timeout(150)
        ok(pg.evaluate("PLQ.ST()[0].fr.fmt") == "mini" and pg.evaluate("PLQ.ST()[0].fr.w") == 60, "«Trocar formato» aplica")
        pg.keyboard.press("Control+z"); pg.wait_for_timeout(100)
        ok(pg.evaluate("PLQ.ST()[0].fr.fmt") == "classico", "desfazer volta ao Clássico")
        pg.keyboard.press("Control+y"); pg.wait_for_timeout(100)
        # legenda própria na foto 3
        pg.evaluate("PLQ.ST()[3].txt='Olá Serra'; PLQ.commit('t')")
        # estilo da legenda (T-10): fonte, cor, caixa, estilo pronto e data desligada
        pg.evaluate("var l=PLQ.ST()[0].leg||(PLQ.ST()[0].leg={pos:'abaixo',preset:'simples',dx:0,dy:0,inc:0,txt:{on:true,font:'Caveat',pt:16,fit:false,caixa:'normal',esp:0,cor:'preto'},data:{on:true,font:'IBM Plex Mono',pt:8,fmt:0,cor:'preto'},loc:{on:true,font:'IBM Plex Mono',pt:8,cor:'preto'}}); l.txt.font='Special Elite'; l.txt.cor='azul'; l.txt.caixa='maiusc'; l.preset='carimbo'; l.data.on=false; PLQ.commit('t')")
        # T-07
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500)
        cap = pg.locator(".pol__cap").first
        est = cap.evaluate("e=>getComputedStyle(e)")
        ok("Special Elite" in est["fontFamily"] and est["color"] == "rgb(0, 97, 148)", "folha usa a fonte e a cor da legenda do Quadro")
        ok(cap.inner_text() == cap.inner_text().upper() and pg.locator("figcaption[data-preset=carimbo]").count() > 0, "folha aplica caixa alta e o estilo Carimbo")
        def leg(js):  # na T-07 não há PLQ: edita o estado gravado
            pg.evaluate("(()=>{var q=JSON.parse(sessionStorage.getItem('pl-quadro')),l=q[0].leg;"+js+";sessionStorage.setItem('pl-quadro',JSON.stringify(q))})()")
        # data em outro formato e posição «Ambas» com deslocamento
        leg("l.data.on=true; l.data.fmt=9; l.pos='ambas'; l.dy=1")
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500)
        ok(pg.locator(".pol__meta time").first.inner_text() == "14 de julho", "data na folha usa o formato escolhido")
        ok(pg.locator(".pol__top .pol__cap").count() > 0 and pg.locator("figcaption:not(.pol__top) .pol__cap").count() == 0, "«Ambas»: texto na margem de cima, data e local embaixo")
        leg("l.pos='acima'")
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500)
        ok(pg.locator(".pol__top .pol__meta").count() > 0, "«Acima»: tudo na margem de cima")
        # metadados por foto (T-13): cidade e data editadas aparecem na folha
        leg("l.pos='abaixo'; l.data.on=true; l.data.fmt=1; l.dy=0; q[1].meta={iso:'2025-12-24T10:00',ds:'manual',dh:0,c:'Gramado',cs:'manual',o:'Do aparelho',conv:false}")
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500)
        mt = pg.locator(".pol__meta").first.inner_text()
        ok("24/12/2025" in mt and "Gramado" in mt and "Jordão" not in mt, "folha mostra data e cidade editadas na foto (T-13)")
        leg("q[1].meta.c=''")
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500)
        ok("Gramado" not in pg.locator(".pol__meta").first.inner_text(), "cidade vazia some da folha")
        # área segura: texto enorme sem ajuste avisa; com «Ajustar para caber» deixa de avisar
        leg("l.data.fmt=6; l.loc.on=false; l.txt.caixa='normal'; l.txt.font='Caveat'; l.txt.pt=16; l.txt.fit=false; l.txt.caixa='normal'; q[1].txt='Legenda comprida demais pra caber aqui'; q[2].txt='Legenda comprida demais pra caber aqui'; q[3].txt='Legenda comprida demais pra caber aqui'; q[4].txt='Legenda comprida demais pra caber aqui'")
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500)
        ok(pg.locator("#aviso-leg").is_visible() and "área segura" in pg.inner_text("#aviso-leg").lower(), "aviso de área segura aparece com legenda grande")
        leg("l.txt.fit=true")
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500)
        ok(not pg.locator("#aviso-leg").is_visible(), "«Ajustar para caber» encolhe a legenda e o aviso some")
        leg("l.txt.fit=false; l.txt.pt=16; l.txt.caixa='maiusc'; q[1].txt='Dias de sol'; q[2].txt='Nós dois'; q[3].txt='Olá Serra'; q[4].txt='Meu parceiro'")
        leg("l.pos='abaixo'; l.data.on=false; l.loc.on=true")
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(500)
        ok(pg.locator(".pol__meta time").count() == 0 and "Campos do Jordão" in pg.locator(".pol__meta").first.inner_text(), "data desligada some da folha; o local fica")
        txt = pg.inner_text("body")
        ok("9 por folha · 3 folhas" in txt, "T-07 pagina com Mini quadrado: 9 por folha, 3 folhas")
        ok("OLÁ SERRA" in pg.content(), "legenda da foto 3 aparece na folha")
        # troca o papel na T-07 e volta ao Quadro
        pg.select_option("#papel", "A3"); pg.wait_for_timeout(200)
        a3 = pg.inner_text("body")
        pg.goto(BASE + "/app/editor/quadro/#foto-3"); pg.wait_for_timeout(400)
        ok(pg.evaluate("PLQ.ST()[0].fr.fmt") == "mini" and pg.evaluate("PLQ.ST()[3].txt") == "Olá Serra", "Quadro restaura formato e legenda")
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(400)
        ok(pg.input_value("#papel") == "A3", "T-07 mantém o papel A3 depois de ir ao Quadro")
        b.close()
finally:
    srv.terminate()
ok(not erros, "sem erro de script " + str(erros))
print(f"\n{'✖ ' + str(len(falhas)) + ' falha(s)' if falhas else '✔ Formato: sem falhas'}"); sys.exit(1 if falhas else 0)
