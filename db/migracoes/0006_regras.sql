-- PolarLife · banco de dados · 0006 · regras de negócio (D-206)
-- As regras moram no banco, em funções SECURITY DEFINER com search_path fixo: a API chama a função e o banco garante
-- a regra numa transação só (sem corrida entre dois cliques). Cada função de pessoa confere que quem chama é o dono
-- (app.usuario_id); as do painel conferem o papel admin. Erros com código próprio (SQLSTATE):
--   PL001 sem folhas · PL002 código não encontrado · PL003 código usado, revogado ou vencido · PL004 acesso negado · PL005 conta já existe
--   PL006 muitos pedidos de código por e-mail

-- ---------- apoio ----------
CREATE FUNCTION util.exigir_dono(p_usuario uuid) RETURNS void
LANGUAGE plpgsql STABLE SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  IF p_usuario IS NULL OR p_usuario IS DISTINCT FROM util.usuario_atual() THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = 'PL004';
  END IF;
END $$;

CREATE FUNCTION util.exigir_admin() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v uuid := util.usuario_atual();
BEGIN
  IF v IS NULL OR NOT EXISTS (SELECT 1 FROM identidade.papeis p JOIN identidade.usuarios u ON u.id = p.usuario_id
                              WHERE p.usuario_id = v AND p.papel = 'admin' AND u.situacao = 'ativa') THEN
    RAISE EXCEPTION 'acesso negado: só a conta admin' USING ERRCODE = 'PL004';
  END IF;
  RETURN v;
END $$;

-- ---------- identidade: entrar sem abrir as tabelas de segredo para a API ----------
CREATE FUNCTION identidade.conta_por_email(p_email text)
RETURNS TABLE (usuario_id uuid, situacao text, hash text, precisa_refazer boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
  SELECT u.id, u.situacao, c.hash, coalesce(c.precisa_refazer, false)
  FROM identidade.usuarios u LEFT JOIN identidade.credenciais_senha c ON c.usuario_id = u.id
  WHERE u.email = lower(btrim(p_email)) AND u.situacao <> 'excluida'
$$;

CREATE FUNCTION identidade.criar_conta(p_email text, p_nome text, p_hash text DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v uuid;
BEGIN
  INSERT INTO identidade.usuarios (email, nome) VALUES (lower(btrim(p_email)), btrim(p_nome)) RETURNING id INTO v;
  IF p_hash IS NOT NULL THEN
    INSERT INTO identidade.credenciais_senha (usuario_id, hash) VALUES (v, p_hash);
  END IF;
  RETURN v;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'conta já existe' USING ERRCODE = 'PL005';
END $$;

CREATE FUNCTION identidade.criar_sessao(p_usuario uuid, p_token_hash bytea, p_dias integer DEFAULT 30, p_aparelho text DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v uuid;
BEGIN
  IF p_dias NOT BETWEEN 1 AND 90 THEN RAISE EXCEPTION 'duração de sessão inválida' USING ERRCODE = '22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM identidade.usuarios WHERE id = p_usuario AND situacao = 'ativa') THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = 'PL004';
  END IF;
  INSERT INTO identidade.sessoes (usuario_id, token_hash, expira_em, aparelho)
  VALUES (p_usuario, p_token_hash, now() + make_interval(days => p_dias), left(p_aparelho, 80))
  RETURNING id INTO v;
  RETURN v;
END $$;

-- devolve a conta da sessão válida (nem vencida, nem encerrada, conta ativa) e marca o uso a cada 5 min no máximo
CREATE FUNCTION identidade.sessao_valida(p_token_hash bytea) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE s identidade.sessoes;
BEGIN
  SELECT x.* INTO s FROM identidade.sessoes x JOIN identidade.usuarios u ON u.id = x.usuario_id
  WHERE x.token_hash = p_token_hash AND x.revogada_em IS NULL AND x.expira_em > now() AND u.situacao = 'ativa';
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF s.ultimo_uso_em < now() - interval '5 minutes' THEN
    UPDATE identidade.sessoes SET ultimo_uso_em = now() WHERE id = s.id;
  END IF;
  RETURN s.usuario_id;
END $$;

CREATE FUNCTION identidade.encerrar_sessao(p_token_hash bytea) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
  UPDATE identidade.sessoes SET revogada_em = now() WHERE token_hash = p_token_hash AND revogada_em IS NULL RETURNING true
$$;

-- entrar com Google ou Apple: acha a conta pelo «sub» do provedor. Na primeira vez, liga a uma conta com o mesmo e-mail só
-- se o provedor confirmou o e-mail (senão PL005: a pessoa entra com a senha e liga depois); conta nova nasce confirmada.
CREATE FUNCTION identidade.entrar_com_provedor(p_provedor text, p_sujeito text, p_email text, p_email_confirmado boolean, p_nome text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
  v uuid;
  v_email text := lower(btrim(p_email));
  v_nome text := CASE WHEN char_length(btrim(coalesce(p_nome, ''))) >= 2 THEN left(btrim(p_nome), 60) END;
BEGIN
  UPDATE identidade.identidades_externas SET ultimo_uso_em = now()
  WHERE provedor = p_provedor AND sujeito = p_sujeito RETURNING usuario_id INTO v;
  IF v IS NULL THEN
    SELECT id INTO v FROM identidade.usuarios WHERE email = v_email;
    IF v IS NOT NULL AND NOT coalesce(p_email_confirmado, false) THEN
      RAISE EXCEPTION 'conta já existe' USING ERRCODE = 'PL005';
    END IF;
    IF v IS NULL THEN
      INSERT INTO identidade.usuarios (email, nome, email_verificado_em)
      VALUES (v_email, v_nome, CASE WHEN p_email_confirmado THEN now() END) RETURNING id INTO v;
    ELSE
      UPDATE identidade.usuarios SET email_verificado_em = coalesce(email_verificado_em, now()) WHERE id = v;
    END IF;
    INSERT INTO identidade.identidades_externas (usuario_id, provedor, sujeito, ultimo_uso_em) VALUES (v, p_provedor, p_sujeito, now());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM identidade.usuarios WHERE id = v AND situacao = 'ativa') THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = 'PL004';
  END IF;
  RETURN v;
END $$;

-- código de 6 dígitos por e-mail: a API sorteia, manda por e-mail e grava só o HMAC (chave fora do banco). Um código vivo
-- por e-mail e finalidade (o anterior deixa de valer); no máximo 5 pedidos por hora (PL006).
CREATE FUNCTION identidade.novo_codigo(p_email text, p_finalidade text, p_codigo_hash bytea, p_minutos integer DEFAULT 10) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
  v uuid;
  v_email text := lower(btrim(p_email));
BEGIN
  IF p_minutos NOT BETWEEN 1 AND 15 THEN RAISE EXCEPTION 'validade inválida' USING ERRCODE = '22023'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('codigo:' || v_email || ':' || p_finalidade, 0));   -- pedidos simultâneos em fila
  IF (SELECT count(*) FROM identidade.codigos_verificacao
      WHERE email = v_email AND finalidade = p_finalidade AND criado_em > now() - interval '1 hour') >= 5 THEN
    RAISE EXCEPTION 'muitos pedidos de código: tente de novo mais tarde' USING ERRCODE = 'PL006';
  END IF;
  UPDATE identidade.codigos_verificacao SET usado_em = now()
  WHERE email = v_email AND finalidade = p_finalidade AND usado_em IS NULL;
  INSERT INTO identidade.codigos_verificacao (email, finalidade, codigo_hash, expira_em)
  VALUES (v_email, p_finalidade, p_codigo_hash, now() + make_interval(mins => p_minutos)) RETURNING id INTO v;
  RETURN v;
END $$;

-- confere o código: cada erro conta; com 5 erros o código morre. O acerto o gasta e, para entrar ou confirmar, confirma o e-mail.
CREATE FUNCTION identidade.conferir_codigo(p_email text, p_finalidade text, p_codigo_hash bytea) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
  c identidade.codigos_verificacao;
  v_email text := lower(btrim(p_email));
BEGIN
  SELECT * INTO c FROM identidade.codigos_verificacao
  WHERE email = v_email AND finalidade = p_finalidade AND usado_em IS NULL AND expira_em > now() AND tentativas < 5
  ORDER BY criado_em DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF c.codigo_hash IS DISTINCT FROM p_codigo_hash THEN
    UPDATE identidade.codigos_verificacao SET tentativas = tentativas + 1 WHERE id = c.id;
    RETURN false;
  END IF;
  UPDATE identidade.codigos_verificacao SET usado_em = now() WHERE id = c.id;
  IF p_finalidade IN ('entrar', 'confirmar_email', 'nova_senha') THEN
    UPDATE identidade.usuarios SET email_verificado_em = coalesce(email_verificado_em, now()) WHERE email = v_email;
  END IF;
  RETURN true;
END $$;

-- senha da própria conta: definir, trocar ou refazer o hash em Argon2id depois de entrar (o hash vem pronto da API).
-- Trocar encerra as outras sessões (a atual fica, se a API informar o hash dela).
CREATE FUNCTION identidade.definir_senha(p_usuario uuid, p_hash text, p_encerrar_outras boolean DEFAULT true, p_sessao_atual bytea DEFAULT NULL) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE n integer := 0;
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  INSERT INTO identidade.credenciais_senha (usuario_id, hash) VALUES (p_usuario, p_hash)
  ON CONFLICT (usuario_id) DO UPDATE SET hash = excluded.hash, precisa_refazer = false, atualizado_em = now();
  IF p_encerrar_outras THEN
    UPDATE identidade.sessoes SET revogada_em = now()
    WHERE usuario_id = p_usuario AND revogada_em IS NULL AND token_hash IS DISTINCT FROM p_sessao_atual;
    GET DIAGNOSTICS n = ROW_COUNT;
  END IF;
  RETURN n;
END $$;

-- «Esqueci a senha»: confere o código do e-mail, grava o hash novo e encerra todas as sessões da conta, numa transação
CREATE FUNCTION identidade.redefinir_senha(p_email text, p_codigo_hash bytea, p_hash text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v uuid;
BEGIN
  IF NOT identidade.conferir_codigo(p_email, 'nova_senha', p_codigo_hash) THEN RETURN false; END IF;
  SELECT id INTO v FROM identidade.usuarios WHERE email = lower(btrim(p_email)) AND situacao = 'ativa';
  IF v IS NULL THEN RETURN false; END IF;
  INSERT INTO identidade.credenciais_senha (usuario_id, hash) VALUES (v, p_hash)
  ON CONFLICT (usuario_id) DO UPDATE SET hash = excluded.hash, precisa_refazer = false, atualizado_em = now();
  UPDATE identidade.sessoes SET revogada_em = now() WHERE usuario_id = v AND revogada_em IS NULL;
  RETURN true;
END $$;

-- trocar o e-mail da conta: o código vai para o e-mail novo (finalidade confirmar_email); e-mail de outra conta: PL005
CREATE FUNCTION identidade.trocar_email(p_usuario uuid, p_email_novo text, p_codigo_hash bytea) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  IF NOT identidade.conferir_codigo(p_email_novo, 'confirmar_email', p_codigo_hash) THEN RETURN false; END IF;
  UPDATE identidade.usuarios SET email = lower(btrim(p_email_novo)), email_verificado_em = now() WHERE id = p_usuario AND situacao = 'ativa';
  RETURN FOUND;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'conta já existe' USING ERRCODE = 'PL005';
END $$;

-- «Sair de todos os aparelhos»
CREATE FUNCTION identidade.encerrar_sessoes(p_usuario uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE n integer;
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  UPDATE identidade.sessoes SET revogada_em = now() WHERE usuario_id = p_usuario AND revogada_em IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- trava de força bruta (OWASP): 5 erros seguidos em 15 min por e-mail ou por IP travam a entrada. As chaves são HMAC
-- (o e-mail e o IP não ficam em claro); um acerto zera a contagem.
CREATE FUNCTION identidade.erros_recentes(p_chave_hash bytea) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
  SELECT count(*)::integer FROM identidade.tentativas_entrada t
  WHERE t.chave_hash = p_chave_hash AND NOT t.sucesso AND t.ocorrida_em > now() - interval '15 minutes'
    AND t.ocorrida_em > coalesce((SELECT max(x.ocorrida_em) FROM identidade.tentativas_entrada x WHERE x.chave_hash = p_chave_hash AND x.sucesso), '-infinity')
$$;
CREATE FUNCTION identidade.entrada_travada(p_chave_hash bytea) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
  SELECT identidade.erros_recentes(p_chave_hash) >= 5
$$;
CREATE FUNCTION identidade.registrar_tentativa(p_chave_hash bytea, p_tipo text, p_sucesso boolean) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  INSERT INTO identidade.tentativas_entrada (chave_hash, tipo, sucesso, ocorrida_em) VALUES (p_chave_hash, p_tipo, p_sucesso, clock_timestamp());
  RETURN identidade.erros_recentes(p_chave_hash);
END $$;

-- ---------- comercial: plano, direito de uso e folhas ----------
CREATE FUNCTION comercial.limites_vigentes(p_plano text) RETURNS comercial.limites_plano
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
  SELECT * FROM comercial.limites_plano WHERE plano = p_plano AND vigencia @> now()
$$;

-- Pro com assinatura viva; Folha avulsa com folhas compradas; senão Grátis (DOC-03 §2)
CREATE FUNCTION comercial.plano_de(p_usuario uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM comercial.assinaturas WHERE usuario_id = p_usuario AND situacao IN ('ativa', 'cancelada_no_fim') AND periodo_fim > now()) THEN 'pro'
    WHEN EXISTS (SELECT 1 FROM comercial.saldos_folhas WHERE usuario_id = p_usuario AND saldo > 0) THEN 'avulsa'
    ELSE 'gratis' END
$$;

-- contrato do servidor (DOC-08 §2, DOC-12 §6.4): { plano, creditosPadrao, creditosGrande, folhasGratisUsadasNoMes, expiraEm?, assinaturaPodeDesligar }
CREATE FUNCTION comercial.direito_de_uso(p_usuario uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
  v_plano text;
  v_lim comercial.limites_plano;
  v_mes date := util.mes_brasilia(now());
  v_gratis integer;
  v_uso integer;
  v_pad integer;
  v_gra integer;
  v_ass comercial.assinaturas;
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  v_plano := comercial.plano_de(p_usuario);
  v_lim := comercial.limites_vigentes(v_plano);
  SELECT coalesce(sum(quantidade) FILTER (WHERE fonte = 'gratis_mes'), 0), coalesce(sum(quantidade) FILTER (WHERE fonte = 'pro'), 0)
    INTO v_gratis, v_uso FROM comercial.consumos WHERE usuario_id = p_usuario AND mes = v_mes;
  SELECT coalesce(max(saldo) FILTER (WHERE classe = 'padrao'), 0), coalesce(max(saldo) FILTER (WHERE classe = 'grande'), 0)
    INTO v_pad, v_gra FROM comercial.saldos_folhas WHERE usuario_id = p_usuario;
  SELECT * INTO v_ass FROM comercial.assinaturas WHERE usuario_id = p_usuario AND situacao IN ('ativa', 'cancelada_no_fim') AND periodo_fim > now();
  RETURN jsonb_build_object(
    'plano', v_plano,
    'creditosPadrao', v_pad,
    'creditosGrande', v_gra,
    'folhasGratisNoMes', CASE WHEN v_plano = 'gratis' THEN coalesce(v_lim.folhas_mes, 0) ELSE 0 END,
    'folhasGratisUsadasNoMes', v_gratis,
    'usoNoMes', v_uso,
    'usoRazoavel', v_lim.uso_razoavel,
    'fotosPorProjeto', coalesce(v_lim.fotos_por_projeto, 24),
    'assinaturaPodeDesligar', coalesce(v_lim.assinatura_pode_desligar, false),
    'assinaturaDesligada', coalesce(v_ass.assinatura_desligada, false),
    'expiraEm', v_ass.periodo_fim,
    'renovaEm', (v_mes + interval '1 month')::date);
END $$;

-- lança folhas no livro-razão e no saldo, uma vez por chave (idempotente); saldo negativo é recusado pela restrição
CREATE FUNCTION comercial.lancar_folhas(p_usuario uuid, p_classe text, p_qtd integer, p_tipo text, p_origem uuid, p_chave text, p_feito_por uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  INSERT INTO comercial.movimentos_folhas (usuario_id, classe, quantidade, tipo, origem_id, chave, feito_por)
  VALUES (p_usuario, p_classe, p_qtd, p_tipo, p_origem, p_chave, p_feito_por)
  ON CONFLICT (chave) DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
  IF p_qtd > 0 THEN
    INSERT INTO comercial.saldos_folhas AS s (usuario_id, classe, saldo) VALUES (p_usuario, p_classe, p_qtd)
    ON CONFLICT (usuario_id, classe) DO UPDATE SET saldo = s.saldo + excluded.saldo, atualizado_em = now();
  ELSE   -- débito: o CHECK do INSERT … ON CONFLICT valeria para a linha proposta (negativa) antes do UPDATE
    UPDATE comercial.saldos_folhas SET saldo = saldo + p_qtd, atualizado_em = now() WHERE usuario_id = p_usuario AND classe = p_classe;
    IF NOT FOUND THEN RAISE EXCEPTION 'sem folhas' USING ERRCODE = 'PL001'; END IF;
  END IF;
  RETURN true;
END $$;

-- DOC-03 §3: a mesma folha (mesmo resumo) exportada de novo em até 24 h conta uma vez; Pro conta o uso, sem travar;
-- Grátis usa a folha do mês (no fuso de Brasília, sem acúmulo); o resto sai das folhas compradas; faltando, PL001.
CREATE FUNCTION comercial.consumir_folhas(p_usuario uuid, p_folha_hash bytea, p_classe text, p_quantidade integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
  v_plano text;
  v_lim comercial.limites_plano;
  v_mes date := util.mes_brasilia(now());
  v_usadas integer;
  v_gratis integer := 0;
  v_credito integer;
  v_saldo integer;
  v_uso integer;
  v_id uuid;
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  IF p_classe NOT IN ('padrao', 'grande') OR p_quantidade NOT BETWEEN 1 AND 1000 OR octet_length(p_folha_hash) <> 32 THEN
    RAISE EXCEPTION 'pedido inválido' USING ERRCODE = '22023';
  END IF;
  PERFORM 1 FROM identidade.usuarios WHERE id = p_usuario AND situacao = 'ativa' FOR UPDATE;   -- um consumo por vez por conta
  IF NOT FOUND THEN RAISE EXCEPTION 'acesso negado' USING ERRCODE = 'PL004'; END IF;

  IF EXISTS (SELECT 1 FROM comercial.consumos WHERE usuario_id = p_usuario AND folha_hash = p_folha_hash
             AND fonte <> 'repeticao_24h' AND solicitado_em > now() - interval '24 hours') THEN
    INSERT INTO comercial.consumos (usuario_id, folha_hash, classe, quantidade, fonte) VALUES (p_usuario, p_folha_hash, p_classe, p_quantidade, 'repeticao_24h');
    RETURN jsonb_build_object('ok', true, 'jaContado', true);
  END IF;

  v_plano := comercial.plano_de(p_usuario);
  IF v_plano = 'pro' THEN
    INSERT INTO comercial.consumos (usuario_id, folha_hash, classe, quantidade, fonte) VALUES (p_usuario, p_folha_hash, p_classe, p_quantidade, 'pro');
    v_lim := comercial.limites_vigentes('pro');
    SELECT coalesce(sum(quantidade), 0) INTO v_uso FROM comercial.consumos WHERE usuario_id = p_usuario AND mes = v_mes AND fonte = 'pro';
    RETURN jsonb_build_object('ok', true, 'plano', 'pro', 'usoNoMes', v_uso, 'usoRazoavel', v_lim.uso_razoavel,
                              'aviso', v_lim.uso_razoavel IS NOT NULL AND v_uso >= ceil(v_lim.uso_razoavel * 0.8));
  END IF;

  IF v_plano = 'gratis' THEN
    v_lim := comercial.limites_vigentes('gratis');
    SELECT coalesce(sum(quantidade), 0) INTO v_usadas FROM comercial.consumos WHERE usuario_id = p_usuario AND mes = v_mes AND fonte = 'gratis_mes';
    v_gratis := least(greatest(0, coalesce(v_lim.folhas_mes, 0) - v_usadas), p_quantidade);
  END IF;
  v_credito := p_quantidade - v_gratis;

  IF v_credito > 0 THEN
    SELECT saldo INTO v_saldo FROM comercial.saldos_folhas WHERE usuario_id = p_usuario AND classe = p_classe FOR UPDATE;
    IF coalesce(v_saldo, 0) < v_credito THEN
      RAISE EXCEPTION 'sem folhas' USING ERRCODE = 'PL001', DETAIL = format('faltam %s', v_credito - coalesce(v_saldo, 0));
    END IF;
  END IF;

  IF v_gratis > 0 THEN
    INSERT INTO comercial.consumos (usuario_id, folha_hash, classe, quantidade, fonte) VALUES (p_usuario, p_folha_hash, p_classe, v_gratis, 'gratis_mes');
  END IF;
  IF v_credito > 0 THEN
    INSERT INTO comercial.consumos (usuario_id, folha_hash, classe, quantidade, fonte) VALUES (p_usuario, p_folha_hash, p_classe, v_credito, 'credito') RETURNING id INTO v_id;
    PERFORM comercial.lancar_folhas(p_usuario, p_classe, -v_credito, 'consumo', v_id, 'consumo:' || v_id);
  END IF;
  RETURN jsonb_build_object('ok', true, 'usouGratis', v_gratis > 0, 'gratis', v_gratis, 'debitadas', v_credito);
END $$;

-- webhook do provedor: grava uma vez por evento; crédito e recibo só depois de «payment.confirmed» que confere com o checkout
CREATE FUNCTION comercial.registrar_evento_pagamento(p_provedor text, p_evento_id text, p_tipo text, p_assinatura_valida boolean,
                                                     p_checkout uuid, p_valor integer, p_referencia text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
  v_ev uuid;
  v_ck comercial.checkouts;
  v_pg uuid;
  v_rec text;
  v_saldo integer;
  v_res text;
BEGIN
  INSERT INTO comercial.eventos_pagamento (provedor, provedor_evento_id, tipo, assinatura_valida, checkout_id, valor_centavos)
  VALUES (p_provedor, p_evento_id, p_tipo, p_assinatura_valida, p_checkout, p_valor)
  ON CONFLICT (provedor, provedor_evento_id) DO NOTHING
  RETURNING id INTO v_ev;
  IF v_ev IS NULL THEN RETURN jsonb_build_object('duplicado', true); END IF;

  IF NOT p_assinatura_valida THEN
    v_res := 'assinatura do webhook inválida: ignorado';
  ELSIF p_tipo = 'payment.confirmed' THEN
    SELECT * INTO v_ck FROM comercial.checkouts WHERE id = p_checkout FOR UPDATE;
    IF NOT FOUND OR v_ck.situacao <> 'pendente' OR v_ck.provedor <> p_provedor OR v_ck.valor_centavos IS DISTINCT FROM p_valor THEN
      v_res := 'não confere com o checkout: ignorado';
    ELSE
      UPDATE comercial.checkouts SET situacao = 'confirmado', confirmado_em = now() WHERE id = v_ck.id;
      INSERT INTO comercial.pagamentos (checkout_id, usuario_id, provedor, provedor_pagamento_id, metodo, valor_centavos, moeda, confirmado_em)
      VALUES (v_ck.id, v_ck.usuario_id, v_ck.provedor, coalesce(p_referencia, p_evento_id), v_ck.metodo, v_ck.valor_centavos, v_ck.moeda, now())
      RETURNING id INTO v_pg;
      INSERT INTO comercial.recibos (pagamento_id, usuario_id, descricao, valor_centavos, moeda)
      VALUES (v_pg, v_ck.usuario_id,
              CASE WHEN v_ck.tipo = 'pro' THEN 'PolarLife Pro · mensal'
                   ELSE v_ck.quantidade || CASE WHEN v_ck.quantidade = 1 THEN ' folha ' ELSE ' folhas ' END || CASE v_ck.classe WHEN 'grande' THEN 'grande' ELSE 'padrão' END END,
              v_ck.valor_centavos, v_ck.moeda)
      RETURNING numero INTO v_rec;
      IF v_ck.tipo = 'folhas' THEN
        PERFORM comercial.lancar_folhas(v_ck.usuario_id, v_ck.classe, v_ck.quantidade, 'compra', v_ck.id, 'checkout:' || v_ck.id);
      ELSE
        INSERT INTO comercial.assinaturas (usuario_id, preco_id, provedor, provedor_assinatura_id, situacao, periodo_inicio, periodo_fim)
        VALUES (v_ck.usuario_id, v_ck.preco_id, v_ck.provedor, coalesce(p_referencia, 'checkout:' || v_ck.id), 'ativa', now(), now() + interval '1 month')
        ON CONFLICT (usuario_id) WHERE situacao IN ('ativa', 'cancelada_no_fim', 'inadimplente')
        DO UPDATE SET situacao = 'ativa', cancelada_em = NULL, periodo_fim = greatest(comercial.assinaturas.periodo_fim, now()) + interval '1 month';
      END IF;
      v_res := 'confirmado; recibo ' || v_rec;
    END IF;
  ELSIF p_tipo = 'payment.refused' THEN
    UPDATE comercial.checkouts SET situacao = 'recusado' WHERE id = p_checkout AND situacao = 'pendente';
    v_res := 'recusado';
  ELSIF p_tipo = 'payment.refunded' THEN
    SELECT c.* INTO v_ck FROM comercial.checkouts c JOIN comercial.pagamentos p ON p.checkout_id = c.id
    WHERE c.id = p_checkout AND p.estornado_em IS NULL FOR UPDATE OF p;
    IF FOUND THEN
      UPDATE comercial.pagamentos SET estornado_em = now() WHERE checkout_id = v_ck.id;
      IF v_ck.tipo = 'folhas' THEN   -- tira as folhas que ainda restam dessa compra (as já usadas não voltam)
        SELECT saldo INTO v_saldo FROM comercial.saldos_folhas WHERE usuario_id = v_ck.usuario_id AND classe = v_ck.classe FOR UPDATE;
        IF least(coalesce(v_saldo, 0), v_ck.quantidade) > 0 THEN
          PERFORM comercial.lancar_folhas(v_ck.usuario_id, v_ck.classe, -least(v_saldo, v_ck.quantidade), 'estorno', v_ck.id, 'estorno:' || v_ck.id);
        END IF;
      ELSE
        UPDATE comercial.assinaturas SET situacao = 'encerrada', cancelada_em = coalesce(cancelada_em, now()), periodo_fim = greatest(periodo_inicio + interval '1 second', now())
        WHERE usuario_id = v_ck.usuario_id AND situacao IN ('ativa', 'cancelada_no_fim', 'inadimplente');
      END IF;
      v_res := 'devolvido';
    ELSE
      v_res := 'devolução sem pagamento correspondente: ignorado';
    END IF;
  ELSIF p_tipo = 'subscription.renewed' THEN
    UPDATE comercial.assinaturas SET situacao = 'ativa', periodo_fim = greatest(periodo_fim, now()) + interval '1 month'
    WHERE provedor = p_provedor AND provedor_assinatura_id = p_referencia AND situacao IN ('ativa', 'inadimplente');
    v_res := CASE WHEN FOUND THEN 'renovada' ELSE 'renovação sem assinatura correspondente: ignorado' END;
  ELSIF p_tipo = 'subscription.canceled' THEN
    UPDATE comercial.assinaturas SET situacao = 'cancelada_no_fim', cancelada_em = coalesce(cancelada_em, now())
    WHERE provedor = p_provedor AND provedor_assinatura_id = p_referencia AND situacao = 'ativa';
    v_res := 'cancelada no fim do período';
  ELSE
    v_res := 'pendente';
  END IF;

  UPDATE comercial.eventos_pagamento SET processado_em = now(), resultado = left(v_res, 120) WHERE id = v_ev;
  RETURN jsonb_build_object('resultado', v_res, 'recibo', v_rec);
END $$;

-- código de impressão (D-124): uso único, com trava na linha; credita as folhas do pacote
CREATE FUNCTION comercial.resgatar_codigo(p_codigo_hmac bytea, p_usuario uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
  v_c comercial.codigos_impressao;
  v_l comercial.lotes_codigos;
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  SELECT * INTO v_c FROM comercial.codigos_impressao WHERE codigo_hmac = p_codigo_hmac FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'código não encontrado' USING ERRCODE = 'PL002'; END IF;
  IF v_c.situacao <> 'ativo' THEN RAISE EXCEPTION 'código já usado ou revogado' USING ERRCODE = 'PL003'; END IF;
  SELECT * INTO v_l FROM comercial.lotes_codigos WHERE id = v_c.lote_id;
  IF v_l.valido_ate IS NOT NULL AND v_l.valido_ate < now() THEN RAISE EXCEPTION 'código vencido' USING ERRCODE = 'PL003'; END IF;
  UPDATE comercial.codigos_impressao SET situacao = 'usado', usado_em = now(), usado_por = p_usuario WHERE id = v_c.id;
  PERFORM comercial.lancar_folhas(p_usuario, v_l.classe, v_l.folhas, 'codigo', v_c.id, 'codigo:' || v_c.id);
  RETURN jsonb_build_object('pacote', v_l.pacote, 'folhas', v_l.folhas, 'classe', v_l.classe, 'fotosMax', v_l.fotos_max);
END $$;

-- cancelar a assinatura em 2 toques: vale até o fim do período (DOC-03 §5)
CREATE FUNCTION comercial.cancelar_assinatura(p_usuario uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v_fim timestamptz;
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  UPDATE comercial.assinaturas SET situacao = 'cancelada_no_fim', cancelada_em = now()
  WHERE usuario_id = p_usuario AND situacao = 'ativa' RETURNING periodo_fim INTO v_fim;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'motivo', 'sem assinatura ativa'); END IF;
  RETURN jsonb_build_object('ok', true, 'valeAte', v_fim);
END $$;

-- ---------- painel do admin (papel admin conferido em cada chamada; tudo vai para a trilha de auditoria) ----------
CREATE FUNCTION comercial.novo_limite(p_plano text, p_folhas_mes integer, p_uso_razoavel integer, p_fotos integer, p_assin_desligar boolean) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v_admin uuid := util.exigir_admin(); v uuid; v_agora timestamptz := clock_timestamp();
BEGIN
  UPDATE comercial.limites_plano SET vigencia = tstzrange(lower(vigencia), v_agora) WHERE plano = p_plano AND upper_inf(vigencia);
  INSERT INTO comercial.limites_plano (plano, vigencia, folhas_mes, uso_razoavel, fotos_por_projeto, assinatura_pode_desligar, criado_por)
  VALUES (p_plano, tstzrange(v_agora, NULL), p_folhas_mes, p_uso_razoavel, p_fotos, p_assin_desligar, v_admin) RETURNING id INTO v;
  RETURN v;
END $$;

CREATE FUNCTION comercial.novo_preco(p_produto text, p_variante text, p_valor integer) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v_admin uuid := util.exigir_admin(); v uuid; v_agora timestamptz := clock_timestamp();
BEGIN
  UPDATE comercial.precos SET vigencia = tstzrange(lower(vigencia), v_agora) WHERE produto = p_produto AND variante = p_variante AND upper_inf(vigencia);
  INSERT INTO comercial.precos (produto, variante, valor_centavos, vigencia, criado_por)
  VALUES (p_produto, p_variante, p_valor, tstzrange(v_agora, NULL), v_admin) RETURNING id INTO v;
  RETURN v;
END $$;

-- a API gera os códigos, mostra o texto uma vez e manda só os HMACs e os 4 últimos caracteres
CREATE FUNCTION comercial.criar_lote_codigos(p_pacote text, p_folhas integer, p_classe text, p_fotos_max integer, p_valido_ate timestamptz,
                                             p_hmacs bytea[], p_finais text[]) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v_admin uuid := util.exigir_admin(); v uuid;
BEGIN
  IF cardinality(p_hmacs) IS DISTINCT FROM cardinality(p_finais) OR cardinality(p_hmacs) < 1 THEN
    RAISE EXCEPTION 'lista de códigos inválida' USING ERRCODE = '22023';
  END IF;
  INSERT INTO comercial.lotes_codigos (pacote, folhas, classe, fotos_max, quantidade, valido_ate, criado_por)
  VALUES (p_pacote, p_folhas, p_classe, p_fotos_max, cardinality(p_hmacs), p_valido_ate, v_admin) RETURNING id INTO v;
  INSERT INTO comercial.codigos_impressao (lote_id, codigo_hmac, final)
  SELECT v, h, f FROM unnest(p_hmacs, p_finais) AS t (h, f);
  RETURN v;
END $$;

CREATE FUNCTION comercial.revogar_codigo(p_codigo uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  PERFORM util.exigir_admin();
  UPDATE comercial.codigos_impressao SET situacao = 'revogado', revogado_em = now() WHERE id = p_codigo AND situacao = 'ativo';
  RETURN FOUND;
END $$;

CREATE FUNCTION comercial.ajustar_folhas(p_usuario uuid, p_classe text, p_qtd integer, p_motivo text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v_admin uuid := util.exigir_admin();
BEGIN
  IF p_qtd = 0 OR p_motivo IS NULL OR char_length(btrim(p_motivo)) < 4 THEN RAISE EXCEPTION 'ajuste precisa de quantidade e motivo' USING ERRCODE = '22023'; END IF;
  INSERT INTO auditoria.eventos (ator_id, ator_papel, acao, tabela, registro_id, depois)
  VALUES (v_admin, 'admin', 'ajuste_folhas', 'comercial.saldos_folhas', p_usuario::text, jsonb_build_object('classe', p_classe, 'quantidade', p_qtd, 'motivo', left(p_motivo, 200)));
  RETURN comercial.lancar_folhas(p_usuario, p_classe, p_qtd, 'ajuste', NULL, 'ajuste:' || util.uuid_v7(), v_admin);
END $$;

-- ---------- privacidade: direitos do titular (LGPD art. 18) ----------
-- acesso e portabilidade: tudo o que o servidor guarda da pessoa, num JSON legível (as fotos e projetos nunca estiveram aqui)
CREATE FUNCTION privacidade.exportar_dados(p_usuario uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  RETURN jsonb_build_object(
    'geradoEm', now(),
    'aviso', 'Fotos, legendas e projetos ficam só no seu aparelho e nunca foram enviados ao PolarLife.',
    'conta', (SELECT jsonb_build_object('id', id, 'email', email, 'nome', nome, 'situacao', situacao, 'criadaEm', criado_em, 'emailConfirmadoEm', email_verificado_em)
              FROM identidade.usuarios WHERE id = p_usuario),
    'temSenha', EXISTS (SELECT 1 FROM identidade.credenciais_senha WHERE usuario_id = p_usuario),
    'entradasExternas', (SELECT coalesce(jsonb_agg(jsonb_build_object('provedor', provedor, 'desde', criado_em, 'ultimoUso', ultimo_uso_em) ORDER BY criado_em), '[]')
                         FROM identidade.identidades_externas WHERE usuario_id = p_usuario),
    'sessoes', (SELECT coalesce(jsonb_agg(jsonb_build_object('criada', criada_em, 'expira', expira_em, 'ultimoUso', ultimo_uso_em, 'encerrada', revogada_em, 'aparelho', aparelho) ORDER BY criada_em), '[]')
                FROM identidade.sessoes WHERE usuario_id = p_usuario),
    'aceites', (SELECT coalesce(jsonb_agg(jsonb_build_object('documento', d.tipo, 'versao', d.versao, 'aceitoEm', a.aceito_em) ORDER BY a.aceito_em), '[]')
                FROM privacidade.aceites a JOIN privacidade.documentos d ON d.id = a.documento_id WHERE a.usuario_id = p_usuario),
    'pedidos', (SELECT coalesce(jsonb_agg(jsonb_build_object('tipo', tipo, 'situacao', situacao, 'recebidoEm', recebido_em, 'concluidoEm', concluido_em) ORDER BY recebido_em), '[]')
                FROM privacidade.pedidos_titular WHERE usuario_id = p_usuario),
    'assinaturas', (SELECT coalesce(jsonb_agg(jsonb_build_object('situacao', situacao, 'inicio', periodo_inicio, 'fim', periodo_fim, 'canceladaEm', cancelada_em, 'semAssinaturaPolarLife', assinatura_desligada) ORDER BY criada_em), '[]')
                    FROM comercial.assinaturas WHERE usuario_id = p_usuario),
    'compras', (SELECT coalesce(jsonb_agg(jsonb_build_object('tipo', tipo, 'classe', classe, 'quantidade', quantidade, 'metodo', metodo, 'valorCentavos', valor_centavos, 'moeda', moeda, 'situacao', situacao, 'criadaEm', criado_em, 'confirmadaEm', confirmado_em) ORDER BY criado_em), '[]')
                FROM comercial.checkouts WHERE usuario_id = p_usuario),
    'recibos', (SELECT coalesce(jsonb_agg(jsonb_build_object('numero', numero, 'descricao', descricao, 'valorCentavos', valor_centavos, 'moeda', moeda, 'emitidoEm', emitido_em) ORDER BY emitido_em), '[]')
                FROM comercial.recibos WHERE usuario_id = p_usuario),
    'folhas', jsonb_build_object(
      'saldo', (SELECT coalesce(jsonb_object_agg(classe, saldo), '{}') FROM comercial.saldos_folhas WHERE usuario_id = p_usuario),
      'movimentos', (SELECT coalesce(jsonb_agg(jsonb_build_object('tipo', tipo, 'classe', classe, 'quantidade', quantidade, 'em', criado_em) ORDER BY id), '[]')
                     FROM comercial.movimentos_folhas WHERE usuario_id = p_usuario)),
    'exportacoesContadas', (SELECT coalesce(jsonb_agg(jsonb_build_object('classe', classe, 'quantidade', quantidade, 'fonte', fonte, 'em', solicitado_em) ORDER BY solicitado_em), '[]')
                            FROM comercial.consumos WHERE usuario_id = p_usuario));
END $$;

-- eliminação: apaga o que não precisa ficar e pseudonimiza o resto. Ficam (sem nome nem e-mail): pagamentos e recibos
-- (obrigação fiscal, LGPD art. 16 I), aceites (prova) e o histórico de folhas. As folhas compradas se perdem (DOC-03 §5).
CREATE FUNCTION privacidade.excluir_conta(p_usuario uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
  v_email text;
  r record;
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  SELECT email INTO v_email FROM identidade.usuarios WHERE id = p_usuario AND situacao <> 'excluida' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'conta não encontrada' USING ERRCODE = 'PL004'; END IF;
  FOR r IN SELECT classe, saldo FROM comercial.saldos_folhas WHERE usuario_id = p_usuario AND saldo > 0 LOOP
    PERFORM comercial.lancar_folhas(p_usuario, r.classe, -r.saldo, 'exclusao_conta', NULL, 'exclusao:' || p_usuario || ':' || r.classe);
  END LOOP;
  UPDATE comercial.assinaturas SET situacao = 'encerrada', cancelada_em = coalesce(cancelada_em, now())
  WHERE usuario_id = p_usuario AND situacao IN ('ativa', 'cancelada_no_fim', 'inadimplente');
  DELETE FROM identidade.sessoes WHERE usuario_id = p_usuario;
  DELETE FROM identidade.credenciais_senha WHERE usuario_id = p_usuario;
  DELETE FROM identidade.identidades_externas WHERE usuario_id = p_usuario;
  DELETE FROM identidade.chaves_acesso WHERE usuario_id = p_usuario;
  DELETE FROM identidade.papeis WHERE usuario_id = p_usuario;
  DELETE FROM identidade.codigos_verificacao WHERE email = v_email;
  DELETE FROM comercial.variantes_conta WHERE usuario_id = p_usuario;
  DELETE FROM privacidade.exportacoes WHERE usuario_id = p_usuario;
  UPDATE identidade.usuarios SET email = NULL, nome = NULL, email_verificado_em = NULL, situacao = 'excluida', excluido_em = now() WHERE id = p_usuario;
  INSERT INTO privacidade.pedidos_titular (usuario_id, tipo, situacao, concluido_em) VALUES (p_usuario, 'eliminacao', 'concluido', now());
  RETURN jsonb_build_object('ok', true, 'mantidos', jsonb_build_array('pagamentos', 'recibos', 'aceites', 'historico_de_folhas'));
END $$;
