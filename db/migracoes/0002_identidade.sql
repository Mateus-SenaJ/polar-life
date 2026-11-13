-- PolarLife · banco de dados · 0002 · identidade (D-206)
-- Conta = e-mail e nome. Senha só como hash Argon2id feito pela API (o banco nunca vê a senha). Login com Google/Apple
-- guarda só o «sub» do provedor (nenhum token). Sessão: token opaco no cookie HttpOnly; aqui só o SHA-256 dele.

CREATE TABLE identidade.usuarios (
  id                  uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  email               util.email,                                     -- nulo só depois da exclusão (pseudonimização)
  email_verificado_em timestamptz,
  nome                text CHECK (nome IS NULL OR char_length(btrim(nome)) BETWEEN 2 AND 60),
  situacao            text NOT NULL DEFAULT 'ativa' CHECK (situacao IN ('ativa', 'bloqueada', 'excluida')),
  criado_em           timestamptz NOT NULL DEFAULT now(),
  atualizado_em       timestamptz NOT NULL DEFAULT now(),
  excluido_em         timestamptz,
  CONSTRAINT usuarios_email_so_excluida CHECK ((situacao = 'excluida') = (email IS NULL)),
  CONSTRAINT usuarios_data_exclusao CHECK ((situacao = 'excluida') = (excluido_em IS NOT NULL))
);
CREATE UNIQUE INDEX usuarios_email_uk ON identidade.usuarios (email) WHERE email IS NOT NULL;
CREATE TRIGGER usuarios_atualizado BEFORE UPDATE ON identidade.usuarios FOR EACH ROW EXECUTE FUNCTION util.tocar_atualizado_em();
COMMENT ON TABLE identidade.usuarios IS
  'Conta. Dado pessoal: e-mail e nome (LGPD art. 7º V, execução de contrato). Na exclusão vira pseudônimo: e-mail e nome somem; o id fica só para ligar recibos fiscais.';

CREATE TABLE identidade.credenciais_senha (
  usuario_id      uuid PRIMARY KEY REFERENCES identidade.usuarios (id) ON DELETE CASCADE,
  hash            text NOT NULL CHECK (hash ~ '^[$](argon2id|pbkdf2-sha256)[$]'),   -- formato PHC; PBKDF2 só para migrar o legado
  precisa_refazer boolean NOT NULL DEFAULT false,                                 -- refaz em Argon2id no próximo login
  atualizado_em   timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE identidade.credenciais_senha IS 'Segredo. Só a API lê, por função (identidade.conta_por_email). Argon2id: m ≥ 19 MiB, t ≥ 2, p = 1 (OWASP).';

CREATE TABLE identidade.identidades_externas (
  id            uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  usuario_id    uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE CASCADE,
  provedor      text NOT NULL CHECK (provedor IN ('google', 'apple')),
  sujeito       text NOT NULL CHECK (char_length(sujeito) BETWEEN 1 AND 255),   -- «sub» do OIDC; nenhum token do provedor
  criado_em     timestamptz NOT NULL DEFAULT now(),
  ultimo_uso_em timestamptz,
  UNIQUE (provedor, sujeito)
);
CREATE INDEX identidades_usuario_ix ON identidade.identidades_externas (usuario_id);

CREATE TABLE identidade.sessoes (
  id            uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  usuario_id    uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE CASCADE,
  token_hash    util.hash256 NOT NULL UNIQUE,     -- SHA-256 do token de 256 bits; o token nunca fica no banco
  criada_em     timestamptz NOT NULL DEFAULT now(),
  expira_em     timestamptz NOT NULL,
  ultimo_uso_em timestamptz NOT NULL DEFAULT now(),
  revogada_em   timestamptz,
  aparelho      text CHECK (aparelho IS NULL OR char_length(aparelho) <= 80),   -- resumo legível («Chrome · Android»)
  CHECK (expira_em > criada_em AND expira_em <= criada_em + interval '90 days')
);
CREATE INDEX sessoes_usuario_ix ON identidade.sessoes (usuario_id);
CREATE INDEX sessoes_expira_ix ON identidade.sessoes (expira_em);

CREATE TABLE identidade.codigos_verificacao (     -- código de 6 dígitos por e-mail: entrar, confirmar e-mail, nova senha
  id          uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  email       util.email NOT NULL,
  finalidade  text NOT NULL CHECK (finalidade IN ('entrar', 'confirmar_email', 'nova_senha')),
  codigo_hash util.hash256 NOT NULL,              -- HMAC-SHA-256 (chave do servidor, fora do banco) de e-mail + finalidade + código
  tentativas  smallint NOT NULL DEFAULT 0 CHECK (tentativas BETWEEN 0 AND 5),
  criado_em   timestamptz NOT NULL DEFAULT now(),
  expira_em   timestamptz NOT NULL,
  usado_em    timestamptz,
  CHECK (expira_em > criado_em AND expira_em <= criado_em + interval '15 minutes')
);
CREATE INDEX codigos_email_ix ON identidade.codigos_verificacao (email, finalidade) WHERE usado_em IS NULL;

CREATE TABLE identidade.papeis (
  usuario_id    uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE CASCADE,
  papel         text NOT NULL CHECK (papel IN ('admin', 'suporte')),
  concedido_por uuid REFERENCES identidade.usuarios (id) ON DELETE SET NULL,
  concedido_em  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, papel)
);

CREATE TABLE identidade.chaves_acesso (           -- passkeys (WebAuthn): obrigatórias para o papel admin (MFA resistente a phishing)
  id            uuid PRIMARY KEY DEFAULT util.uuid_v7(),
  usuario_id    uuid NOT NULL REFERENCES identidade.usuarios (id) ON DELETE CASCADE,
  credencial_id bytea NOT NULL UNIQUE CHECK (octet_length(credencial_id) BETWEEN 16 AND 1023),
  chave_publica bytea NOT NULL CHECK (octet_length(chave_publica) BETWEEN 32 AND 2048),   -- COSE
  contador      bigint NOT NULL DEFAULT 0 CHECK (contador >= 0),
  apelido       text CHECK (apelido IS NULL OR char_length(apelido) <= 60),
  criada_em     timestamptz NOT NULL DEFAULT now(),
  ultimo_uso_em timestamptz
);
CREATE INDEX chaves_usuario_ix ON identidade.chaves_acesso (usuario_id);

CREATE TABLE identidade.tentativas_entrada (      -- trava de força bruta (5 erros em 15 min), sem e-mail nem IP em claro
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chave_hash  util.hash256 NOT NULL,              -- HMAC do e-mail normalizado ou do IP (chave do servidor)
  tipo        text NOT NULL CHECK (tipo IN ('email', 'ip')),
  sucesso     boolean NOT NULL,
  ocorrida_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tentativas_chave_ix ON identidade.tentativas_entrada (chave_hash, ocorrida_em DESC);
