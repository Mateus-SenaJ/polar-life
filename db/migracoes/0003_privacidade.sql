-- PolarLife · banco de dados · 0003 · privacidade (D-206)
-- Prova do que foi aceito (Termos, Privacidade, Cookies) e os pedidos do titular (LGPD art. 18 e 19).

CREATE TABLE privacidade.documentos (
  id              uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  tipo            text NOT NULL CHECK (tipo IN ('termos', 'privacidade', 'cookies')),
  versao          text NOT NULL CHECK (versao ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}([.][0-9]+)?$'),   -- data da publicação
  conteudo_sha256 util.hash256 NOT NULL,           -- o texto fica publicado no site; aqui a prova de qual versão foi aceita
  publicado_em    timestamptz NOT NULL,
  UNIQUE (tipo, versao)
);

CREATE TABLE privacidade.aceites (
  id           uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  usuario_id   uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE RESTRICT,   -- a prova sobrevive à pseudonimização
  documento_id uuid NOT NULL REFERENCES privacidade.documentos (id) ON DELETE RESTRICT,
  aceito_em    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, documento_id)
);
CREATE INDEX aceites_documento_ix ON privacidade.aceites (documento_id);

CREATE TABLE privacidade.pedidos_titular (        -- LGPD art. 18; resposta completa em até 15 dias (art. 19 II)
  id           uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  usuario_id   uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE RESTRICT,
  tipo         text NOT NULL CHECK (tipo IN ('confirmacao', 'acesso', 'correcao', 'portabilidade', 'eliminacao', 'revogacao', 'informacao')),
  situacao     text NOT NULL DEFAULT 'recebido' CHECK (situacao IN ('recebido', 'em_andamento', 'concluido', 'negado')),
  recebido_em  timestamptz NOT NULL DEFAULT now(),
  prazo_em     timestamptz NOT NULL DEFAULT (now() + interval '15 days'),
  concluido_em timestamptz,
  motivo       text CHECK (motivo IS NULL OR char_length(motivo) <= 500),
  CHECK ((situacao IN ('concluido', 'negado')) = (concluido_em IS NOT NULL)),
  CHECK (situacao <> 'negado' OR motivo IS NOT NULL)
);
CREATE INDEX pedidos_usuario_ix ON privacidade.pedidos_titular (usuario_id);
CREATE INDEX pedidos_abertos_ix ON privacidade.pedidos_titular (prazo_em) WHERE situacao IN ('recebido', 'em_andamento');

CREATE TABLE privacidade.exportacoes (            -- «Exportar meus dados»: arquivo privado, disponível por 24 h
  id            uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  usuario_id    uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE CASCADE,
  situacao      text NOT NULL DEFAULT 'pendente' CHECK (situacao IN ('pendente', 'pronta', 'expirada')),
  solicitada_em timestamptz NOT NULL DEFAULT now(),
  arquivo_ref   text CHECK (arquivo_ref IS NULL OR char_length(arquivo_ref) <= 300),   -- chave no armazenamento privado, nunca link público
  expira_em     timestamptz,
  CHECK (situacao <> 'pronta' OR (arquivo_ref IS NOT NULL AND expira_em IS NOT NULL))
);
CREATE INDEX exportacoes_usuario_ix ON privacidade.exportacoes (usuario_id);
