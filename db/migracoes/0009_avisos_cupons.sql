-- PolarLife · banco de dados · 0009 · avisos e cupons (D-208)
-- Notificações: campanhas do admin (promoção, anúncio, aviso do sistema), textos dos avisos automáticos, preferências de cada
-- conta, inscrições de Web Push e a entrega por conta e canal. Lembranças e sugestões são montadas no aparelho: o servidor só
-- manda o gatilho; nenhuma foto, miniatura, legenda ou data de foto chega aqui (BR-01, T5). Cupons promocionais: só o HMAC do
-- cupom fica guardado (como os códigos de impressão). DOC-16, DOC-15 §8.
--   PL007 cupom não encontrado · PL008 cupom vencido, esgotado, pausado, revogado ou já usado · PL009 cupom não vale para este produto

CREATE SCHEMA avisos;
REVOKE ALL ON SCHEMA avisos FROM PUBLIC;
GRANT USAGE ON SCHEMA avisos TO pl_app, pl_admin, pl_manutencao;

-- ---------- avisos ----------
CREATE TABLE avisos.campanhas (                   -- o que o admin cria e lança
  id            uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  tipo          text NOT NULL CHECK (tipo IN ('promocao', 'anuncio', 'sistema')),
  titulo        text NOT NULL CHECK (char_length(titulo) BETWEEN 1 AND 60),
  texto         text NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 160),
  destino       text CHECK (destino IS NULL OR destino ~ '^[a-z0-9/#?=&_.-]{0,80}$'),   -- caminho dentro do app, nunca endereço de fora
  botao         text CHECK (botao IS NULL OR char_length(botao) BETWEEN 1 AND 24),
  publico       text NOT NULL DEFAULT 'todos' CHECK (publico IN ('todos', 'gratis', 'avulsa', 'assinantes', 'codigo-vencendo')),
  canal         text NOT NULL DEFAULT 'app' CHECK (canal IN ('app', 'sistema')),
  inicio        timestamptz,
  fim           timestamptz,
  situacao      text NOT NULL DEFAULT 'rascunho' CHECK (situacao IN ('rascunho', 'agendada', 'ativa', 'pausada', 'encerrada')),
  criado_por    uuid REFERENCES identidade.usuarios (id) ON DELETE SET NULL,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  lancada_em    timestamptz,
  encerrada_em  timestamptz,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CHECK (fim IS NULL OR inicio IS NULL OR fim > inicio),
  CHECK ((situacao = 'agendada') <= (inicio IS NOT NULL))
);
CREATE INDEX campanhas_vivas_ix ON avisos.campanhas (situacao, inicio) WHERE situacao IN ('agendada', 'ativa');
CREATE TRIGGER campanhas_atualizada BEFORE UPDATE ON avisos.campanhas FOR EACH ROW EXECUTE FUNCTION util.tocar_atualizado_em();

CREATE TABLE avisos.modelos (                     -- textos dos avisos automáticos; o aparelho preenche {anos}, {data}, {dias}…
  tipo          text PRIMARY KEY CHECK (tipo IN ('lembranca', 'sugestao', 'codigo')),
  titulo        text NOT NULL CHECK (char_length(titulo) BETWEEN 1 AND 80),
  texto         text NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 200),
  pausado       boolean NOT NULL DEFAULT false,
  atualizado_por uuid REFERENCES identidade.usuarios (id) ON DELETE SET NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER modelos_atualizado BEFORE UPDATE ON avisos.modelos FOR EACH ROW EXECUTE FUNCTION util.tocar_atualizado_em();
INSERT INTO avisos.modelos (tipo, titulo, texto) VALUES
  ('lembranca', 'Há {anos}: {fotos} de {data}', 'Reveja este dia e faça uma colagem com as suas fotos.'),
  ('sugestao', 'Você tem {fotos} de {mes}', 'Que tal uma retrospectiva? A colagem começa com as fotos que já estão no seu aparelho.'),
  ('codigo', 'Seu código vence em {dias}', 'O código {codigo} vale até {data}. Restam {folhas}.');

CREATE TABLE avisos.preferencias (                -- discrição (DOC-16 §3): por tipo, canal, horário silencioso e no máximo N por dia
  usuario_id      uuid PRIMARY KEY REFERENCES identidade.usuarios (id) ON DELETE CASCADE,
  ligado          boolean NOT NULL DEFAULT true,
  tipos           jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(tipos) = 'object'),   -- {"lembranca": false}; ausente = ligado
  canal           text NOT NULL DEFAULT 'app' CHECK (canal IN ('app', 'sistema')),
  silencio_inicio smallint NOT NULL DEFAULT 22 CHECK (silencio_inicio BETWEEN 0 AND 23),
  silencio_fim    smallint NOT NULL DEFAULT 8 CHECK (silencio_fim BETWEEN 0 AND 23),
  maximo_dia      smallint NOT NULL DEFAULT 1 CHECK (maximo_dia BETWEEN 0 AND 3),
  atualizado_em   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER preferencias_atualizada BEFORE UPDATE ON avisos.preferencias FOR EACH ROW EXECUTE FUNCTION util.tocar_atualizado_em();

CREATE TABLE avisos.inscricoes_push (             -- Web Push (VAPID): endereço e chaves que o navegador entrega; sem dado de foto
  id              uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  usuario_id      uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE CASCADE,
  endpoint        text NOT NULL UNIQUE CHECK (endpoint ~ '^https://' AND char_length(endpoint) <= 1000),
  chave_p256dh    text NOT NULL CHECK (char_length(chave_p256dh) BETWEEN 40 AND 200),
  chave_auth      text NOT NULL CHECK (char_length(chave_auth) BETWEEN 10 AND 60),
  aparelho        text CHECK (char_length(aparelho) <= 80),
  criada_em       timestamptz NOT NULL DEFAULT now(),
  ultimo_envio_em timestamptz,
  revogada_em     timestamptz
);
CREATE INDEX inscricoes_usuario_ix ON avisos.inscricoes_push (usuario_id) WHERE revogada_em IS NULL;

CREATE TABLE avisos.entregas (                    -- uma linha por aviso, conta e canal (idempotente pela chave)
  id            uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  usuario_id    uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE CASCADE,
  campanha_id   uuid REFERENCES avisos.campanhas (id) ON DELETE CASCADE,
  tipo          text NOT NULL CHECK (tipo IN ('lembranca', 'sugestao', 'codigo', 'promocao', 'anuncio', 'sistema')),
  canal         text NOT NULL CHECK (canal IN ('app', 'sistema')),
  chave         text NOT NULL CHECK (char_length(chave) BETWEEN 3 AND 120),   -- 'campanha:<id>', 'gatilho:lembranca:2026-11-13', 'prazo:<id>:3'
  situacao      text NOT NULL DEFAULT 'pendente' CHECK (situacao IN ('pendente', 'enviada', 'aberta', 'dispensada', 'falhou')),
  criada_em     timestamptz NOT NULL DEFAULT now(),
  enviada_em    timestamptz,
  aberta_em     timestamptz,
  dispensada_em timestamptz,
  UNIQUE (usuario_id, chave, canal),
  CHECK ((campanha_id IS NOT NULL) = (tipo IN ('promocao', 'anuncio', 'sistema')))
);
CREATE INDEX entregas_usuario_ix ON avisos.entregas (usuario_id, criada_em DESC);
CREATE INDEX entregas_campanha_ix ON avisos.entregas (campanha_id) WHERE campanha_id IS NOT NULL;

-- contadores de cada campanha para o painel do admin (sem dado pessoal)
CREATE VIEW avisos.resumo_campanhas WITH (security_barrier) AS
  SELECT c.id AS campanha_id, c.titulo, c.situacao,
         count(e.id) FILTER (WHERE e.situacao IN ('enviada', 'aberta', 'dispensada')) AS entregues,
         count(e.id) FILTER (WHERE e.situacao = 'aberta') AS abertas,
         count(e.id) FILTER (WHERE e.situacao = 'dispensada') AS dispensadas
  FROM avisos.campanhas c LEFT JOIN avisos.entregas e ON e.campanha_id = c.id
  GROUP BY c.id, c.titulo, c.situacao;

-- ---------- cupons promocionais ----------
CREATE TABLE comercial.cupons (
  id             uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  codigo_hmac    bytea NOT NULL UNIQUE,            -- só o HMAC do cupom (o texto nunca fica no banco; a trilha de auditoria já oculta este nome)
  final          text NOT NULL CHECK (final ~ '^[A-Z0-9]{2,4}$'),   -- o fim do cupom, para o admin reconhecer
  rotulo         text NOT NULL CHECK (char_length(rotulo) BETWEEN 1 AND 60),
  tipo           text NOT NULL CHECK (tipo IN ('percentual', 'valor')),
  percentual     smallint CHECK (percentual BETWEEN 1 AND 90),
  valor_centavos util.centavos,
  produtos       text[] NOT NULL DEFAULT ARRAY['folha_padrao', 'folha_grande', 'pro_mensal']
                 CHECK (cardinality(produtos) >= 1 AND produtos <@ ARRAY['folha_padrao', 'folha_grande', 'pro_mensal']),
  valido_de      timestamptz NOT NULL DEFAULT now(),
  valido_ate     timestamptz,
  usos_max       integer CHECK (usos_max IS NULL OR usos_max > 0),
  usos           integer NOT NULL DEFAULT 0 CHECK (usos >= 0),
  um_por_conta   boolean NOT NULL DEFAULT true,
  situacao       text NOT NULL DEFAULT 'ativo' CHECK (situacao IN ('ativo', 'pausado', 'revogado')),
  criado_por     uuid REFERENCES identidade.usuarios (id) ON DELETE SET NULL,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now(),
  CHECK ((tipo = 'percentual') = (percentual IS NOT NULL) AND (tipo = 'valor') = (valor_centavos IS NOT NULL)),
  CHECK (valido_ate IS NULL OR valido_ate > valido_de),
  CHECK (usos_max IS NULL OR usos <= usos_max)
);
CREATE TRIGGER cupons_atualizado BEFORE UPDATE ON comercial.cupons FOR EACH ROW EXECUTE FUNCTION util.tocar_atualizado_em();

CREATE TABLE comercial.usos_cupons (
  id                uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  cupom_id          uuid NOT NULL REFERENCES comercial.cupons (id) ON DELETE RESTRICT,
  usuario_id        uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE RESTRICT,
  checkout_id       uuid REFERENCES comercial.checkouts (id) ON DELETE SET NULL,
  produto           text NOT NULL CHECK (produto IN ('folha_padrao', 'folha_grande', 'pro_mensal')),
  desconto_centavos util.centavos NOT NULL,
  usado_em          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX usos_cupons_ix ON comercial.usos_cupons (cupom_id, usuario_id);
CREATE TRIGGER aud_cupons AFTER INSERT OR UPDATE OR DELETE ON comercial.cupons FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();
CREATE TRIGGER aud_campanhas AFTER INSERT OR UPDATE OR DELETE ON avisos.campanhas FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();
CREATE TRIGGER aud_modelos AFTER UPDATE ON avisos.modelos FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();

-- ---------- regras: avisos ----------
-- preferências da própria conta (PUT /conta/avisos/preferencias)
CREATE FUNCTION avisos.salvar_preferencias(p_usuario uuid, p_ligado boolean, p_tipos jsonb, p_canal text, p_inicio smallint, p_fim smallint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v avisos.preferencias;
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  IF p_tipos IS NOT NULL AND EXISTS (SELECT 1 FROM jsonb_each(p_tipos) t
      WHERE t.key NOT IN ('lembranca', 'sugestao', 'codigo', 'promocao', 'anuncio', 'sistema') OR jsonb_typeof(t.value) <> 'boolean') THEN
    RAISE EXCEPTION 'tipos de aviso inválidos' USING ERRCODE = '22023';
  END IF;
  INSERT INTO avisos.preferencias AS a (usuario_id, ligado, tipos, canal, silencio_inicio, silencio_fim)
  VALUES (p_usuario, coalesce(p_ligado, true), coalesce(p_tipos, '{}'), coalesce(p_canal, 'app'), coalesce(p_inicio, 22), coalesce(p_fim, 8))
  ON CONFLICT (usuario_id) DO UPDATE SET ligado = coalesce(p_ligado, a.ligado), tipos = a.tipos || coalesce(p_tipos, '{}'),
    canal = coalesce(p_canal, a.canal), silencio_inicio = coalesce(p_inicio, a.silencio_inicio), silencio_fim = coalesce(p_fim, a.silencio_fim)
  RETURNING * INTO v;
  RETURN jsonb_build_object('ligado', v.ligado, 'tipos', v.tipos, 'canal', v.canal, 'silencio', jsonb_build_object('ini', v.silencio_inicio, 'fim', v.silencio_fim));
END $$;

-- o navegador deu o endereço de push: grava (o mesmo endereço noutra conta muda de dono: o aparelho trocou de conta)
CREATE FUNCTION avisos.inscrever_push(p_usuario uuid, p_endpoint text, p_p256dh text, p_auth text, p_aparelho text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v uuid;
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  INSERT INTO avisos.inscricoes_push AS i (usuario_id, endpoint, chave_p256dh, chave_auth, aparelho)
  VALUES (p_usuario, p_endpoint, p_p256dh, p_auth, left(p_aparelho, 80))
  ON CONFLICT (endpoint) DO UPDATE SET usuario_id = p_usuario, chave_p256dh = p_p256dh, chave_auth = p_auth, aparelho = left(p_aparelho, 80), revogada_em = NULL
  RETURNING id INTO v;
  RETURN v;
END $$;

CREATE FUNCTION avisos.cancelar_push(p_usuario uuid, p_endpoint text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  UPDATE avisos.inscricoes_push SET revogada_em = now() WHERE usuario_id = p_usuario AND endpoint = p_endpoint AND revogada_em IS NULL;
  RETURN FOUND;
END $$;

-- campanhas no ar para esta conta, pelo plano (o público «codigo-vencendo» é conferido no aparelho, que conhece a validade)
CREATE FUNCTION avisos.caixa(p_usuario uuid) RETURNS TABLE (id uuid, tipo text, titulo text, texto text, destino text, botao text, canal text, fim timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
#variable_conflict use_column
DECLARE v_plano text;
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  v_plano := comercial.plano_de(p_usuario);
  RETURN QUERY
    SELECT c.id, c.tipo, c.titulo, c.texto, c.destino, c.botao, c.canal, c.fim FROM avisos.campanhas c
    WHERE c.situacao IN ('ativa', 'agendada') AND (c.inicio IS NULL OR c.inicio <= now()) AND (c.fim IS NULL OR c.fim > now())
      AND (c.publico = 'todos' OR (c.publico = 'gratis' AND v_plano = 'gratis') OR (c.publico = 'avulsa' AND v_plano = 'avulsa')
           OR (c.publico = 'assinantes' AND v_plano = 'pro'))
      AND NOT EXISTS (SELECT 1 FROM avisos.entregas e WHERE e.usuario_id = p_usuario AND e.campanha_id = c.id AND e.situacao = 'dispensada')
    ORDER BY coalesce(c.inicio, c.lancada_em) DESC;
END $$;

-- a conta abriu, dispensou ou recebeu um aviso (idempotente pela chave)
CREATE FUNCTION avisos.marcar(p_usuario uuid, p_tipo text, p_canal text, p_chave text, p_campanha uuid, p_situacao text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  IF p_situacao NOT IN ('enviada', 'aberta', 'dispensada', 'falhou') THEN RAISE EXCEPTION 'situação inválida' USING ERRCODE = '22023'; END IF;
  INSERT INTO avisos.entregas AS e (usuario_id, campanha_id, tipo, canal, chave, situacao, enviada_em, aberta_em, dispensada_em)
  VALUES (p_usuario, p_campanha, p_tipo, p_canal, p_chave, p_situacao,
          CASE WHEN p_situacao <> 'falhou' THEN now() END, CASE WHEN p_situacao = 'aberta' THEN now() END, CASE WHEN p_situacao = 'dispensada' THEN now() END)
  ON CONFLICT (usuario_id, chave, canal) DO UPDATE SET situacao = p_situacao,
    aberta_em = CASE WHEN p_situacao = 'aberta' THEN coalesce(e.aberta_em, now()) ELSE e.aberta_em END,
    dispensada_em = CASE WHEN p_situacao = 'dispensada' THEN now() ELSE e.dispensada_em END;
  RETURN p_situacao;
END $$;

-- admin: cria ou edita uma campanha (só rascunho, agendada ou pausada se edita)
CREATE FUNCTION avisos.salvar_campanha(p_id uuid, p_tipo text, p_titulo text, p_texto text, p_destino text, p_botao text, p_publico text,
                                       p_canal text, p_inicio timestamptz, p_fim timestamptz) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v_admin uuid := util.exigir_admin(); v uuid;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO avisos.campanhas (tipo, titulo, texto, destino, botao, publico, canal, inicio, fim, criado_por)
    VALUES (p_tipo, p_titulo, p_texto, nullif(p_destino, ''), nullif(p_botao, ''), coalesce(p_publico, 'todos'), coalesce(p_canal, 'app'), p_inicio, p_fim, v_admin)
    RETURNING id INTO v;
    RETURN v;
  END IF;
  UPDATE avisos.campanhas SET tipo = p_tipo, titulo = p_titulo, texto = p_texto, destino = nullif(p_destino, ''), botao = nullif(p_botao, ''),
    publico = coalesce(p_publico, 'todos'), canal = coalesce(p_canal, 'app'), inicio = p_inicio, fim = p_fim
  WHERE id = p_id AND situacao IN ('rascunho', 'agendada', 'pausada') RETURNING id INTO v;
  IF v IS NULL THEN RAISE EXCEPTION 'campanha no ar ou encerrada não se edita: pause ou duplique' USING ERRCODE = '22023'; END IF;
  RETURN v;
END $$;

-- admin: lançar, agendar, pausar, retomar ou encerrar (máquina de estados)
CREATE FUNCTION avisos.mudar_campanha(p_id uuid, p_acao text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v_admin uuid := util.exigir_admin(); c avisos.campanhas; v_nova text;
BEGIN
  SELECT * INTO c FROM avisos.campanhas WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'campanha não encontrada' USING ERRCODE = '22023'; END IF;
  v_nova := CASE
    WHEN p_acao = 'lancar' AND c.situacao IN ('rascunho', 'agendada', 'pausada') AND (c.fim IS NULL OR c.fim > now()) THEN 'ativa'
    WHEN p_acao = 'agendar' AND c.situacao IN ('rascunho', 'pausada') AND c.inicio > now() THEN 'agendada'
    WHEN p_acao = 'pausar' AND c.situacao IN ('ativa', 'agendada') THEN 'pausada'
    WHEN p_acao = 'retomar' AND c.situacao = 'pausada' THEN CASE WHEN c.inicio > now() THEN 'agendada' ELSE 'ativa' END
    WHEN p_acao = 'encerrar' AND c.situacao <> 'encerrada' THEN 'encerrada' END;
  IF v_nova IS NULL THEN RAISE EXCEPTION 'ação % não vale para campanha %', p_acao, c.situacao USING ERRCODE = '22023'; END IF;
  UPDATE avisos.campanhas SET situacao = v_nova,
    inicio = CASE WHEN p_acao = 'lancar' THEN least(coalesce(inicio, now()), now()) ELSE inicio END,
    lancada_em = CASE WHEN v_nova = 'ativa' THEN coalesce(lancada_em, now()) ELSE lancada_em END,
    encerrada_em = CASE WHEN v_nova = 'encerrada' THEN now() ELSE encerrada_em END
  WHERE id = p_id;
  RETURN v_nova;
END $$;

-- admin: textos dos avisos automáticos (as variáveis entre chaves são do aparelho)
CREATE FUNCTION avisos.salvar_modelo(p_tipo text, p_titulo text, p_texto text, p_pausado boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v_admin uuid := util.exigir_admin();
BEGIN
  UPDATE avisos.modelos SET titulo = coalesce(p_titulo, titulo), texto = coalesce(p_texto, texto), pausado = coalesce(p_pausado, pausado), atualizado_por = v_admin
  WHERE tipo = p_tipo;
  IF NOT FOUND THEN RAISE EXCEPTION 'tipo de aviso automático inválido' USING ERRCODE = '22023'; END IF;
END $$;

-- ---------- regras: cupons ----------
-- desconto do cupom num valor (centavos), sem usar (a tela mostra o preço antes e depois)
CREATE FUNCTION comercial.conferir_cupom(p_cupom_hmac bytea, p_usuario uuid, p_produto text, p_valor util.centavos) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE c comercial.cupons; v_desc integer;
BEGIN
  PERFORM util.exigir_dono(p_usuario);
  SELECT * INTO c FROM comercial.cupons WHERE codigo_hmac = p_cupom_hmac;
  IF NOT FOUND THEN RAISE EXCEPTION 'cupom não encontrado' USING ERRCODE = 'PL007'; END IF;
  IF c.situacao <> 'ativo' THEN RAISE EXCEPTION 'cupom % ', c.situacao USING ERRCODE = 'PL008'; END IF;
  IF c.valido_de > now() OR (c.valido_ate IS NOT NULL AND c.valido_ate <= now()) THEN RAISE EXCEPTION 'cupom fora da validade' USING ERRCODE = 'PL008'; END IF;
  IF c.usos_max IS NOT NULL AND c.usos >= c.usos_max THEN RAISE EXCEPTION 'cupom esgotado' USING ERRCODE = 'PL008'; END IF;
  IF c.um_por_conta AND EXISTS (SELECT 1 FROM comercial.usos_cupons WHERE cupom_id = c.id AND usuario_id = p_usuario) THEN
    RAISE EXCEPTION 'cupom já usado nesta conta' USING ERRCODE = 'PL008';
  END IF;
  IF NOT (p_produto = ANY (c.produtos)) THEN RAISE EXCEPTION 'cupom não vale para este produto' USING ERRCODE = 'PL009'; END IF;
  v_desc := CASE WHEN c.tipo = 'percentual' THEN round(p_valor * c.percentual / 100.0)::integer ELSE least(c.valor_centavos, p_valor) END;
  RETURN jsonb_build_object('cupom', c.id, 'rotulo', c.rotulo, 'desconto', v_desc, 'valor', p_valor - v_desc, 'validoAte', c.valido_ate);
END $$;

-- usa o cupom na compra (trava a linha: dois usos ao mesmo tempo não passam do limite)
CREATE FUNCTION comercial.usar_cupom(p_cupom_hmac bytea, p_usuario uuid, p_produto text, p_valor util.centavos, p_checkout uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE c comercial.cupons; r jsonb;
BEGIN
  SELECT * INTO c FROM comercial.cupons WHERE codigo_hmac = p_cupom_hmac FOR UPDATE;
  r := comercial.conferir_cupom(p_cupom_hmac, p_usuario, p_produto, p_valor);
  UPDATE comercial.cupons SET usos = usos + 1 WHERE id = c.id;
  INSERT INTO comercial.usos_cupons (cupom_id, usuario_id, checkout_id, produto, desconto_centavos)
  VALUES (c.id, p_usuario, p_checkout, p_produto, (r ->> 'desconto')::integer);
  RETURN r;
END $$;

-- admin: cria um cupom (recebe só o HMAC e o final) e muda a situação
CREATE FUNCTION comercial.novo_cupom(p_hmac bytea, p_final text, p_rotulo text, p_tipo text, p_percentual smallint, p_valor util.centavos,
                                     p_produtos text[], p_valido_ate timestamptz, p_usos_max integer, p_um_por_conta boolean) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v_admin uuid := util.exigir_admin(); v uuid;
BEGIN
  INSERT INTO comercial.cupons (codigo_hmac, final, rotulo, tipo, percentual, valor_centavos, produtos, valido_ate, usos_max, um_por_conta, criado_por)
  VALUES (p_hmac, upper(p_final), p_rotulo, p_tipo, p_percentual, p_valor, coalesce(p_produtos, ARRAY['folha_padrao', 'folha_grande', 'pro_mensal']),
          p_valido_ate, p_usos_max, coalesce(p_um_por_conta, true), v_admin)
  RETURNING id INTO v;
  RETURN v;
END $$;

CREATE FUNCTION comercial.mudar_cupom(p_id uuid, p_situacao text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE v_admin uuid := util.exigir_admin();
BEGIN
  UPDATE comercial.cupons SET situacao = p_situacao WHERE id = p_id AND situacao <> 'revogado';   -- revogado não volta
  IF NOT FOUND THEN RAISE EXCEPTION 'cupom não encontrado ou revogado' USING ERRCODE = 'PL007'; END IF;
  RETURN p_situacao;
END $$;

-- ---------- acesso ----------
ALTER TABLE avisos.preferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos.inscricoes_push ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos.entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comercial.usos_cupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY preferencias_dono ON avisos.preferencias FOR SELECT TO pl_app USING (usuario_id = util.usuario_atual());
CREATE POLICY inscricoes_dono ON avisos.inscricoes_push FOR SELECT TO pl_app USING (usuario_id = util.usuario_atual());
CREATE POLICY entregas_dono ON avisos.entregas FOR SELECT TO pl_app USING (usuario_id = util.usuario_atual());
CREATE POLICY usos_cupons_dono ON comercial.usos_cupons FOR SELECT TO pl_app USING (usuario_id = util.usuario_atual());
CREATE POLICY usos_cupons_admin ON comercial.usos_cupons FOR SELECT TO pl_admin USING (true);

GRANT SELECT ON avisos.preferencias, avisos.entregas, avisos.modelos TO pl_app;
GRANT SELECT (id, aparelho, criada_em, ultimo_envio_em, revogada_em) ON avisos.inscricoes_push TO pl_app;   -- nunca as chaves de volta
GRANT SELECT (id, cupom_id, produto, desconto_centavos, usado_em) ON comercial.usos_cupons TO pl_app;
GRANT SELECT ON avisos.campanhas, avisos.modelos, avisos.resumo_campanhas TO pl_admin;
GRANT SELECT (id, final, rotulo, tipo, percentual, valor_centavos, produtos, valido_de, valido_ate, usos_max, usos, um_por_conta, situacao, criado_em)
  ON comercial.cupons TO pl_admin;   -- nunca o HMAC
GRANT SELECT ON comercial.usos_cupons TO pl_admin;
GRANT EXECUTE ON FUNCTION
  avisos.salvar_preferencias(uuid, boolean, jsonb, text, smallint, smallint), avisos.inscrever_push(uuid, text, text, text, text),
  avisos.cancelar_push(uuid, text), avisos.caixa(uuid), avisos.marcar(uuid, text, text, text, uuid, text),
  comercial.conferir_cupom(bytea, uuid, text, util.centavos), comercial.usar_cupom(bytea, uuid, text, util.centavos, uuid)
TO pl_app;
GRANT EXECUTE ON FUNCTION
  avisos.salvar_campanha(uuid, text, text, text, text, text, text, text, timestamptz, timestamptz), avisos.mudar_campanha(uuid, text),
  avisos.salvar_modelo(text, text, text, boolean),
  comercial.novo_cupom(bytea, text, text, text, smallint, util.centavos, text[], timestamptz, integer, boolean), comercial.mudar_cupom(uuid, text)
TO pl_admin;
-- a manutenção (envio do push, job diário) lê as inscrições e grava as entregas; nunca lê fotos (não há)
GRANT SELECT, UPDATE (ultimo_envio_em, revogada_em) ON avisos.inscricoes_push TO pl_manutencao;
GRANT SELECT, INSERT, UPDATE ON avisos.entregas TO pl_manutencao;
GRANT SELECT ON avisos.campanhas, avisos.preferencias, avisos.modelos TO pl_manutencao;
CREATE POLICY inscricoes_manutencao ON avisos.inscricoes_push FOR ALL TO pl_manutencao USING (true) WITH CHECK (true);
CREATE POLICY entregas_manutencao ON avisos.entregas FOR ALL TO pl_manutencao USING (true) WITH CHECK (true);
CREATE POLICY preferencias_manutencao ON avisos.preferencias FOR SELECT TO pl_manutencao USING (true);
