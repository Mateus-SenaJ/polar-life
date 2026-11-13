-- PolarLife · banco de dados · 0001 · fundação (D-206)
-- PostgreSQL 16 ou mais novo (18 recomendado). Aplicar como o papel dono (pl_dono), numa transação, com ON_ERROR_STOP.
--
-- Regra de ouro (DOC-12 §6, BR-01, LG-01): este banco NUNCA guarda foto, miniatura, legenda, ajuste, coordenada nem EXIF.
-- Ele existe só para conta, plano, créditos (folhas), pagamentos, recibos e direito de uso (DOC-03 §8 c).
-- Projetos e fotos continuam no aparelho da pessoa (T5).

SET client_min_messages = warning;

-- extensões fora do esquema público
CREATE SCHEMA IF NOT EXISTS ext;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA ext;      -- vigências sem sobreposição (EXCLUDE … WITH &&)

-- papéis de grupo, sem login. Os papéis com login são criados por ambiente (db/README.md), com SCRAM-SHA-256 ou IAM.
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['pl_app', 'pl_admin', 'pl_auditor', 'pl_analitica', 'pl_manutencao'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('CREATE ROLE %I NOLOGIN', r);
    END IF;
  END LOOP;
END $$;
COMMENT ON ROLE pl_app IS 'API do PolarLife agindo pela pessoa que entrou (RLS por app.usuario_id).';
COMMENT ON ROLE pl_admin IS 'Painel do admin: limites, preços, códigos e chaves; lê contas sem segredos.';
COMMENT ON ROLE pl_auditor IS 'Só lê a trilha de auditoria e os registros de acesso (Marco Civil).';
COMMENT ON ROLE pl_analitica IS 'Só lê visões agregadas, sem dado pessoal.';
COMMENT ON ROLE pl_manutencao IS 'Rotinas de retenção, partições e limpeza.';

-- nada de objetos no esquema público
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- um esquema por assunto (governança: cada um tem dono e regra de acesso próprios)
CREATE SCHEMA util;          -- apoio e controle das migrações
CREATE SCHEMA identidade;    -- contas, credenciais, sessões, papéis
CREATE SCHEMA privacidade;   -- documentos legais, aceites, pedidos do titular (LGPD)
CREATE SCHEMA comercial;     -- planos, preços, compras, pagamentos, recibos, folhas, códigos de impressão
CREATE SCHEMA config;        -- parâmetros e chaves de funcionalidade
CREATE SCHEMA auditoria;     -- trilha de auditoria e registros de acesso
CREATE SCHEMA analise;       -- visões agregadas, sem dado pessoal

REVOKE ALL ON SCHEMA util, identidade, privacidade, comercial, config, auditoria, analise FROM PUBLIC;
GRANT USAGE ON SCHEMA util, identidade, privacidade, comercial, config TO pl_app, pl_admin;
GRANT USAGE ON SCHEMA util, auditoria TO pl_auditor;
GRANT USAGE ON SCHEMA analise TO pl_analitica;
GRANT USAGE ON SCHEMA util, identidade, privacidade, comercial, config, auditoria TO pl_manutencao;

-- função nova não nasce executável por qualquer um (só quem recebe GRANT)
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- controle das migrações: versão, nome e SHA-256 do arquivo aplicado (o aplicador grava; nunca se edita uma migração aplicada)
CREATE TABLE util.migracoes (
  versao       integer PRIMARY KEY CHECK (versao > 0),
  nome         text NOT NULL,
  sha256       text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  aplicada_em  timestamptz NOT NULL DEFAULT now(),
  aplicada_por name NOT NULL DEFAULT current_user
);

-- UUIDv7: chave ordenada no tempo (índices compactos) e não sequencial (não revela volume). Nativo no PostgreSQL 18.
CREATE FUNCTION util.uuid_v7() RETURNS uuid
LANGUAGE plpgsql VOLATILE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS $$
DECLARE ms bigint := floor(extract(epoch FROM clock_timestamp()) * 1000);
BEGIN
  RETURN encode(set_bit(set_bit(overlay(uuid_send(gen_random_uuid()) PLACING substring(int8send(ms) FROM 3) FROM 1 FOR 6), 52, 1), 53, 1), 'hex')::uuid;
END $$;
DO $$
BEGIN
  IF to_regprocedure('pg_catalog.uuidv7()') IS NOT NULL THEN
    CREATE OR REPLACE FUNCTION util.uuid_v7() RETURNS uuid LANGUAGE sql VOLATILE PARALLEL SAFE AS 'SELECT pg_catalog.uuidv7()';
  END IF;
END $$;

-- quem está usando (a API grava por transação: SET LOCAL app.usuario_id = '…'); nulo = ninguém
CREATE FUNCTION util.usuario_atual() RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS
$$ SELECT nullif(current_setting('app.usuario_id', true), '')::uuid $$;

-- mês-calendário no fuso de Brasília (DOC-03 §3: folha grátis por mês, sem acúmulo)
CREATE FUNCTION util.mes_brasilia(t timestamptz DEFAULT now()) RETURNS date
LANGUAGE sql STABLE PARALLEL SAFE SET search_path = pg_catalog, pg_temp AS
$$ SELECT date_trunc('month', t AT TIME ZONE 'America/Sao_Paulo')::date $$;

-- carimbo de atualização
CREATE FUNCTION util.tocar_atualizado_em() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END $$;

-- tipos com a regra embutida (qualidade do dado na origem)
CREATE DOMAIN util.email AS text
  CHECK (VALUE = lower(btrim(VALUE)) AND length(VALUE) BETWEEN 3 AND 254 AND VALUE ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$');
CREATE DOMAIN util.centavos AS integer CHECK (VALUE >= 0);              -- dinheiro em centavos inteiros (nunca float)
CREATE DOMAIN util.moeda AS char(3) CHECK (VALUE ~ '^[A-Z]{3}$');        -- ISO 4217
CREATE DOMAIN util.hash256 AS bytea CHECK (octet_length(VALUE) = 32);   -- SHA-256 ou HMAC-SHA-256

GRANT EXECUTE ON FUNCTION util.uuid_v7(), util.usuario_atual(), util.mes_brasilia(timestamptz) TO pl_app, pl_admin, pl_manutencao;
