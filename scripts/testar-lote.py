#!/usr/bin/env python3
"""Teste em navegador (Chromium via Playwright) de Duplicar e Remover (T-14) e da T-07 lendo a lista.
Uso: python3 scripts/testar-lote.py   (requer: pip install playwright && playwright install chromium)"""
import subprocess, sys, time, pathlib
from playwright.sync_api import sync_playwright
RAIZ = pathlib.Path(__file__).resolve().parent.parent / "site"
PORTA = 8791; BASE = f"http://localhost:{PORTA}"
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORTA)], cwd=RAIZ, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2); falhas = []; erros = []
def ok(c, m):
    print(("ok    " if c else "FALHA ") + m)
    if not c: falhas.append(m)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1440, "height": 900})
        pg.on("pageerror", lambda e: erros.append(str(e)))
        pg.goto(BASE + "/app/editor/quadro/#foto-3"); pg.wait_for_timeout(400)
        n = lambda: pg.evaluate("PLQ.N"); txt = lambda s: pg.inner_text(s).strip().lower()
        ok(n() == 24, "abre com 24 fotos")
        pg.click("#scope-mod")
        ok(txt("#est-dup") == "duplicar esta foto", "rótulo «Duplicar esta foto»")
        pg.click("#faixa li:nth-child(5) .th", modifiers=["Control"]); pg.click("#faixa li:nth-child(7) .th", modifiers=["Control"])
        ok(txt("#est-dup") == "duplicar 2 fotos" and txt("#est-rem") == "remover 2 fotos", "rótulos com 2 marcadas")
        pg.evaluate("PLQ.ST()[5].adj.brilho=30; PLQ.commit('t')")
        pg.click("#est-dup"); pg.wait_for_timeout(150)
        ok(n() == 26 and pg.evaluate("document.querySelectorAll('#faixa li').length") == 26, "duplicar 2 → 26 fotos e 26 miniaturas")
        ok(pg.evaluate("PLQ.ST()[6].adj.brilho") == 30 and pg.evaluate("PLQ.ST()[5].src") == pg.evaluate("PLQ.ST()[6].src"), "cópia herda ajuste e origem")
        ok(pg.evaluate("PLQ.cur()") == 3 and txt("#faixa-r") == "foto 03 / 26", "foto aberta continua a 3; contador 03 / 26")
        ok(txt("#sel-n") == "nenhuma foto selecionada", "seleção limpa depois da ação")
        ok(pg.evaluate("PLQ.vert(2)") is True and pg.evaluate("PLQ.vert(8)") is False, "orientação segue a origem")
        pg.click("#faixa li:nth-child(6) .th", modifiers=["Control"]); pg.click("#est-rem"); pg.wait_for_timeout(150)
        ok(pg.is_visible("#rem-dlg") and n() == 26, "Remover abre o pop-up sem remover ainda")
        ok("remover esta foto do projeto?" == txt("#rem-t") and pg.evaluate("document.activeElement.id") == "rem-nao", "título correto e foco em «Manter fotos»")
        pg.keyboard.press("Tab"); ok(pg.evaluate("document.activeElement.id") == "rem-sim", "Tab vai ao botão de remover")
        pg.keyboard.press("Tab"); ok(pg.evaluate("document.activeElement.id") == "rem-nao", "foco preso no pop-up")
        pg.keyboard.press("Escape"); pg.wait_for_timeout(100)
        ok(pg.is_hidden("#rem-dlg") and n() == 26, "Esc mantém as fotos")
        pg.click("#est-rem"); pg.click("#rem-nao"); pg.wait_for_timeout(100)
        ok(pg.is_hidden("#rem-dlg") and n() == 26, "«Manter fotos» mantém")
        pg.click("#est-rem"); pg.click("#rem-sim"); pg.wait_for_timeout(150)
        ok(n() == 25 and pg.evaluate("JSON.parse(sessionStorage.getItem('pl-fotos')).length") == 25, "remover 1 → 25 e lista salva")
        pg.keyboard.press("Control+z"); pg.wait_for_timeout(150); ok(n() == 26, "desfazer remoção → 26")
        pg.keyboard.press("Control+z"); pg.wait_for_timeout(150); ok(n() == 24, "desfazer duplicação → 24")
        pg.keyboard.press("Control+y"); pg.wait_for_timeout(150); ok(n() == 26, "refazer → 26")
        pg.evaluate("PLQ.remover([3])"); pg.wait_for_timeout(100)
        ok(n() == 25 and pg.evaluate("PLQ.cur()") == 3, "remover a foto aberta mantém a posição")
        ok(pg.evaluate("PLQ.remover(Array.from({length:PLQ.N},(_,i)=>i+1))") == 0, "não remove todas as fotos")
        cnt = pg.evaluate("JSON.parse(sessionStorage.getItem('pl-fotos')).length")
        pg.goto(BASE + "/app/editor/"); pg.wait_for_timeout(400)
        ok(f"· {cnt}" in pg.inner_text("#scope-t") and f"{cnt} fotos" in pg.inner_text("#apply-t"), f"T-07 mostra {cnt} fotos")
        pg.goto(BASE + "/app/editor/quadro/#foto-2"); pg.wait_for_timeout(400)
        ok(n() == cnt, f"Quadro restaura {cnt} fotos")
        m = b.new_context(viewport={"width": 390, "height": 844}, has_touch=True).new_page()
        m.goto(BASE + "/app/editor/quadro/#foto-3"); m.wait_for_timeout(400); m.click("#scope-mod")
        ok(m.evaluate("document.documentElement.scrollWidth<=innerWidth"), "390: sem rolagem horizontal")
        b.close()
finally:
    srv.terminate()
ok(not erros, "sem erro de script " + str(erros))
print(f"\n{'✖ ' + str(len(falhas)) + ' falha(s)' if falhas else '✔ Lote: sem falhas'}"); sys.exit(1 if falhas else 0)
