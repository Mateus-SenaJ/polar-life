-- PolarLife · banco de dados · 0007 · acesso (D-206)
-- Menor privilégio: a API (pl_app) lê só as próprias linhas (RLS por app.usuario_id) e escreve quase tudo por função;
-- o admin (pl_admin) lê contas sem segredos e muda limites, preços, códigos e chaves por função; a análise (pl_analitica)
-- só vê agregados; a auditoria (pl_auditor) só lê a trilha. Tabelas de segredo não têm GRANT nenhum.

-- RLS ligada em toda tabela com dado de pessoa (o dono das tabelas, pl_dono, não é usado pela API)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'identidade.usuarios', 'identidade.credenciais_senha', 'identidade.identidades_externas', 'identidade.sessoes',
    'identidade.codigos_verificacao', 'identidade.papeis', 'identidade.chaves_acesso', 'identidade.tentativas_entrada',
    'privacidade.aceites', 'privacidade.pedidos_titular', 'privacidade.exportacoes',
    'comercial.variantes_conta', 'comercial.assinaturas', 'comercial.checkouts', 'comercial.pagamentos', 'comercial.recibos',
    'comercial.saldos_folhas', 'comercial.movimentos_folhas', 'comercial.consumos', 'comercial.codigos_impressao'] LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- a pessoa vê as próprias linhas
CREATE POLICY usuarios_dono ON identidade.usuarios FOR SELECT TO pl_app USING (id = util.usuario_atual());
CREATE POLICY usuarios_dono_nome ON identidade.usuarios FOR UPDATE TO pl_app USING (id = util.usuario_atual()) WITH CHECK (id = util.usuario_atual());
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'identidade.identidades_externas', 'identidade.sessoes', 'identidade.chaves_acesso', 'identidade.papeis',
    'privacidade.aceites', 'privacidade.pedidos_titular', 'privacidade.exportacoes',
    'comercial.variantes_conta', 'comercial.assinaturas', 'comercial.checkouts', 'comercial.pagamentos', 'comercial.recibos',
    'comercial.saldos_folhas', 'comercial.movimentos_folhas', 'comercial.consumos'] LOOP
    EXECUTE format('CREATE POLICY %I ON %s FOR SELECT TO pl_app USING (usuario_id = util.usuario_atual())', replace(t, '.', '_') || '_dono', t);
  END LOOP;
END $$;
CREATE POLICY aceites_dono_novo ON privacidade.aceites FOR INSERT TO pl_app WITH CHECK (usuario_id = util.usuario_atual());
CREATE POLICY pedidos_dono_novo ON privacidade.pedidos_titular FOR INSERT TO pl_app WITH CHECK (usuario_id = util.usuario_atual());
CREATE POLICY exportacoes_dono_novo ON privacidade.exportacoes FOR INSERT TO pl_app WITH CHECK (usuario_id = util.usuario_atual());
CREATE POLICY checkouts_dono_novo ON comercial.checkouts FOR INSERT TO pl_app WITH CHECK (usuario_id = util.usuario_atual() AND situacao = 'pendente');
CREATE POLICY variantes_dono_nova ON comercial.variantes_conta FOR INSERT TO pl_app WITH CHECK (usuario_id = util.usuario_atual());

GRANT SELECT (id, email, email_verificado_em, nome, situacao, criado_em) ON identidade.usuarios TO pl_app;
GRANT UPDATE (nome) ON identidade.usuarios TO pl_app;
GRANT SELECT (id, provedor, criado_em, ultimo_uso_em) ON identidade.identidades_externas TO pl_app;
GRANT SELECT (id, criada_em, expira_em, ultimo_uso_em, revogada_em, aparelho) ON identidade.sessoes TO pl_app;   -- nunca o token_hash
GRANT SELECT (id, apelido, criada_em, ultimo_uso_em) ON identidade.chaves_acesso TO pl_app;
GRANT SELECT ON identidade.papeis TO pl_app;
GRANT SELECT, INSERT ON privacidade.aceites, privacidade.pedidos_titular TO pl_app;
GRANT SELECT, INSERT (usuario_id) ON privacidade.exportacoes TO pl_app;
GRANT SELECT ON privacidade.documentos TO pl_app, pl_admin;
GRANT SELECT ON comercial.planos, comercial.limites_plano, comercial.precos TO pl_app, pl_admin;
GRANT SELECT, INSERT ON comercial.variantes_conta TO pl_app;
GRANT SELECT ON comercial.assinaturas, comercial.pagamentos, comercial.recibos, comercial.saldos_folhas, comercial.movimentos_folhas, comercial.consumos TO pl_app;
GRANT SELECT, INSERT (usuario_id, tipo, classe, quantidade, metodo, preco_id, valor_centavos, moeda, provedor, provedor_sessao_id) ON comercial.checkouts TO pl_app;
GRANT SELECT ON config.chaves TO pl_app;

GRANT EXECUTE ON FUNCTION
  identidade.conta_por_email(text), identidade.criar_conta(text, text, text), identidade.criar_sessao(uuid, bytea, integer, text),
  identidade.sessao_valida(bytea), identidade.encerrar_sessao(bytea), identidade.encerrar_sessoes(uuid),
  identidade.entrar_com_provedor(text, text, text, boolean, text), identidade.novo_codigo(text, text, bytea, integer),
  identidade.conferir_codigo(text, text, bytea), identidade.definir_senha(uuid, text, boolean, bytea), identidade.redefinir_senha(text, bytea, text),
  identidade.trocar_email(uuid, text, bytea),
  identidade.erros_recentes(bytea), identidade.entrada_travada(bytea), identidade.registrar_tentativa(bytea, text, boolean),
  comercial.plano_de(uuid), comercial.direito_de_uso(uuid), comercial.consumir_folhas(uuid, bytea, text, integer),
  comercial.registrar_evento_pagamento(text, text, text, boolean, uuid, integer, text), comercial.resgatar_codigo(bytea, uuid),
  comercial.cancelar_assinatura(uuid), privacidade.exportar_dados(uuid), privacidade.excluir_conta(uuid)
TO pl_app;

-- painel do admin: lê contas e vendas sem segredos; muda por função (cada chamada confere o papel admin)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'identidade.usuarios', 'identidade.papeis', 'comercial.assinaturas', 'comercial.checkouts', 'comercial.pagamentos', 'comercial.recibos',
    'comercial.saldos_folhas', 'comercial.movimentos_folhas', 'comercial.consumos', 'comercial.codigos_impressao', 'privacidade.pedidos_titular'] LOOP
    EXECUTE format('CREATE POLICY %I ON %s FOR SELECT TO pl_admin USING (true)', replace(t, '.', '_') || '_admin', t);
  END LOOP;
END $$;
GRANT SELECT (id, email, nome, situacao, criado_em, excluido_em) ON identidade.usuarios TO pl_admin;
GRANT SELECT ON identidade.papeis, comercial.assinaturas, comercial.checkouts, comercial.pagamentos, comercial.recibos,
  comercial.saldos_folhas, comercial.movimentos_folhas, comercial.consumos, comercial.lotes_codigos, privacidade.pedidos_titular TO pl_admin;
GRANT SELECT (id, lote_id, final, situacao, usado_em, usado_por, revogado_em) ON comercial.codigos_impressao TO pl_admin;   -- nunca o HMAC
GRANT SELECT, INSERT, UPDATE ON config.chaves, config.parametros TO pl_admin;
GRANT UPDATE (situacao, concluido_em, motivo) ON privacidade.pedidos_titular TO pl_admin;
GRANT EXECUTE ON FUNCTION
  util.exigir_admin(), comercial.novo_limite(text, integer, integer, integer, boolean), comercial.novo_preco(text, text, integer),
  comercial.criar_lote_codigos(text, integer, text, integer, timestamptz, bytea[], text[]), comercial.revogar_codigo(uuid),
  comercial.ajustar_folhas(uuid, text, integer, text), comercial.plano_de(uuid)
TO pl_admin;

-- auditoria: só leitura, por quem cuida de segurança e de pedidos de autoridade (Marco Civil, art. 15 §1º)
GRANT SELECT ON auditoria.eventos, auditoria.registros_acesso TO pl_auditor;
GRANT USAGE ON SCHEMA auditoria TO pl_app;
GRANT INSERT ON auditoria.registros_acesso TO pl_app;            -- a API registra cada acesso (IP, porta, rota, status)

-- análise: só agregados, sem e-mail, nome, IP ou identificador de pessoa
CREATE VIEW analise.contas_por_mes AS
  SELECT util.mes_brasilia(criado_em) AS mes, count(*) AS novas, count(*) FILTER (WHERE situacao = 'excluida') AS excluidas
  FROM identidade.usuarios GROUP BY 1;
CREATE VIEW analise.vendas_por_mes AS
  SELECT util.mes_brasilia(p.confirmado_em) AS mes, c.tipo, c.classe, p.metodo, count(*) AS compras, sum(p.valor_centavos) AS total_centavos
  FROM comercial.pagamentos p JOIN comercial.checkouts c ON c.id = p.checkout_id
  WHERE p.estornado_em IS NULL GROUP BY 1, 2, 3, 4;
CREATE VIEW analise.folhas_por_mes AS
  SELECT mes, fonte, classe, sum(quantidade) AS folhas, count(DISTINCT usuario_id) AS contas
  FROM comercial.consumos GROUP BY 1, 2, 3;
GRANT SELECT ON ALL TABLES IN SCHEMA analise TO pl_analitica;
GRANT USAGE ON SCHEMA util TO pl_analitica;
GRANT EXECUTE ON FUNCTION util.mes_brasilia(timestamptz) TO pl_analitica;
