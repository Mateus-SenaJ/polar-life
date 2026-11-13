-- PolarLife · banco de dados · semente 0001 · planos, limites, preços e parâmetros (DOC-03 §2, valores [HIPÓTESE] até o dono confirmar)
-- Idempotente: pode rodar de novo sem duplicar.

INSERT INTO comercial.planos (codigo, nome) VALUES
  ('gratis', 'Grátis'), ('avulsa', 'Folha avulsa'), ('pro', 'Pro')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO comercial.limites_plano (plano, folhas_mes, uso_razoavel, fotos_por_projeto, assinatura_pode_desligar)
SELECT x.plano, x.folhas_mes, x.uso_razoavel, x.fotos, x.desligar
FROM (VALUES ('gratis', 1, NULL::integer, 24, false), ('avulsa', NULL::integer, NULL::integer, 24, false), ('pro', NULL::integer, 100, 200, true))
  AS x (plano, folhas_mes, uso_razoavel, fotos, desligar)
WHERE NOT EXISTS (SELECT 1 FROM comercial.limites_plano l WHERE l.plano = x.plano AND upper_inf(l.vigencia));

INSERT INTO comercial.precos (produto, variante, valor_centavos)
SELECT x.produto, 'A', x.valor
FROM (VALUES ('folha_padrao', 290), ('folha_grande', 550), ('pro_mensal', 1490)) AS x (produto, valor)
WHERE NOT EXISTS (SELECT 1 FROM comercial.precos p WHERE p.produto = x.produto AND p.variante = 'A' AND upper_inf(p.vigencia));

INSERT INTO config.parametros (chave, valor, descricao) VALUES
  ('retencao.registros_acesso_meses', '6', 'Marco Civil, art. 15: registros de acesso por 6 meses (mínimo legal)'),
  ('retencao.auditoria_anos', '5', 'Trilha de auditoria: 5 anos'),
  ('retencao.fiscal_anos', '5', 'Pagamentos e recibos: 5 anos (CTN, art. 173 e 174)'),
  ('sessao.dias', '30', 'Duração da sessão (renovada no uso)'),
  ('pro.uso_razoavel_aviso', '0.8', 'Aviso ao Pro quando chega a 80% do uso razoável')
ON CONFLICT (chave) DO NOTHING;

INSERT INTO config.chaves (chave, ligada, descricao) VALUES
  ('pagamento.real', false, 'Cobrança de verdade (Pix, cartão, boleto). Desligada: compras de demonstração'),
  ('teste_preco.variante_b', false, 'Teste de preço com a variante B (DOC-03 §8)')
ON CONFLICT (chave) DO NOTHING;
