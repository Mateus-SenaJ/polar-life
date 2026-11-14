// D-206 · Banco de dados (PostgreSQL): aplica as migrações num banco descartável e confere as regras.
// Usa o PostgreSQL da máquina (PL_PG_BIN, ou o instalado em «C:\Program Files\PostgreSQL\<versão>\bin» ou em
// /usr/lib/postgresql/<versão>/bin). Cria um agrupamento temporário, ouvindo só em 127.0.0.1 numa porta livre, e apaga no fim.
// Sem PostgreSQL 16+ na máquina, avisa e pula (não falha). Nenhum dado real: contas e valores inventados.
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
let falhas = 0;
const ok = (v, m) => { console.log((v ? '✔ ' : '✘ ') + m); if (!v) falhas++; };
const exe = (n) => (process.platform === 'win32' ? n + '.exe' : n);

function acharBin() {
  const cands = [];
  if (process.env.PL_PG_BIN) cands.push(process.env.PL_PG_BIN);
  for (const base of ['C:\\Program Files\\PostgreSQL', '/usr/lib/postgresql']) {
    try { readdirSync(base).filter((v) => /^\d+$/.test(v)).sort((a, b) => b - a).forEach((v) => cands.push(join(base, v, 'bin'))); } catch {}
  }
  for (const c of cands) if (existsSync(join(c, exe('initdb'))) && existsSync(join(c, exe('psql')))) return c;
  return null;
}
const BIN = acharBin();
if (!BIN) { console.log('– PostgreSQL não encontrado nesta máquina: conferência do banco pulada (defina PL_PG_BIN)'); process.exit(0); }
const versao = +((spawnSync(join(BIN, exe('postgres')), ['--version'], { encoding: 'utf8' }).stdout || '').match(/(\d+)\.\d+/) || [])[1];
if (!(versao >= 16)) { console.log('– PostgreSQL ' + versao + ' encontrado; o banco pede 16 ou mais novo: conferência pulada'); process.exit(0); }

const porta = await new Promise((ok) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); });
const DIR = mkdtempSync(join(tmpdir(), 'polarlife-banco-')), DADOS = join(DIR, 'dados');
const roda = (b, args, o) => spawnSync(join(BIN, exe(b)), args, Object.assign({ encoding: 'utf8' }, o || {}));
function psql(texto, { como = 'pl_dono', banco = 'polarlife' } = {}) {
  const f = join(DIR, 'q-' + randomBytes(4).toString('hex') + '.sql');
  writeFileSync(f, '\\set VERBOSITY verbose\n' + texto);
  const r = roda('psql', ['-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', '-h', '127.0.0.1', '-p', String(porta), '-U', como, '-d', banco, '-f', f]);
  const nl = (t) => (t || '').replace(/\r\n/g, '\n').trim();   // o psql do Windows responde com \r\n
  return { ok: r.status === 0, out: nl(r.stdout), err: nl(r.stderr) };
}
const um = (texto, o) => { const r = psql(texto, o); if (!r.ok) throw new Error(r.err.split('\n')[0]); return r.out; };
const js = (r) => { if (!r.ok) throw new Error(r.err.split('\n').slice(0, 2).join(' | ')); return JSON.parse(r.out.split('\n').pop()); };
/* como a API: papel pl_app e a pessoa da sessão (SET LOCAL vale só na transação) */
const comoApp = (usuario, corpo, papel = 'pl_app') => psql(`BEGIN;\nSET LOCAL ROLE ${papel};\n${usuario ? `SET LOCAL app.usuario_id = '${usuario}';\n` : ''}${corpo}\nCOMMIT;`, { como: 'postgres' });
const h32 = (s) => '\\x' + createHash('sha256').update(s).digest('hex');

// no Linux o socket padrão (/var/run/postgresql) é do usuário postgres: o agrupamento descartável usa a própria pasta
const SOCK = process.platform === 'win32' ? '' : ' -c unix_socket_directories=' + DIR;
let ligado = false;
try {
  const ini = roda('initdb', ['-D', DADOS, '-U', 'postgres', '-A', 'trust', '-E', 'UTF8', '--no-locale']);
  if (ini.status !== 0) throw new Error('initdb: ' + ini.stderr);
  // o servidor herda as saídas do pg_ctl: com pipes, o spawnSync esperaria o servidor terminar (no Windows travava). O log vai para log.txt
  const sobe = roda('pg_ctl', ['-D', DADOS, '-l', join(DIR, 'log.txt'), '-w', '-o', `-p ${porta} -c listen_addresses=127.0.0.1${SOCK}`, 'start'], { stdio: 'ignore', timeout: 90000 });
  ligado = existsSync(join(DADOS, 'postmaster.pid'));   // se subiu mesmo com erro ou tempo esgotado, o finally desliga
  if (sobe.status !== 0) throw new Error('pg_ctl start (' + sobe.status + '): ' + (existsSync(join(DIR, 'log.txt')) ? readFileSync(join(DIR, 'log.txt'), 'utf8').slice(-600) : 'sem log'));
  ligado = true;
  um('CREATE ROLE pl_dono LOGIN CREATEROLE;\nCREATE DATABASE polarlife OWNER pl_dono;', { como: 'postgres', banco: 'postgres' });

  console.log(`Migrações (PostgreSQL ${versao}):`);
  const pasta = join(RAIZ, 'db', 'migracoes'), arqs = readdirSync(pasta).filter((f) => /^\d{4}_.+\.sql$/.test(f)).sort();
  function aplicar() {
    let n = 0;
    const feitas = new Map((psql('SELECT versao || \'|\' || sha256 FROM util.migracoes').out || '').split('\n').filter(Boolean).map((l) => l.split('|')).map(([v, s]) => [+v, s]));
    for (const a of arqs) {
      const v = +a.slice(0, 4), sql = readFileSync(join(pasta, a), 'utf8'), sha = createHash('sha256').update(sql).digest('hex');
      if (feitas.has(v)) { if (feitas.get(v) !== sha) throw new Error('migração ' + a + ' mudou depois de aplicada'); continue; }
      const r = psql(`BEGIN;\n${sql}\nINSERT INTO util.migracoes (versao, nome, sha256) VALUES (${v}, '${a}', '${sha}');\nCOMMIT;`);
      if (!r.ok) throw new Error(a + ': ' + r.err.split('\n').slice(0, 3).join(' | '));
      n++;
    }
    return n;
  }
  const n1 = aplicar(), n2 = aplicar();
  ok(n1 === arqs.length && n2 === 0, `${arqs.length} migrações aplicadas, cada uma numa transação, com SHA-256 registrado; de novo, nenhuma reaplicada`);
  const semente = psql(readFileSync(join(RAIZ, 'db', 'sementes', '0001_planos_precos.sql'), 'utf8'));
  const semente2 = psql(readFileSync(join(RAIZ, 'db', 'sementes', '0001_planos_precos.sql'), 'utf8'));
  ok(semente.ok && semente2.ok && um('SELECT count(*) FROM comercial.limites_plano') === '3' && um('SELECT count(*) FROM comercial.precos') === '3', 'semente: 3 planos, 3 limites e 3 preços (rodar de novo não duplica)');

  console.log('Governança do esquema:');
  const proibidas = um(`SELECT coalesce(string_agg(table_schema || '.' || table_name || '.' || column_name, ', '), '') FROM information_schema.columns
    WHERE table_schema IN ('util','identidade','privacidade','comercial','config','auditoria','analise','avisos')
    AND column_name ~* '(foto|miniatura|imagem|legenda|exif|gps|latitude|longitude|coordenada|thumb|caption)'
    AND data_type NOT IN ('integer', 'smallint', 'bigint', 'boolean')`);   /* contagem de fotos por projeto não é foto */
  ok(proibidas === '', 'regra de ouro (BR-01): nenhuma coluna para foto, miniatura, legenda, EXIF ou coordenada' + (proibidas ? ': ' + proibidas : ''));
  const segredos = um(`SELECT coalesce(string_agg(table_schema || '.' || table_name || '.' || column_name, ', '), '') FROM information_schema.columns
    WHERE table_schema IN ('identidade','privacidade','comercial','config') AND column_name ~* '^(senha|password|token|segredo|secret|codigo)$' AND table_name <> 'planos'`);
  ok(segredos === '', 'nenhum segredo em texto: senha, token e código só como hash/HMAC' + (segredos ? ': ' + segredos : ''));
  const semRls = um(`SELECT coalesce(string_agg(c.relnamespace::regnamespace || '.' || c.relname, ', '), '') FROM pg_class c
    WHERE c.relkind = 'r' AND c.relnamespace::regnamespace::text IN ('identidade','privacidade','comercial','avisos') AND NOT c.relrowsecurity
    AND EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid = c.oid AND a.attname = 'usuario_id' AND NOT a.attisdropped)`);
  ok(semRls === '', 'toda tabela com dado de pessoa tem RLS ligada' + (semRls ? ': ' + semRls : ''));
  const semPath = um(`SELECT coalesce(string_agg(p.oid::regprocedure::text, ', '), '') FROM pg_proc p WHERE p.prosecdef
    AND p.pronamespace::regnamespace::text IN ('util','identidade','privacidade','comercial','auditoria','avisos') AND NOT coalesce(p.proconfig::text ~ 'search_path=', false)`);
  ok(semPath === '', 'toda função SECURITY DEFINER tem search_path fixo' + (semPath ? ': ' + semPath : ''));
  const publico = um(`SELECT count(*) FROM pg_proc p WHERE p.pronamespace::regnamespace::text IN ('util','identidade','privacidade','comercial','auditoria','avisos') AND has_function_privilege('public', p.oid, 'EXECUTE')`);
  ok(publico === '0', 'nenhuma função executável por qualquer papel (PUBLIC)');
  ok(!psql(`INSERT INTO identidade.usuarios (email, nome) VALUES ('Maiuscula@Exemplo.com', 'Ana')`).ok, 'e-mail fora do padrão (maiúsculas) é recusado pelo tipo util.email');

  console.log('Entrar (provedor, código por e-mail, força bruta, senha):');
  const G = um(`SELECT identidade.entrar_com_provedor('google', 'sub-gabi', 'Gabi@Exemplo.com', true, 'Gabi')`);
  ok(um(`SELECT identidade.entrar_com_provedor('google', 'sub-gabi', 'gabi@exemplo.com', true)`) === G && um(`SELECT (email_verificado_em IS NOT NULL) || '|' || email FROM identidade.usuarios WHERE id = '${G}'`) === 'true|gabi@exemplo.com',
    'Google: a 1ª entrada cria a conta já confirmada; a 2ª acha a mesma conta pelo «sub» (nenhum token do provedor no banco)');
  ok(um(`SELECT identidade.entrar_com_provedor('apple', 'sub-gabi-apple', 'gabi@exemplo.com', true)`) === G && /PL005/.test(psql(`SELECT identidade.entrar_com_provedor('apple', 'sub-intruso', 'gabi@exemplo.com', false)`).err),
    'outro provedor com o mesmo e-mail confirmado liga à mesma conta; com e-mail não confirmado, recusa (PL005: evita tomar a conta)');
  const cod = (c) => h32('gabi@exemplo.com:entrar:' + c);
  um(`SELECT identidade.novo_codigo('gabi@exemplo.com', 'entrar', '${cod('111111')}')`);
  const k1 = um(`SELECT identidade.conferir_codigo('gabi@exemplo.com', 'entrar', '${cod('999999')}')`), k2 = um(`SELECT identidade.conferir_codigo('GABI@exemplo.com', 'entrar', '${cod('111111')}')`), k3 = um(`SELECT identidade.conferir_codigo('gabi@exemplo.com', 'entrar', '${cod('111111')}')`);
  ok(k1 === 'f' && k2 === 't' && k3 === 'f', 'código por e-mail: errado não entra; certo entra uma vez só (depois de usado não vale mais)');
  um(`SELECT identidade.novo_codigo('gabi@exemplo.com', 'entrar', '${cod('222222')}')`);
  for (let i = 0; i < 5; i++) um(`SELECT identidade.conferir_codigo('gabi@exemplo.com', 'entrar', '${cod('000000')}')`);
  ok(um(`SELECT identidade.conferir_codigo('gabi@exemplo.com', 'entrar', '${cod('222222')}')`) === 'f', 'com 5 erros o código morre: nem o certo vale mais');
  for (let i = 0; i < 3; i++) um(`SELECT identidade.novo_codigo('gabi@exemplo.com', 'entrar', '${cod('3' + i)}')`);
  ok(/PL006/.test(psql(`SELECT identidade.novo_codigo('gabi@exemplo.com', 'entrar', '${cod('4')}')`).err), 'no máximo 5 códigos por hora para o mesmo e-mail (PL006)');
  const ip = h32('ip:203.0.113.9');
  for (let i = 0; i < 5; i++) um(`SELECT identidade.registrar_tentativa('${ip}', 'ip', false)`);
  const trava = um(`SELECT identidade.entrada_travada('${ip}')`); um(`SELECT identidade.registrar_tentativa('${ip}', 'ip', true)`);
  ok(trava === 't' && um(`SELECT identidade.entrada_travada('${ip}')`) === 'f', 'força bruta: 5 erros em 15 min travam a entrada; um acerto destrava (chave em HMAC, sem IP em claro)');
  const tg1 = h32('sessao-gabi-1'), tg2 = h32('sessao-gabi-2');
  um(`SELECT identidade.criar_sessao('${G}', '${tg1}')`); um(`SELECT identidade.criar_sessao('${G}', '${tg2}')`);
  const troca = comoApp(G, `SELECT identidade.definir_senha('${G}', '$argon2id$v=19$m=19456,t=2,p=1$bm92YQ$aGFzaA', true, '${tg1}');`);
  ok(troca.ok && troca.out === '1' && um(`SELECT identidade.sessao_valida('${tg1}')`) === G && um(`SELECT identidade.sessao_valida('${tg2}') IS NULL`) === 't', 'trocar a senha encerra as outras sessões e mantém a atual');
  um(`SELECT identidade.novo_codigo('gabi@exemplo.com', 'nova_senha', '${h32('gabi@exemplo.com:nova_senha:555555')}')`);
  const red = um(`SELECT identidade.redefinir_senha('gabi@exemplo.com', '${h32('gabi@exemplo.com:nova_senha:555555')}', '$argon2id$v=19$m=19456,t=2,p=1$b3V0cmE$aGFzaA')`);
  ok(red === 't' && um(`SELECT identidade.sessao_valida('${tg1}') IS NULL`) === 't' && um(`SELECT hash ~ 'b3V0cmE' FROM identidade.credenciais_senha WHERE usuario_id = '${G}'`) === 't', '«Esqueci a senha»: com o código do e-mail grava a senha nova e encerra todas as sessões');
  ok(/PL004/.test(comoApp(G, `SELECT identidade.encerrar_sessoes('00000000-0000-7000-8000-000000000000');`).err), 'ninguém encerra as sessões de outra conta (PL004)');
  const novo = h32('gabriela@exemplo.com:confirmar_email:777777');
  um(`SELECT identidade.novo_codigo('gabriela@exemplo.com', 'confirmar_email', '${novo}')`);
  const te = comoApp(G, `SELECT identidade.trocar_email('${G}', 'gabriela@exemplo.com', '${novo}');`);
  ok(te.ok && te.out === 't' && um(`SELECT email FROM identidade.usuarios WHERE id = '${G}'`) === 'gabriela@exemplo.com', 'trocar o e-mail: só com o código mandado ao e-mail novo');

  console.log('Contas e folhas:');
  const A = um(`SELECT identidade.criar_conta('ana@exemplo.com', 'Ana', '$argon2id$v=19$m=19456,t=2,p=1$c2Fs$aGFzaA')`);
  const B = um(`SELECT identidade.criar_conta('bia@exemplo.com', 'Bia')`);
  const C = um(`SELECT identidade.criar_conta('admin@exemplo.com', 'Admin')`);
  um(`INSERT INTO identidade.papeis (usuario_id, papel) VALUES ('${C}', 'admin')`);
  ok(/PL005/.test(psql(`SELECT identidade.criar_conta('ana@exemplo.com', 'Outra')`).err), 'e-mail repetido: «conta já existe» (PL005)');
  ok(um(`SELECT usuario_id || '|' || (hash IS NOT NULL) FROM identidade.conta_por_email(' ANA@exemplo.com ')`) === A + '|true', 'conta_por_email normaliza o e-mail e devolve o hash para a API conferir (Argon2id)');
  const tok = h32('sessao-ana');
  const S = um(`SELECT identidade.criar_sessao('${A}', '${tok}', 30, 'Chrome · Android')`);
  ok(um(`SELECT identidade.sessao_valida('${tok}')`) === A && um(`SELECT identidade.encerrar_sessao('${tok}')`) === 't' && um(`SELECT identidade.sessao_valida('${tok}') IS NULL`) === 't', 'sessão: vale enquanto aberta; encerrada não vale mais (o token nunca fica no banco, só o SHA-256)');

  const consumir = (u, hash, n = 1, classe = 'padrao') => comoApp(u, `SELECT comercial.consumir_folhas('${u}', '${h32(hash)}', '${classe}', ${n});`);
  const c1 = consumir(A, 'folha-1'), c2 = consumir(A, 'folha-1'), c3 = consumir(A, 'folha-2');
  ok(c1.ok && JSON.parse(c1.out).gratis === 1, 'Grátis: a 1ª folha do mês sai da folha grátis');
  ok(c2.ok && JSON.parse(c2.out).jaContado === true, 'a mesma folha de novo em 24 h não conta outra vez (DOC-03 §3)');
  ok(!c3.ok && /PL001/.test(c3.err) && /faltam 1/.test(c3.err), 'outra folha no mesmo mês: «sem folhas» (PL001), com quantas faltam');
  ok(/PL004/.test(comoApp(B, `SELECT comercial.direito_de_uso('${A}');`).err), 'uma conta não lê o direito de uso de outra (PL004)');

  console.log('Compra, webhook e recibo:');
  const preco = um(`SELECT id FROM comercial.precos WHERE produto = 'folha_padrao' AND upper_inf(vigencia)`);
  const ck = comoApp(A, `INSERT INTO comercial.checkouts (usuario_id, tipo, classe, quantidade, metodo, preco_id, valor_centavos, provedor) VALUES ('${A}', 'folhas', 'padrao', 5, 'pix', '${preco}', 1450, 'mercadopago') RETURNING id;`);
  ok(ck.ok, 'a API abre o checkout (só para a pessoa da sessão, sempre «pendente»)');
  const CK = ck.out.split('\n').pop();
  ok(!comoApp(B, `INSERT INTO comercial.checkouts (usuario_id, tipo, classe, quantidade, metodo, preco_id, valor_centavos, provedor) VALUES ('${A}', 'folhas', 'padrao', 5, 'pix', '${preco}', 1, 'mercadopago');`).ok, 'não dá para abrir checkout em nome de outra conta (RLS)');
  const wPend = um(`SELECT comercial.registrar_evento_pagamento('mercadopago', 'ev-0', 'payment.pending', true, '${CK}', 1450)`);
  ok(um(`SELECT coalesce(sum(saldo), 0) FROM comercial.saldos_folhas WHERE usuario_id = '${A}'`) === '0' && /pendente/.test(wPend), 'pagamento pendente (Pix, boleto) não libera folha (DOC-03 §8 a)');
  const wErrado = um(`SELECT comercial.registrar_evento_pagamento('mercadopago', 'ev-1', 'payment.confirmed', true, '${CK}', 100)`);
  const wFalso = um(`SELECT comercial.registrar_evento_pagamento('mercadopago', 'ev-2', 'payment.confirmed', false, '${CK}', 1450)`);
  ok(/não confere/.test(wErrado) && /inválida/.test(wFalso) && um(`SELECT situacao FROM comercial.checkouts WHERE id = '${CK}'`) === 'pendente', 'valor diferente do checkout ou assinatura do webhook inválida: ignorado');
  const w1 = JSON.parse(um(`SELECT comercial.registrar_evento_pagamento('mercadopago', 'ev-3', 'payment.confirmed', true, '${CK}', 1450, 'pg-123')`));
  const w2 = JSON.parse(um(`SELECT comercial.registrar_evento_pagamento('mercadopago', 'ev-3', 'payment.confirmed', true, '${CK}', 1450, 'pg-123')`));
  ok(/^PL-\d{4}-\d{6}$/.test(w1.recibo) && w2.duplicado === true && um(`SELECT saldo FROM comercial.saldos_folhas WHERE usuario_id = '${A}' AND classe = 'padrao'`) === '5', 'confirmado: 5 folhas e recibo ' + w1.recibo + '; o mesmo evento de novo não credita outra vez (idempotente)');
  const c4 = consumir(A, 'folha-2', 2);
  ok(c4.ok && JSON.parse(c4.out).debitadas === 2 && um(`SELECT saldo FROM comercial.saldos_folhas WHERE usuario_id = '${A}' AND classe = 'padrao'`) === '3', 'com folhas compradas, o consumo debita do saldo (livro-razão + saldo, na mesma transação)');
  ok(um(`SELECT sum(quantidade) FROM comercial.movimentos_folhas WHERE usuario_id = '${A}' AND classe = 'padrao'`) === '3', 'o saldo é sempre a soma do livro-razão');

  console.log('Isolamento entre contas (RLS) e segredos:');
  ok(comoApp(B, `SELECT count(*) FROM comercial.saldos_folhas; SELECT count(*) FROM comercial.recibos;`).out === '0\n0' && comoApp(A, `SELECT count(*) FROM comercial.recibos;`).out === '1', 'Bia não vê o saldo nem o recibo da Ana; a Ana vê o dela');
  ok(/permission denied|permissão negada/i.test(comoApp(A, `SELECT * FROM identidade.credenciais_senha;`).err), 'a API não lê a tabela de senhas (só pela função)');
  ok(/permission denied|permissão negada/i.test(comoApp(A, `SELECT token_hash FROM identidade.sessoes;`).err), 'nem o hash do token da sessão');
  ok(comoApp(A, `SELECT count(*) FROM identidade.usuarios;`).out === '1', 'a pessoa só enxerga a própria conta');
  ok(/permission denied|permissão negada/i.test(comoApp(A, `SELECT * FROM identidade.codigos_verificacao;`).err) && /permission denied|permissão negada/i.test(comoApp(A, `SELECT * FROM identidade.tentativas_entrada;`).err), 'nem os códigos por e-mail nem as tentativas de entrada (só pelas funções)');

  console.log('Códigos de impressão (D-124):');
  const hm = h32('PL-ABCD-EFGH');
  const semPerm = comoApp(A, `SELECT comercial.criar_lote_codigos('Avulso básico', 4, 'padrao', 24, NULL, ARRAY['${hm}'::bytea], ARRAY['EFGH']);`);
  const naoAdmin = comoApp(A, `SELECT comercial.criar_lote_codigos('Avulso básico', 4, 'padrao', 24, NULL, ARRAY['${hm}'::bytea], ARRAY['EFGH']);`, 'pl_admin');
  ok(/permission denied|permissão negada/i.test(semPerm.err) && /PL004/.test(naoAdmin.err), 'só a conta admin cria códigos: a API nem executa a função; no painel, outra conta recebe PL004');
  ok(comoApp(C, `SELECT comercial.criar_lote_codigos('Avulso básico', 4, 'padrao', 24, NULL, ARRAY['${hm}'::bytea], ARRAY['EFGH']);`, 'pl_admin').ok, 'o admin cria o lote (o código em texto não entra no banco, só o HMAC e os 4 últimos caracteres)');
  const r1 = comoApp(B, `SELECT comercial.resgatar_codigo('${hm}', '${B}');`), r2 = comoApp(B, `SELECT comercial.resgatar_codigo('${hm}', '${B}');`);
  ok(r1.ok && JSON.parse(r1.out).folhas === 4 && /PL003/.test(r2.err), 'resgate: 4 folhas na 1ª vez; o mesmo código de novo é recusado (uso único, PL003)');
  ok(/permission denied|permissão negada/i.test(comoApp(C, `SELECT codigo_hmac FROM comercial.codigos_impressao;`, 'pl_admin').err), 'nem o admin lê o HMAC dos códigos');

  console.log('Pro:');
  const pPro = um(`SELECT id FROM comercial.precos WHERE produto = 'pro_mensal' AND upper_inf(vigencia)`);
  const ckP = comoApp(B, `INSERT INTO comercial.checkouts (usuario_id, tipo, quantidade, metodo, preco_id, valor_centavos, provedor) VALUES ('${B}', 'pro', 1, 'cartao', '${pPro}', 1490, 'stripe') RETURNING id;`).out.split('\n').pop();
  um(`SELECT comercial.registrar_evento_pagamento('stripe', 'evt-pro', 'payment.confirmed', true, '${ckP}', 1490, 'sub_123')`);
  const dPro = js(comoApp(B, `SELECT comercial.direito_de_uso('${B}');`)), cPro = consumir(B, 'folha-pro', 3);
  ok(dPro.plano === 'pro' && dPro.assinaturaPodeDesligar === true && cPro.ok && JSON.parse(cPro.out).plano === 'pro', 'assinatura confirmada: plano Pro, pode desligar a assinatura PolarLife e o uso é contado sem travar');
  const canc = js(comoApp(B, `SELECT comercial.cancelar_assinatura('${B}');`));
  ok(canc.ok && um(`SELECT comercial.plano_de('${B}')`) === 'pro', 'cancelar: vale até o fim do período (continua Pro até lá)');

  console.log('Auditoria:');
  ok(comoApp(C, `SELECT comercial.novo_limite('gratis', 2, NULL, 24, false);`, 'pl_admin').ok && um(`SELECT count(*) FROM comercial.limites_plano WHERE plano = 'gratis'`) === '2' && um(`SELECT count(*) FROM comercial.limites_plano WHERE plano = 'gratis' AND upper_inf(vigencia)`) === '1', 'mudar o limite cria uma versão nova e fecha a anterior (histórico, sem sobreposição)');
  ok(+um(`SELECT count(*) FROM auditoria.eventos WHERE tabela = 'comercial.limites_plano'`) >= 2, 'a mudança do limite está na trilha de auditoria');
  ok(!psql(`UPDATE auditoria.eventos SET acao = 'x'`).ok && !psql(`DELETE FROM comercial.movimentos_folhas`).ok, 'trilha e livro-razão são só de inclusão (nem o dono altera ou apaga linha)');

  console.log('LGPD:');
  const exp = js(comoApp(A, `SELECT privacidade.exportar_dados('${A}');`));
  ok(exp.conta && exp.conta.email === 'ana@exemplo.com' && exp.recibos.length === 1 && exp.folhas.saldo.padrao === 3 && /aparelho/.test(exp.aviso), 'exportar meus dados: conta, recibos, folhas e o aviso de que fotos e projetos nunca vieram ao servidor');
  ok(comoApp(A, `SELECT privacidade.excluir_conta('${A}');`).ok, 'excluir a conta');
  const depois = um(`SELECT u.situacao || '|' || (u.email IS NULL) || '|' || (u.nome IS NULL) || '|' || (SELECT count(*) FROM comercial.recibos WHERE usuario_id = u.id) || '|' || (SELECT coalesce(sum(saldo), 0) FROM comercial.saldos_folhas WHERE usuario_id = u.id) || '|' || (SELECT count(*) FROM identidade.credenciais_senha WHERE usuario_id = u.id) || '|' || (SELECT count(*) FROM privacidade.pedidos_titular WHERE usuario_id = u.id AND tipo = 'eliminacao') FROM identidade.usuarios u WHERE u.id = '${A}'`);
  ok(depois === 'excluida|true|true|1|0|0|1', 'excluída: sem e-mail, nome nem senha; folhas zeradas; recibo guardado (fiscal) e pedido registrado (' + depois + ')');
  const emClaro = um(`SELECT count(*) FROM auditoria.eventos WHERE tabela = 'identidade.usuarios' AND (coalesce(antes ->> 'email', '[oculto]') <> '[oculto]' OR coalesce(depois ->> 'email', '[oculto]') <> '[oculto]')`);
  const ocultos = um(`SELECT count(*) FROM auditoria.eventos WHERE tabela = 'identidade.usuarios' AND (antes ->> 'email' = '[oculto]' OR depois ->> 'email' = '[oculto]')`);
  ok(emClaro === '0' && +ocultos > 0, 'a trilha registra as mudanças da conta (troca de e-mail, exclusão) com o e-mail oculto, nunca em claro (' + ocultos + ' eventos)');

  console.log('Retenção e análise:');
  ok(um(`SELECT count(*) FROM pg_inherits h JOIN pg_class p ON p.oid = h.inhparent WHERE p.relname IN ('eventos', 'registros_acesso') AND p.relnamespace = 'auditoria'::regnamespace`) === '10', 'partições mensais criadas (mês atual e 3 à frente, mais a padrão, para as duas tabelas)');
  um(`CREATE TABLE auditoria.registros_acesso_202001 PARTITION OF auditoria.registros_acesso FOR VALUES FROM ('2020-01-01 00:00+00') TO ('2020-02-01 00:00+00')`);
  ok(um(`SELECT auditoria.descartar_antigas()`) === '1' && um(`SELECT to_regclass('auditoria.registros_acesso_202001') IS NULL`) === 't', 'retenção: partição de registros de acesso com mais de 6 meses é apagada inteira');
  ok(comoApp(null, `INSERT INTO auditoria.registros_acesso (usuario_id, ip, porta_origem, metodo, rota, status) VALUES (NULL, '203.0.113.7', 51515, 'POST', '/auth/email/start', 200);`).ok, 'a API grava o registro de acesso (Marco Civil: IP, porta, data e hora)');
  ok(/permission denied|permissão negada/i.test(comoApp(null, `SELECT * FROM auditoria.registros_acesso;`).err), 'mas não lê os registros (só o papel de auditoria)');
  const an = comoApp(null, `SELECT count(*) FROM analise.vendas_por_mes; SELECT count(*) FROM analise.folhas_por_mes;`, 'pl_analitica');
  ok(an.ok && /permission denied|permissão negada/i.test(comoApp(null, `SELECT email FROM identidade.usuarios;`, 'pl_analitica').err), 'análise vê só agregados (vendas e folhas por mês), nunca a tabela de contas');
  ok(/"sessoes":/.test(um(`SELECT auditoria.limpar_expirados()`)), 'limpeza de itens vencidos (sessões, códigos de e-mail, tentativas, exportações, checkouts)');

  console.log('Notificações (D-208):');
  const semFoto = um(`SELECT coalesce(string_agg(table_name || '.' || column_name, ', '), '') FROM information_schema.columns WHERE table_schema = 'avisos'
    AND column_name ~* '(foto|miniatura|imagem|legenda|exif|gps|latitude|longitude|coordenada|thumb|caption)'`);
  ok(semFoto === '', 'avisos sem coluna de foto, miniatura ou legenda: a colagem da lembrança é feita no aparelho (BR-01)' + (semFoto ? ': ' + semFoto : ''));
  ok(um(`SELECT count(*) FROM avisos.modelos`) === '3', 'os 3 textos automáticos (lembrança, sugestão, prazo) já vêm prontos');
  const pr = js(comoApp(B, `SELECT avisos.salvar_preferencias('${B}', true, '{"lembranca": false}', 'sistema', 23::smallint, 7::smallint);`));
  ok(pr.tipos.lembranca === false && pr.canal === 'sistema' && pr.silencio.ini === 23, 'a conta salva as próprias preferências (tipos, canal e horário silencioso)');
  ok(/PL004/.test(comoApp(B, `SELECT avisos.salvar_preferencias('${C}', false, NULL, NULL, NULL, NULL);`).err), 'ninguém muda as preferências de outra conta (PL004)');
  ok(!comoApp(B, `SELECT avisos.salvar_preferencias('${B}', true, '{"foto": true}', NULL, NULL, NULL);`).ok, 'tipo de aviso desconhecido é recusado');
  const ins = comoApp(B, `SELECT avisos.inscrever_push('${B}', 'https://push.exemplo.net/abc', '${'B'.repeat(87)}', 'segredoAuth1234567890', 'Android · Chrome');`);
  ok(ins.ok && comoApp(B, `SELECT count(*) FROM avisos.inscricoes_push;`).out === '1' && /permission denied|permissão negada/i.test(comoApp(B, `SELECT chave_auth FROM avisos.inscricoes_push;`).err),
    'inscrição de push gravada; a própria API não lê as chaves de volta');
  const PB = um(`SELECT comercial.plano_de('${B}')`), PUB = PB === 'pro' ? 'assinantes' : PB;
  const camp = comoApp(C, `SELECT avisos.salvar_campanha(NULL, 'promocao', 'Folhas em dobro', 'Na compra de 5, mais 5.', 'conta/planos/', 'Ver oferta', '${PUB}', 'app', NULL, NULL);`, 'pl_admin');
  const K = camp.out;
  ok(camp.ok && /PL004/.test(comoApp(B, `SELECT avisos.salvar_campanha(NULL, 'anuncio', 'x', 'y', NULL, NULL, 'todos', 'app', NULL, NULL);`, 'pl_admin').err), 'só a conta admin cria campanha (PL004 para as outras)');
  ok(!comoApp(C, `SELECT avisos.salvar_campanha(NULL, 'anuncio', 'Novo', 'Texto', 'https://golpe.example', NULL, 'todos', 'app', NULL, NULL);`, 'pl_admin').ok, 'o botão da campanha só leva para dentro do app (endereço de fora é recusado)');
  ok(comoApp(B, `SELECT count(*) FROM avisos.caixa('${B}');`).out === '0', 'rascunho não aparece para ninguém');
  ok(comoApp(C, `SELECT avisos.mudar_campanha('${K}', 'lancar');`, 'pl_admin').out === 'ativa', 'lançar põe a campanha no ar');
  ok(comoApp(B, `SELECT count(*) FROM avisos.caixa('${B}');`).out === '1', 'a conta vê a promoção feita para o plano dela (' + PB + ')');
  ok(comoApp(C, `SELECT count(*) FROM avisos.caixa('${C}');`).out === '0', 'e outra conta, de outro público, não vê');
  ok(/22023/.test(comoApp(C, `SELECT avisos.salvar_campanha('${K}', 'promocao', 'Mudou', 'z', NULL, NULL, 'todos', 'app', NULL, NULL);`, 'pl_admin').err) || !comoApp(C, `SELECT avisos.salvar_campanha('${K}', 'promocao', 'Mudou', 'z', NULL, NULL, 'todos', 'app', NULL, NULL);`, 'pl_admin').ok,
    'campanha no ar não se edita (pausa ou duplica)');
  comoApp(B, `SELECT avisos.marcar('${B}', 'promocao', 'app', 'campanha:${K}', '${K}', 'aberta'); SELECT avisos.marcar('${B}', 'promocao', 'app', 'campanha:${K}', '${K}', 'dispensada');`);
  ok(comoApp(B, `SELECT count(*) FROM avisos.caixa('${B}');`).out === '0' && um(`SELECT entregues || '|' || abertas || '|' || dispensadas FROM avisos.resumo_campanhas WHERE campanha_id = '${K}'`) === '1|0|1',
    'dispensada some da caixa; o resumo do admin conta sem dado pessoal (marcar de novo não duplica)');
  ok(comoApp(C, `SELECT avisos.mudar_campanha('${K}', 'pausar');`, 'pl_admin').out === 'pausada' && /22023/.test(comoApp(C, `SELECT avisos.mudar_campanha('${K}', 'agendar');`, 'pl_admin').err),
    'pausar vale; agendar sem início no futuro é recusado');
  ok(+um(`SELECT count(*) FROM auditoria.eventos WHERE tabela = 'avisos.campanhas'`) >= 3, 'criar, lançar e pausar campanhas ficam na trilha de auditoria');

  console.log('Cupons (D-208):');
  const hc = (s) => h32('cupom:' + s);
  const cp = comoApp(C, `SELECT comercial.novo_cupom('${hc('VERAO10')}', 'AO10', 'Verão 2026', 'percentual', 10::smallint, NULL, ARRAY['folha_padrao','pro_mensal'], now() + interval '30 days', 2, true);`, 'pl_admin');
  ok(cp.ok && /PL004/.test(comoApp(B, `SELECT comercial.novo_cupom('${hc('X')}', 'X1', 'x', 'valor', NULL, 100, NULL, NULL, NULL, true);`, 'pl_admin').err), 'só a conta admin cria cupom; o banco guarda só o HMAC');
  ok(/permission denied|permissão negada/i.test(comoApp(C, `SELECT codigo_hmac FROM comercial.cupons;`, 'pl_admin').err) && comoApp(C, `SELECT rotulo || '|' || final FROM comercial.cupons;`, 'pl_admin').out === 'Verão 2026|AO10',
    'o admin vê o rótulo e o final do cupom, nunca o HMAC');
  const cf = js(comoApp(B, `SELECT comercial.conferir_cupom('${hc('VERAO10')}', '${B}', 'pro_mensal', 1490);`));
  ok(cf.desconto === 149 && cf.valor === 1341, 'conferir: 10% de R$ 14,90 = R$ 1,49 de desconto (R$ 13,41), sem gastar o cupom');
  ok(/PL007/.test(comoApp(B, `SELECT comercial.conferir_cupom('${hc('NAOEXISTE')}', '${B}', 'pro_mensal', 1490);`).err), 'cupom que não existe: PL007');
  ok(/PL009/.test(comoApp(B, `SELECT comercial.conferir_cupom('${hc('VERAO10')}', '${B}', 'folha_grande', 550);`).err), 'cupom que não vale para o produto: PL009');
  ok(comoApp(B, `SELECT comercial.usar_cupom('${hc('VERAO10')}', '${B}', 'folha_padrao', 290, NULL);`).ok && /PL008/.test(comoApp(B, `SELECT comercial.usar_cupom('${hc('VERAO10')}', '${B}', 'folha_padrao', 290, NULL);`).err),
    'usar uma vez vale; de novo na mesma conta: PL008 (um por conta)');
  const D2 = um(`SELECT identidade.criar_conta('duda@exemplo.com', 'Duda')`), E2 = um(`SELECT identidade.criar_conta('edu@exemplo.com', 'Edu')`);
  comoApp(D2, `SELECT comercial.usar_cupom('${hc('VERAO10')}', '${D2}', 'folha_padrao', 290, NULL);`);
  ok(/PL008/.test(comoApp(E2, `SELECT comercial.usar_cupom('${hc('VERAO10')}', '${E2}', 'folha_padrao', 290, NULL);`).err) && um(`SELECT usos FROM comercial.cupons`) === '2', 'limite de 2 usos: o 3º é recusado (PL008)');
  const cid = um(`SELECT id FROM comercial.cupons`);
  ok(comoApp(C, `SELECT comercial.mudar_cupom('${cid}', 'revogado');`, 'pl_admin').ok && !comoApp(C, `SELECT comercial.mudar_cupom('${cid}', 'ativo');`, 'pl_admin').ok, 'cupom revogado não volta');
  ok(comoApp(B, `SELECT count(*) FROM comercial.usos_cupons;`).out === '1', 'cada conta vê só os próprios usos de cupom (RLS)');
} catch (e) { ok(false, 'exceção: ' + e.message); }
finally {
  if (ligado) roda('pg_ctl', ['-D', DADOS, '-m', 'fast', '-w', 'stop'], { stdio: 'ignore', timeout: 60000 });
  try { rmSync(DIR, { recursive: true, force: true }); } catch {}
}
console.log(falhas ? `\n✘ banco: ${falhas} falha(s)` : '\n✔ banco: sem falhas');
process.exit(falhas ? 1 : 0);
