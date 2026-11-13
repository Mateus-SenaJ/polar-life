# Banco de dados do PolarLife (PostgreSQL)

Fundação do banco para quando o PolarLife tiver servidor (API). **Hoje o site não usa banco**: ele roda no aparelho
(local-first, T5) e as contas são de demonstração. A decisão, o inventário de dados e as regras de governança estão no
[DOC-15](../docs/15_DADOS_E_POSTGRESQL.md). Este arquivo é o manual de operação.

> Regra de ouro: este banco **nunca** guarda foto, miniatura, legenda, ajuste, coordenada nem EXIF. Só conta, plano,
> folhas (créditos), pagamentos, recibos, aceites, pedidos do titular e trilhas exigidas por lei.

## Requisitos

- PostgreSQL **16 ou mais novo**; **18 recomendado** (UUIDv7 nativo, `uuidv7()`; as migrações têm alternativa para 16 e 17).
- Extensão `btree_gist` (vem no pacote `contrib`, disponível no Cloud SQL, RDS, Azure e Supabase).
- Fuso do servidor em UTC (padrão dos provedores). O mês da folha grátis é calculado no fuso de Brasília pela função
  `util.mes_brasilia()`, nunca pelo fuso da sessão.

## Estrutura

| Pasta | O que tem |
| --- | --- |
| `migracoes/` | Esquema em ordem: `0001_fundacao` … `0008_manutencao`. Nunca se edita uma migração aplicada: muda-se com um arquivo novo. |
| `sementes/` | Dados de partida idempotentes (planos, limites, preços, parâmetros, chaves). Pode rodar de novo. |

| Migração | Conteúdo |
| --- | --- |
| 0001 fundação | Esquemas por assunto, papéis de grupo, `public` fechado, UUIDv7, tipos com regra (e-mail, centavos, moeda, hash) |
| 0002 identidade | Contas, senha (só hash Argon2id), Google/Apple (só o `sub`), sessões (só o SHA-256 do token), códigos por e-mail, papéis, passkeys, trava de força bruta |
| 0003 privacidade | Versões dos documentos legais, aceites, pedidos do titular (prazo de 15 dias), exportação dos dados |
| 0004 comercial | Planos e limites com vigência, preços versionados, checkout, eventos de pagamento (idempotentes), pagamentos, recibos, saldo e livro-razão de folhas, consumos (regra das 24 h), códigos de impressão (só o HMAC), chaves e parâmetros |
| 0005 auditoria | Trilha de auditoria e registros de acesso (Marco Civil), particionadas por mês, só de inclusão, com segredos e dados pessoais ocultos |
| 0006 regras | Funções de negócio (`SECURITY DEFINER`, `search_path` fixo) e erros com código próprio (`PL001`…`PL005`) |
| 0007 acesso | RLS em toda tabela com dado de pessoa, permissões por coluna, `EXECUTE` só no que cada papel usa, visões de análise sem dado pessoal |
| 0008 manutenção | Partições do mês, retenção por prazo e limpeza de itens vencidos |

## Aplicar

Sempre como o papel dono (`pl_dono`), arquivo por arquivo, em ordem, cada um numa transação e parando no primeiro erro:

```sh
for f in db/migracoes/*.sql; do
  psql "$PL_DB_DONO" -v ON_ERROR_STOP=1 --single-transaction -f "$f" || exit 1
  # registra a versão e o SHA-256 do arquivo (o aplicador recusa um arquivo já aplicado com conteúdo diferente)
done
psql "$PL_DB_DONO" -v ON_ERROR_STOP=1 --single-transaction -f db/sementes/0001_planos_precos.sql
```

O teste `tests/unit/testar-banco.mjs` faz exatamente isso num agrupamento descartável e serve de aplicador de referência:
ele grava `versao`, `nome` e `sha256` em `util.migracoes` e recusa reaplicar um arquivo alterado.

```sh
node tests/unit/testar-banco.mjs                     # usa o PostgreSQL instalado (ou PL_PG_BIN=/caminho/bin)
```

Sem PostgreSQL 16+ na máquina, o teste avisa e pula (não falha). Ele nunca toca num serviço que já esteja rodando: cria
um agrupamento temporário, ouvindo só em `127.0.0.1` numa porta livre, e apaga tudo no fim.

## Papéis por ambiente

As migrações criam só **papéis de grupo, sem login**. Cada ambiente cria os seus papéis de login, um por serviço, membro
de um grupo só:

```sql
-- senha forte gerada pelo cofre de segredos; o servidor guarda só o verificador SCRAM
SET password_encryption = 'scram-sha-256';
CREATE ROLE pl_api      LOGIN IN ROLE pl_app        PASSWORD :'senha_api'      CONNECTION LIMIT 40;
CREATE ROLE pl_painel   LOGIN IN ROLE pl_admin      PASSWORD :'senha_painel'   CONNECTION LIMIT 5;
CREATE ROLE pl_rotinas  LOGIN IN ROLE pl_manutencao PASSWORD :'senha_rotinas'  CONNECTION LIMIT 2;
CREATE ROLE pl_seguranca LOGIN IN ROLE pl_auditor   PASSWORD :'senha_auditor'  CONNECTION LIMIT 2;
CREATE ROLE pl_bi       LOGIN IN ROLE pl_analitica  PASSWORD :'senha_bi'       CONNECTION LIMIT 2;
ALTER ROLE pl_api SET statement_timeout = '5s';
ALTER ROLE pl_api SET idle_in_transaction_session_timeout = '10s';
```

- No **Cloud SQL**, prefira a autenticação IAM (sem senha) para a API e as rotinas: o papel de login é a conta de serviço,
  e ele recebe `GRANT pl_app TO "api@projeto.iam"`.
- `pl_dono` só aplica migrações. Nenhum serviço conecta como `pl_dono` nem como superusuário.
- Ninguém recebe `BYPASSRLS`.

## Como a API conversa com o banco

Cada requisição é uma transação que diz quem está agindo. Com `SET LOCAL`, o valor some no fim da transação, então o
pool de conexões em modo transação (PgBouncer, Cloud SQL Auth Proxy) é seguro:

```sql
BEGIN;
SET LOCAL app.usuario_id    = '0190f3a2-…';     -- conta da sessão (identidade.sessao_valida)
SET LOCAL app.papel         = 'app';            -- vai para a trilha de auditoria
SET LOCAL app.requisicao_id = '0190f3a2-…';     -- liga a trilha ao log da API
SELECT comercial.consumir_folhas($1, $2, $3, $4);
COMMIT;
```

- Leitura das próprias linhas: RLS. Escrita: quase sempre por função, que confere o dono (`PL004` se não for).
- Erros que a API traduz para a tela: `PL001` sem folhas · `PL002` código não encontrado · `PL003` código usado, revogado
  ou vencido · `PL004` acesso negado · `PL005` conta já existe.
- Segredos que **nunca** entram no banco: a senha (a API faz o hash Argon2id), o token de sessão (só o SHA-256), o
  código de impressão e o código por e-mail (só o HMAC-SHA-256), e as chaves desses HMACs (ficam no cofre de segredos).

## Rotinas agendadas (papel `pl_manutencao`)

| Quando | Chamada | Para quê |
| --- | --- | --- |
| Dia 1 de cada mês, 00:05 UTC | `SELECT auditoria.criar_particoes(3);` | Partições do mês corrente e dos 3 seguintes |
| Todo dia, 03:00 UTC | `SELECT auditoria.descartar_antigas();` | Registros de acesso: 6 meses (nunca menos); trilha: 5 anos |
| A cada hora | `SELECT auditoria.limpar_expirados();` | Sessões, códigos por e-mail, tentativas, exportações e checkouts vencidos |

Use `pg_cron` quando o provedor oferecer (Cloud SQL e RDS oferecem) ou um job agendado da própria API. Os prazos ficam em
`config.parametros`: mudar um prazo é mudar um dado (fica na trilha), não o código.

## Rede, criptografia e cópias

- **TLS obrigatório**: só conexões `hostssl` no `pg_hba` (ou `ssl_mode = ENCRYPTED_ONLY` no Cloud SQL) e `sslmode=verify-full`
  no cliente. Sem IP público: rede privada (VPC) ou Cloud SQL Auth Proxy.
- **Em repouso**: criptografia do provedor (padrão); chave gerenciada pelo cliente (CMEK) quando o volume justificar.
- **Cópias**: backup automático diário com retenção de 7 dias e **recuperação a um instante (PITR)** ligada. Testar a
  restauração a cada trimestre num projeto separado; uma cópia que nunca foi restaurada não conta.
- **Região**: `southamerica-east1` (São Paulo). Dados no Brasil evitam transferência internacional (DOC-15 §6).
- **Atualizações**: versão menor em janela de manutenção; versão maior com `pg_upgrade` testado antes num clone.

## Mudar o esquema

1. Arquivo novo em `migracoes/` com o próximo número (`0009_….sql`), comentado com a decisão (`D-xxx`).
2. Mudanças que não travam a tabela: coluna nova anulável ou com padrão constante, índice com `CONCURRENTLY` (fora da
   transação), restrição `NOT VALID` seguida de `VALIDATE CONSTRAINT`.
3. Dado pessoal novo só entra com finalidade, base legal e prazo no inventário do DOC-15 §2.
4. `node tests/unit/testar-banco.mjs` tem de passar.
