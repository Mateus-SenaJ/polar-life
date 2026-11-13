-- PolarLife · banco de dados · 0008 · manutenção e retenção (D-206)
-- Rotinas para o agendador (pg_cron no provedor, ou um job da API): partições do mês, retenção por prazo e limpeza de
-- itens vencidos. Prazos em config.parametros (governança: o prazo é dado, não código).

-- partições mensais da trilha e dos registros de acesso (mês corrente e os próximos), em UTC
CREATE FUNCTION auditoria.criar_particoes(p_meses integer DEFAULT 3) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
  i integer;
  ini timestamp;
  t text;
  nome text;
  n integer := 0;
BEGIN
  FOR i IN 0 .. greatest(0, least(p_meses, 24)) LOOP
    ini := date_trunc('month', now() AT TIME ZONE 'UTC') + make_interval(months => i);
    FOREACH t IN ARRAY ARRAY['eventos', 'registros_acesso'] LOOP
      nome := t || '_' || to_char(ini, 'YYYYMM');
      IF to_regclass(format('auditoria.%I', nome)) IS NULL THEN
        EXECUTE format('CREATE TABLE auditoria.%I PARTITION OF auditoria.%I FOR VALUES FROM (%L) TO (%L)',
                       nome, t, (ini AT TIME ZONE 'UTC'), ((ini + interval '1 month') AT TIME ZONE 'UTC'));
        n := n + 1;
      END IF;
    END LOOP;
  END LOOP;
  RETURN n;
END $$;

-- retenção: registros de acesso por 6 meses (Marco Civil, art. 15); trilha de auditoria pelo prazo do parâmetro (5 anos)
CREATE FUNCTION auditoria.descartar_antigas() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE
  r record;
  n integer := 0;
  mes_atual date := date_trunc('month', now() AT TIME ZONE 'UTC')::date;
  meses_acesso integer := coalesce((SELECT (valor #>> '{}')::integer FROM config.parametros WHERE chave = 'retencao.registros_acesso_meses'), 6);
  anos_trilha integer := coalesce((SELECT (valor #>> '{}')::integer FROM config.parametros WHERE chave = 'retencao.auditoria_anos'), 5);
BEGIN
  meses_acesso := greatest(meses_acesso, 6);   -- nunca abaixo do mínimo legal
  FOR r IN
    SELECT c.relname AS particao, p.relname AS pai
    FROM pg_inherits h JOIN pg_class c ON c.oid = h.inhrelid JOIN pg_class p ON p.oid = h.inhparent JOIN pg_namespace s ON s.oid = p.relnamespace
    WHERE s.nspname = 'auditoria' AND p.relname IN ('eventos', 'registros_acesso') AND c.relname ~ '_[0-9]{6}$'
  LOOP
    -- a partição sai quando o mês inteiro dela já passou do prazo
    IF (to_date(right(r.particao, 6), 'YYYYMM') + interval '1 month')::date <=
       (CASE r.pai WHEN 'registros_acesso' THEN (mes_atual - make_interval(months => meses_acesso))::date
                   ELSE (mes_atual - make_interval(years => anos_trilha))::date END) THEN   -- entre parênteses: o THEN do CASE não fecha o IF
      EXECUTE format('DROP TABLE auditoria.%I', r.particao);
      n := n + 1;
    END IF;
  END LOOP;
  RETURN n;
END $$;

-- itens vencidos: sessões (30 dias após vencer ou encerrar), códigos de e-mail, tentativas de entrada, exportações e checkouts
CREATE FUNCTION auditoria.limpar_expirados() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
DECLARE a integer; b integer; c integer; d integer; e integer;
BEGIN
  DELETE FROM identidade.sessoes WHERE expira_em < now() - interval '30 days' OR revogada_em < now() - interval '30 days';
  GET DIAGNOSTICS a = ROW_COUNT;
  DELETE FROM identidade.codigos_verificacao WHERE expira_em < now() - interval '1 day';
  GET DIAGNOSTICS b = ROW_COUNT;
  DELETE FROM identidade.tentativas_entrada WHERE ocorrida_em < now() - interval '1 day';
  GET DIAGNOSTICS c = ROW_COUNT;
  UPDATE privacidade.exportacoes SET situacao = 'expirada', arquivo_ref = NULL WHERE situacao = 'pronta' AND expira_em < now();
  GET DIAGNOSTICS d = ROW_COUNT;
  UPDATE comercial.checkouts SET situacao = 'expirado' WHERE situacao = 'pendente' AND expira_em < now();
  GET DIAGNOSTICS e = ROW_COUNT;
  RETURN jsonb_build_object('sessoes', a, 'codigos', b, 'tentativas', c, 'exportacoes', d, 'checkouts', e);
END $$;

GRANT EXECUTE ON FUNCTION auditoria.criar_particoes(integer), auditoria.descartar_antigas(), auditoria.limpar_expirados() TO pl_manutencao;

-- já nasce com o mês corrente e os 3 próximos
SELECT auditoria.criar_particoes(3);
