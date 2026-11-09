#!/usr/bin/env python3
"""Teste em navegador (Chromium via Playwright) de «Valores diferentes» dentro dos campos (T-11 · DOC-05 FN-00a).
Uso: python3 tests/e2e-py/testar-valores.py   (requer: pip install playwright && playwright install chromium)"""
import subprocess, sys, time, pathlib
from playwright.sync_api import sync_playwright
RAIZ = pathlib.Path(__file__).resolve().parents[2] / "site"
PORTA = 8793; BASE = f"http://localhost:{PORTA}"
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
        mix = lambda k: pg.is_visible(f'.f[data-k="{k}"] .mix')
        txt = lambda s: pg.inner_text(s).strip()
        escopo = lambda v: pg.click(f'.seg__o:has(input[value="{v}"])')
        pg.click("#tab-ajustes")
        pg.click("#scope-mod")

        # 1. «Somente esta»: nada a comparar
        ok(pg.evaluate("PLQ.cur()") == 3, "abre na Foto 03 (realces −20, sombras 25, vinheta 15)")
        ok(not any(mix(k) for k in ["brilho", "contraste", "realces", "sombras", "vinheta", "fint"]), "«Somente esta»: nenhum campo mostra «Valores diferentes»")
        ok(not pg.is_visible("#flt-dif"), "«Somente esta»: linha do filtro escondida")

        # 2. «Todas»: as outras 23 fotos têm os 3 ajustes em 0
        escopo("todas"); pg.wait_for_timeout(120)
        ok(mix("realces") and mix("sombras") and mix("vinheta"), "«Todas»: realces, sombras e vinheta mostram a etiqueta")
        ok(not mix("brilho") and not mix("contraste") and not mix("temp"), "«Todas»: brilho, contraste e temperatura iguais, sem etiqueta")
        ok(pg.text_content('.f[data-k="realces"] .mix').strip() == "Valores diferentes", "texto da etiqueta é «Valores diferentes» (o .mono só põe em caixa alta na tela)")
        ok(pg.evaluate("document.querySelector('.f[data-k=realces] .mix svg') !== null"), "etiqueta tem ícone (nunca só cor, T3)")
        h = txt("#realces-h")
        ok("23 outras fotos do escopo têm valor diferente" in h and "Foto 03" in h, "ajuda diz quantas fotos diferem e a foto de origem: " + h)
        ok(pg.get_attribute("#realces", "aria-describedby") == "realces-h", "campo numérico ligado à ajuda (aria-describedby)")
        ok(pg.input_value("#realces") == "-20" and not pg.is_visible(".f[data-k=zoom] .mix") if pg.query_selector(".f[data-k=zoom] .mix") else pg.input_value("#realces") == "-20",
           "o campo segue mostrando o valor da foto aberta e Zoom/Endireitar não ganham etiqueta")
        ok("Realces" in txt("#scope-diff") and "Sombras" in txt("#scope-diff"), "resumo do escopo continua listando os controles")

        # 3. Uma foto com brilho próprio
        pg.evaluate("PLQ.ST()[5].adj.brilho = 30; PLQ.commit('t')"); pg.wait_for_timeout(120)
        ok(mix("brilho") and "1 outra foto do escopo tem valor diferente" in txt("#brilho-h"), "brilho da Foto 05 aparece, no singular")

        # 4. «Selecionadas» sem seleção não compara ninguém; com a Foto 05 marcada, sim
        escopo("sel"); pg.wait_for_timeout(120)
        ok(not any(mix(k) for k in ["brilho", "realces", "sombras", "vinheta"]), "«Selecionadas» sem marcação: sem etiquetas")
        pg.click("#faixa li:nth-child(5) .th", modifiers=["Control"]); pg.wait_for_timeout(120)
        ok(mix("brilho") and mix("realces") and not mix("contraste"), "marcou a Foto 05: brilho e realces diferem, contraste não")

        # 5. Aplicar às demais iguala e some a etiqueta; desfazer traz de volta
        pg.click(".chk:has(#subst)"); ok(pg.is_checked("#subst"), "«Substituir ajustes individuais» marcado"); pg.click("#apply"); pg.wait_for_timeout(200)
        ok(not any(mix(k) for k in ["brilho", "contraste", "realces", "sombras", "vinheta"]), "depois de «Aplicar às demais» nenhuma etiqueta sobra")
        ok(pg.evaluate("PLQ.ST()[5].adj.realces") == -20, "a Foto 05 recebeu os ajustes da Foto 03")
        pg.keyboard.press("Control+z"); pg.wait_for_timeout(200)
        ok(mix("brilho") and mix("realces"), "desfazer (Ctrl+Z) devolve as etiquetas")

        # 6. Filtro: linha própria e intensidade
        escopo("todas"); pg.evaluate("PLQ.ST()[7].flt.id = 'pb'; PLQ.commit('t')"); pg.wait_for_timeout(150)
        ok(pg.is_visible("#flt-dif") and txt("#flt-dif") == "Valores diferentes: 1 foto do escopo usa outro filtro.", "filtro: «" + txt("#flt-dif") + "»")
        pg.evaluate("PLQ.ST()[7].flt.int = 60; PLQ.commit('t')"); pg.wait_for_timeout(150)
        ok(mix("fint") and pg.is_disabled("#fint"), "intensidade diferente marca o campo mesmo com o filtro «Original» (campo desabilitado)")
        ok("Filtro" in txt("#scope-diff"), "resumo do escopo cita «Filtro»")
        escopo("esta"); pg.wait_for_timeout(150)
        ok(not mix("fint") and not pg.is_visible("#flt-dif"), "voltar a «Somente esta» limpa tudo")

        # 7. Mudar de foto recalcula contra a nova foto aberta
        escopo("todas"); pg.click("#faixa li:nth-child(9) .th"); pg.wait_for_timeout(300)
        ok(pg.evaluate("PLQ.cur()") == 9 and mix("realces"), "Foto 09 aberta: realces difere da Foto 03 (que tem −20)")
        ok("Foto 09" in txt("#realces-h") and "1 outra foto do escopo tem valor diferente" in txt("#realces-h"), "ajuda cita a nova foto de origem e só 1 foto difere: " + txt("#realces-h"))
        ok(mix("sombras") and "1 outra foto do escopo tem valor diferente" in txt("#sombras-h"), "sombras também difere só na Foto 03")

        # 8. Celular
        m = b.new_page(viewport={"width": 390, "height": 844})
        m.on("pageerror", lambda e: erros.append(str(e)))
        m.goto(BASE + "/app/editor/quadro/#foto-3"); m.wait_for_timeout(400)
        m.click("#tab-ajustes"); m.click("#scope-mod")
        m.click('.seg__o:has(input[value="todas"])'); m.wait_for_timeout(150)
        ok(m.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "390 px: sem rolagem horizontal com as etiquetas")
        fora = m.evaluate("""[...document.querySelectorAll('.mix')].filter(e => e.offsetParent !== null).filter(e => {const r = e.getBoundingClientRect(); return r.right > window.innerWidth + 1 || r.left < -1}).length""")
        ok(fora == 0, "390 px: etiquetas visíveis ficam dentro da tela")
        ok(m.evaluate("[...document.querySelectorAll('.mix')].filter(e => e.offsetParent !== null).length") >= 1, "390 px: ao menos uma etiqueta visível")
        b.close()
except Exception as e:
    falhas.append("exceção: %r" % e); print("FALHA exceção:", repr(e))
finally:
    srv.terminate()
ok(not erros, "sem erro de script %s" % erros)
print("\n" + ("✔ «Valores diferentes»: sem falhas" if not falhas else "✘ %d falha(s)" % len(falhas)))
sys.exit(1 if falhas else 0)
