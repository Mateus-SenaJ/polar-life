-- PolarLife · banco de dados · 0004 · comercial (D-206)
-- Planos e limites (com histórico), preços (o de quem comprou nunca muda), checkout hospedado (cartão nunca passa por nós),
-- eventos de pagamento idempotentes, pagamentos e recibos (guarda fiscal), saldo e livro-razão de folhas, consumo com a
-- regra das 24 h e códigos de impressão (só o HMAC). DOC-03 §2 a §8, DOC-12 §6.

CREATE TABLE comercial.planos (
  codigo text PRIMARY KEY CHECK (codigo IN ('gratis', 'avulsa', 'pro')),
  nome   text NOT NULL,
  ativo  boolean NOT NULL DEFAULT true
);

CREATE TABLE comercial.limites_plano (            -- o admin muda criando uma versão nova (histórico completo)
  id                       uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  plano                    text NOT NULL REFERENCES comercial.planos (codigo),
  vigencia                 tstzrange NOT NULL DEFAULT tstzrange(now(), NULL),
  folhas_mes               integer CHECK (folhas_mes IS NULL OR folhas_mes >= 0),        -- grátis: 1 por mês (sem acúmulo)
  uso_razoavel             integer CHECK (uso_razoavel IS NULL OR uso_razoavel > 0),     -- Pro: aviso em 80%, sem bloqueio automático
  fotos_por_projeto        integer NOT NULL CHECK (fotos_por_projeto BETWEEN 1 AND 400),
  assinatura_pode_desligar boolean NOT NULL DEFAULT false,
  criado_por               uuid REFERENCES identidade.usuarios (id) ON DELETE SET NULL,
  criado_em                timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT limites_sem_sobreposicao EXCLUDE USING gist (plano WITH =, vigencia WITH &&)
);

CREATE TABLE comercial.precos (                   -- preço é versão: a compra guarda o preço cobrado (DOC-03 §8)
  id             uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  produto        text NOT NULL CHECK (produto IN ('folha_padrao', 'folha_grande', 'pro_mensal')),
  variante       text NOT NULL DEFAULT 'A' CHECK (variante IN ('A', 'B')),   -- teste de preço: duas variantes por conta
  valor_centavos util.centavos NOT NULL,
  moeda          util.moeda NOT NULL DEFAULT 'BRL',
  vigencia       tstzrange NOT NULL DEFAULT tstzrange(now(), NULL),
  criado_por     uuid REFERENCES identidade.usuarios (id) ON DELETE SET NULL,
  CONSTRAINT precos_sem_sobreposicao EXCLUDE USING gist (produto WITH =, variante WITH =, vigencia WITH &&)
);

CREATE TABLE comercial.variantes_conta (
  usuario_id   uuid PRIMARY KEY REFERENCES identidade.usuarios (id) ON DELETE CASCADE,
  variante     text NOT NULL CHECK (variante IN ('A', 'B')),
  atribuida_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE comercial.assinaturas (
  id                     uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  usuario_id             uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE RESTRICT,
  preco_id               uuid NOT NULL REFERENCES comercial.precos (id),
  provedor               text NOT NULL CHECK (provedor IN ('mercadopago', 'stripe')),
  provedor_assinatura_id text NOT NULL,
  situacao               text NOT NULL CHECK (situacao IN ('ativa', 'cancelada_no_fim', 'encerrada', 'inadimplente')),
  periodo_inicio         timestamptz NOT NULL,
  periodo_fim            timestamptz NOT NULL CHECK (periodo_fim > periodo_inicio),
  cancelada_em           timestamptz,
  assinatura_desligada   boolean NOT NULL DEFAULT false,   -- benefício do Pro: exportar sem a assinatura PolarLife (BR-05)
  criada_em              timestamptz NOT NULL DEFAULT now(),
  atualizado_em          timestamptz NOT NULL DEFAULT now(),   -- mesmo nome em toda tabela: o gatilho util.tocar_atualizado_em grava nele
  UNIQUE (provedor, provedor_assinatura_id),
  CHECK ((situacao = 'cancelada_no_fim') <= (cancelada_em IS NOT NULL))
);
CREATE UNIQUE INDEX assinaturas_uma_viva_uk ON comercial.assinaturas (usuario_id) WHERE situacao IN ('ativa', 'cancelada_no_fim', 'inadimplente');
CREATE TRIGGER assinaturas_atualizada BEFORE UPDATE ON comercial.assinaturas FOR EACH ROW EXECUTE FUNCTION util.tocar_atualizado_em();

CREATE TABLE comercial.checkouts (                -- sessão do checkout hospedado pelo provedor (DOC-03 §8 d)
  id                 uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  usuario_id         uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE RESTRICT,
  tipo               text NOT NULL CHECK (tipo IN ('folhas', 'pro')),
  classe             text CHECK (classe IN ('padrao', 'grande')),
  quantidade         integer NOT NULL DEFAULT 1 CHECK (quantidade BETWEEN 1 AND 1000),
  metodo             text NOT NULL CHECK (metodo IN ('cartao', 'pix', 'boleto')),
  preco_id           uuid NOT NULL REFERENCES comercial.precos (id),
  valor_centavos     util.centavos NOT NULL,       -- o total cobrado, congelado na hora da compra
  moeda              util.moeda NOT NULL DEFAULT 'BRL',
  provedor           text NOT NULL CHECK (provedor IN ('mercadopago', 'stripe')),
  provedor_sessao_id text UNIQUE,
  situacao           text NOT NULL DEFAULT 'pendente' CHECK (situacao IN ('pendente', 'confirmado', 'recusado', 'expirado')),
  criado_em          timestamptz NOT NULL DEFAULT now(),
  expira_em          timestamptz NOT NULL DEFAULT (now() + interval '3 days'),   -- boleto vence em até 3 dias
  confirmado_em      timestamptz,
  CHECK ((tipo = 'folhas') = (classe IS NOT NULL)),
  CHECK ((situacao = 'confirmado') = (confirmado_em IS NOT NULL))
);
CREATE INDEX checkouts_usuario_ix ON comercial.checkouts (usuario_id, criado_em DESC);

CREATE TABLE comercial.eventos_pagamento (        -- webhook: idempotente por (provedor, id do evento); crédito só após confirmação
  id                 uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  provedor           text NOT NULL CHECK (provedor IN ('mercadopago', 'stripe')),
  provedor_evento_id text NOT NULL CHECK (char_length(provedor_evento_id) BETWEEN 1 AND 200),
  tipo               text NOT NULL CHECK (tipo IN ('payment.confirmed', 'payment.pending', 'payment.refused', 'payment.refunded', 'subscription.renewed', 'subscription.canceled')),
  assinatura_valida  boolean NOT NULL,             -- a API confere a assinatura do webhook antes de gravar
  checkout_id        uuid REFERENCES comercial.checkouts (id),
  valor_centavos     util.centavos,
  recebido_em        timestamptz NOT NULL DEFAULT now(),
  processado_em      timestamptz,
  resultado          text CHECK (resultado IS NULL OR char_length(resultado) <= 120),
  UNIQUE (provedor, provedor_evento_id)
);

CREATE TABLE comercial.pagamentos (               -- registro financeiro: guarda fiscal de 5 anos, mesmo após a exclusão da conta
  id                    uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  checkout_id           uuid NOT NULL UNIQUE REFERENCES comercial.checkouts (id),
  usuario_id            uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE RESTRICT,
  provedor              text NOT NULL CHECK (provedor IN ('mercadopago', 'stripe')),
  provedor_pagamento_id text NOT NULL,
  metodo                text NOT NULL CHECK (metodo IN ('cartao', 'pix', 'boleto')),
  valor_centavos        util.centavos NOT NULL,
  moeda                 util.moeda NOT NULL DEFAULT 'BRL',
  confirmado_em         timestamptz NOT NULL,
  estornado_em          timestamptz,
  UNIQUE (provedor, provedor_pagamento_id)
);
CREATE INDEX pagamentos_usuario_ix ON comercial.pagamentos (usuario_id);

CREATE SEQUENCE comercial.recibos_numero_seq;
CREATE TABLE comercial.recibos (
  id              uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  numero          text NOT NULL UNIQUE DEFAULT ('PL-' || to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY') || '-' || lpad(nextval('comercial.recibos_numero_seq')::text, 6, '0')),
  pagamento_id    uuid NOT NULL UNIQUE REFERENCES comercial.pagamentos (id),
  usuario_id      uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE RESTRICT,
  descricao       text NOT NULL CHECK (char_length(descricao) BETWEEN 2 AND 120),
  valor_centavos  util.centavos NOT NULL,
  moeda           util.moeda NOT NULL DEFAULT 'BRL',
  emitido_em      timestamptz NOT NULL DEFAULT now(),
  nota_fiscal_ref text CHECK (nota_fiscal_ref IS NULL OR char_length(nota_fiscal_ref) <= 300)
);
CREATE INDEX recibos_usuario_ix ON comercial.recibos (usuario_id, emitido_em DESC);

-- folhas: saldo por classe + livro-razão só de inclusão (todo crédito e débito, com chave de idempotência)
CREATE TABLE comercial.saldos_folhas (
  usuario_id    uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE RESTRICT,
  classe        text NOT NULL CHECK (classe IN ('padrao', 'grande')),
  saldo         integer NOT NULL DEFAULT 0 CHECK (saldo >= 0),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, classe)
);
CREATE TABLE comercial.movimentos_folhas (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE RESTRICT,
  classe     text NOT NULL CHECK (classe IN ('padrao', 'grande')),
  quantidade integer NOT NULL CHECK (quantidade <> 0),
  tipo       text NOT NULL CHECK (tipo IN ('compra', 'codigo', 'devolucao', 'consumo', 'estorno', 'ajuste', 'exclusao_conta')),   -- estorno: tira as folhas de um pagamento devolvido
  origem_id  uuid,                                  -- checkout, código ou consumo que gerou o movimento
  chave      text NOT NULL UNIQUE CHECK (char_length(chave) BETWEEN 8 AND 200),
  feito_por  uuid REFERENCES identidade.usuarios (id) ON DELETE SET NULL,   -- ajuste manual: quem fez
  criado_em  timestamptz NOT NULL DEFAULT now(),
  CHECK (tipo = 'ajuste' OR (tipo IN ('compra', 'codigo', 'devolucao')) = (quantidade > 0))
);
CREATE INDEX movimentos_usuario_ix ON comercial.movimentos_folhas (usuario_id, criado_em DESC);

CREATE TABLE comercial.consumos (                 -- cada exportação contada (DOC-03 §3): a mesma folha em 24 h conta uma vez
  id            uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  usuario_id    uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE RESTRICT,
  folha_hash    util.hash256 NOT NULL,             -- resumo da lista de desenho; nunca o conteúdo (DOC-12 §6.4)
  classe        text NOT NULL CHECK (classe IN ('padrao', 'grande')),
  quantidade    integer NOT NULL CHECK (quantidade BETWEEN 1 AND 1000),
  fonte         text NOT NULL CHECK (fonte IN ('gratis_mes', 'credito', 'pro', 'repeticao_24h')),
  mes           date NOT NULL DEFAULT util.mes_brasilia(now()),
  solicitado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX consumos_hash_ix ON comercial.consumos (usuario_id, folha_hash, solicitado_em DESC);
CREATE INDEX consumos_mes_ix ON comercial.consumos (usuario_id, mes, fonte);

-- códigos de impressão (D-124): gerados pelo admin; o código em texto só aparece uma vez, na geração
CREATE TABLE comercial.lotes_codigos (
  id         uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  pacote     text NOT NULL CHECK (char_length(pacote) BETWEEN 2 AND 60),
  folhas     integer NOT NULL CHECK (folhas BETWEEN 1 AND 1000),
  classe     text NOT NULL DEFAULT 'padrao' CHECK (classe IN ('padrao', 'grande')),
  fotos_max  integer CHECK (fotos_max IS NULL OR fotos_max BETWEEN 1 AND 400),
  quantidade integer NOT NULL CHECK (quantidade BETWEEN 1 AND 10000),
  valido_ate timestamptz,
  criado_por uuid REFERENCES identidade.usuarios (id) ON DELETE SET NULL,
  criado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE comercial.codigos_impressao (
  id          uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  lote_id     uuid NOT NULL REFERENCES comercial.lotes_codigos (id) ON DELETE RESTRICT,
  codigo_hmac util.hash256 NOT NULL UNIQUE,       -- HMAC-SHA-256 com a chave do servidor (fora do banco)
  final       char(4) NOT NULL CHECK (final ~ '^[A-Z0-9]{4}$'),   -- 4 últimos caracteres, para o suporte reconhecer
  situacao    text NOT NULL DEFAULT 'ativo' CHECK (situacao IN ('ativo', 'usado', 'revogado')),
  usado_em    timestamptz,
  usado_por   uuid REFERENCES identidade.usuarios (id) ON DELETE SET NULL,
  revogado_em timestamptz,
  CHECK ((situacao = 'usado') = (usado_em IS NOT NULL)),
  CHECK ((situacao = 'revogado') = (revogado_em IS NOT NULL))
);
CREATE INDEX codigos_lote_ix ON comercial.codigos_impressao (lote_id);

-- chaves de funcionalidade e parâmetros, avaliados no servidor (DOC-12 §6.3: nada de SDK de terceiro no cliente)
CREATE TABLE config.chaves (
  chave          text PRIMARY KEY CHECK (chave ~ '^[a-z][a-z0-9_.-]{1,62}$'),
  ligada         boolean NOT NULL DEFAULT false,
  descricao      text NOT NULL,
  atualizada_em  timestamptz NOT NULL DEFAULT now(),
  atualizada_por uuid REFERENCES identidade.usuarios (id) ON DELETE SET NULL
);
CREATE TABLE config.parametros (
  chave         text PRIMARY KEY CHECK (chave ~ '^[a-z][a-z0-9_.-]{1,62}$'),
  valor         jsonb NOT NULL,
  descricao     text NOT NULL,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
