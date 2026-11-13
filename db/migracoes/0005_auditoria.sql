-- PolarLife · banco de dados · 0005 · auditoria (D-206)
-- Trilha de auditoria só de inclusão (quem mudou o quê, com os segredos e dados pessoais ocultos) e registros de acesso
-- exigidos pelo Marco Civil da Internet (Lei 12.965/2014, art. 15: guarda por 6 meses, sob sigilo).
-- As duas tabelas são particionadas por mês: a retenção apaga partições inteiras (rápido e sem deixar resto).

CREATE TABLE auditoria.eventos (
  id            uuid NOT NULL DEFAULT util.uuid_v7(),
  ocorrido_em   timestamptz NOT NULL DEFAULT now(),
  ator_id       uuid,                               -- sem chave estrangeira: a trilha sobrevive à pseudonimização
  ator_papel    text,
  acao          text NOT NULL CHECK (char_length(acao) <= 60),
  tabela        text NOT NULL,
  registro_id   text,
  antes         jsonb,
  depois        jsonb,
  requisicao_id uuid,
  PRIMARY KEY (id, ocorrido_em)
) PARTITION BY RANGE (ocorrido_em);
CREATE TABLE auditoria.eventos_padrao PARTITION OF auditoria.eventos DEFAULT;
CREATE INDEX eventos_tabela_ix ON auditoria.eventos (tabela, ocorrido_em DESC);

CREATE TABLE auditoria.registros_acesso (
  id           uuid NOT NULL DEFAULT util.uuid_v7(),
  ocorrido_em  timestamptz NOT NULL DEFAULT now(),
  usuario_id   uuid,
  ip           inet NOT NULL,
  porta_origem integer CHECK (porta_origem IS NULL OR porta_origem BETWEEN 0 AND 65535),   -- com IPv4 compartilhado (CGNAT), a porta identifica a conexão
  metodo       text NOT NULL CHECK (metodo IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  rota         text NOT NULL CHECK (char_length(rota) <= 120 AND rota !~ '[?#]'),          -- só o caminho, nunca a consulta
  status       smallint NOT NULL CHECK (status BETWEEN 100 AND 599),
  PRIMARY KEY (id, ocorrido_em)
) PARTITION BY RANGE (ocorrido_em);
CREATE TABLE auditoria.registros_acesso_padrao PARTITION OF auditoria.registros_acesso DEFAULT;
CREATE INDEX registros_usuario_ix ON auditoria.registros_acesso (usuario_id, ocorrido_em DESC);
COMMENT ON TABLE auditoria.registros_acesso IS 'Marco Civil, art. 15: IP, porta, data e hora (UTC) de cada acesso, por 6 meses, sob sigilo; só o papel pl_auditor lê.';

-- só inclusão: nem a API nem o admin alteram ou apagam (a retenção derruba partições inteiras)
CREATE FUNCTION auditoria.so_inclusao() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  RAISE EXCEPTION 'tabela só de inclusão: % não é permitido em %.%', TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME
    USING ERRCODE = 'insufficient_privilege';
END $$;
CREATE TRIGGER eventos_so_inclusao BEFORE UPDATE OR DELETE ON auditoria.eventos FOR EACH ROW EXECUTE FUNCTION auditoria.so_inclusao();
CREATE TRIGGER registros_so_inclusao BEFORE UPDATE OR DELETE ON auditoria.registros_acesso FOR EACH ROW EXECUTE FUNCTION auditoria.so_inclusao();
CREATE TRIGGER movimentos_so_inclusao BEFORE UPDATE OR DELETE ON comercial.movimentos_folhas FOR EACH ROW EXECUTE FUNCTION auditoria.so_inclusao();

-- registra a mudança com segredos e dados pessoais ocultos (minimização: a trilha diz que mudou, não o valor pessoal)
CREATE FUNCTION auditoria.registrar() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
  ocultos CONSTANT text[] := ARRAY['hash', 'token_hash', 'codigo_hash', 'codigo_hmac', 'chave_hash', 'chave_publica', 'credencial_id', 'email', 'nome'];
  a jsonb;
  d jsonb;
  k text;
BEGIN
  IF TG_OP <> 'INSERT' THEN a := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN d := to_jsonb(NEW); END IF;
  FOREACH k IN ARRAY ocultos LOOP
    IF a ? k AND a -> k <> 'null'::jsonb THEN a := jsonb_set(a, ARRAY[k], '"[oculto]"'); END IF;
    IF d ? k AND d -> k <> 'null'::jsonb THEN d := jsonb_set(d, ARRAY[k], '"[oculto]"'); END IF;
  END LOOP;
  INSERT INTO auditoria.eventos (ator_id, ator_papel, acao, tabela, registro_id, antes, depois, requisicao_id)
  VALUES (nullif(current_setting('app.usuario_id', true), '')::uuid,
          nullif(current_setting('app.papel', true), ''),
          lower(TG_OP),
          TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
          coalesce(d ->> 'id', a ->> 'id', d ->> 'usuario_id', a ->> 'usuario_id', d ->> 'chave', a ->> 'chave'),
          a, d,
          nullif(current_setting('app.requisicao_id', true), '')::uuid);
  RETURN coalesce(NEW, OLD);
END $$;

-- o que é sensível para o negócio ou para a segurança fica na trilha
CREATE TRIGGER aud_usuarios AFTER UPDATE OF situacao, email, email_verificado_em ON identidade.usuarios FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();
CREATE TRIGGER aud_papeis AFTER INSERT OR UPDATE OR DELETE ON identidade.papeis FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();
CREATE TRIGGER aud_chaves_acesso AFTER INSERT OR DELETE ON identidade.chaves_acesso FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();
CREATE TRIGGER aud_limites AFTER INSERT OR UPDATE OR DELETE ON comercial.limites_plano FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();
CREATE TRIGGER aud_precos AFTER INSERT OR UPDATE OR DELETE ON comercial.precos FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();
CREATE TRIGGER aud_lotes AFTER INSERT OR UPDATE OR DELETE ON comercial.lotes_codigos FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();
CREATE TRIGGER aud_codigos AFTER UPDATE OR DELETE ON comercial.codigos_impressao FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();
CREATE TRIGGER aud_assinaturas AFTER INSERT OR UPDATE ON comercial.assinaturas FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();
CREATE TRIGGER aud_chaves AFTER INSERT OR UPDATE OR DELETE ON config.chaves FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();
CREATE TRIGGER aud_parametros AFTER INSERT OR UPDATE OR DELETE ON config.parametros FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();
CREATE TRIGGER aud_pedidos AFTER INSERT OR UPDATE ON privacidade.pedidos_titular FOR EACH ROW EXECUTE FUNCTION auditoria.registrar();
