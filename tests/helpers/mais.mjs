/* D-172: testes que mexem em ajustes avançados abrem todas as seções «mais ajustes» antes de carregar a página. */
export const SECOES = ['Papel e orientação', 'Margem e espaço', 'Linhas de corte', 'Rodapé e assinatura', 'Fundo da folha', 'Filtro', 'Recorte e posição', 'Luz e cor', 'Detalhe', 'Estilo', 'Posição', 'Personalizar', 'Medidas'];
export const abrirTudo = (s) => { try { const o = {}; for (const k of s) o[k] = true; localStorage.setItem('pl-mais', JSON.stringify(o)); } catch (e) {} };
export async function maisAbertos(ctx) { await ctx.addInitScript(abrirTudo, SECOES); }
