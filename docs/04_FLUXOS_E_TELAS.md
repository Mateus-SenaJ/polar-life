---
id: DOC-04
titulo: PolarLive · Fluxos e inventário de telas
edicao: 2
data: 2026-11-07
status: vigente
depende_de: [DOC-01, DOC-03, DOC-05, DOC-06, DOC-07]
---

# Fluxos e telas

> **TL;DR para IA.** Há 8 jornadas. Cada uma lista passos, a falha prevista e a recuperação. O inventário do §4 dá a cada tela um ID (`T-xx`), os breakpoints, a versão e os estados obrigatórios. Desenhe **uma tela por vez**, 4 a 6 por etapa, sempre reutilizando os componentes do DOC-01.

## 1. Mapa geral

```
HOME ─► NOVO PROJETO ─► ADICIONAR FOTOS ─► RESUMO ─► ORGANIZAR (Folhas) ─► EDITAR (Quadro) ─► LEGENDAR
                              │                                   │
                              └─► CONEXÕES (verificar origem)     ├─► COLAGEM ─► SUGESTÕES ─► LEMBRANÇA ─► COMPARTILHAR
                                                                  └─► PRÉ-VOO ─► DIREITO DE USO (2.0) ─► GERAR ─► ENTREGAR ─► ARQUIVAR
Editar e ver o preview nunca passam pelo portão. Todo fluxo é cancelável.
```

## 2. Jornadas

### FL-01 · Primeira visita e projeto novo
1. Apresentação (T-28) → «Começar agora» → Home (T-01) vazia com convite.
2. Novo projeto (T-02): formato da polaroid (6 de fábrica + Personalizado) e papel. «Uma polaroid» abre o atalho foto → legenda → baixar.
3. Adicionar fotos (T-03).
**Falha:** nenhuma foto escolhida → estado vazio com os 3 caminhos (aparelho, câmera, arrastar). **Saída:** projeto salvo no aparelho.

### FL-02 · Importar
1. T-03: cartões **Do aparelho · Câmera · Google Fotos · Apple · Instagram · Drive/Dropbox/OneDrive**, cada um com estado da conexão (DOC-07). Texto fixo: «Suas fotos continuam no seu aparelho.»
2. T-04 processa em worker: barra determinada «Convertendo 3 de 24»; erro **por arquivo** sem travar o resto.
3. T-05 resumo: quantidade, orientação, datas, local, qualidade, folhas previstas; «Manter uma de cada» e «Ordenar por data da foto».
4. T-06 pergunta de orientação (pop-up LED) quando há verticais e horizontais: **Separar por orientação** (recomendada), Todas no padrão, Decidir depois.
**Falhas:** arquivo inválido, HEIC que não converte, memória → lista «não suportadas» com «Tentar de novo» por arquivo.

### FL-03 · Organizar folhas (Modo Folhas)
Papel, orientação, margem, espaço, giro, agrupamento, guias × contorno, assinatura. O contador atualiza em tempo real («24 fotos · 6 folhas · 4 por folha»). **Falha:** «A polaroid não cabe neste papel» + sugestão (reduzir margem ou trocar papel). **Aviso de impacto:** toast «6 folhas → 5 folhas · Desfazer».

### FL-04 · Editar uma polaroid (Modo Quadro)
Clicar numa foto abre o Quadro. Recorte, ajustes, filtro, legendas, moldura, metadados. Chip de escopo sempre visível; «Replicar para as demais» começa **desmarcado**. Selo de qualidade atualiza em tempo real.

### FL-05 · Legendar
Três tipos independentes (texto, data, local), cada um com interruptor, fonte do catálogo e estilo. Posição acima/abaixo/ambas, deslocamento fino, inclinação. **Falha:** legenda fora da área segura → pré-voo bloqueia; código de arquivo → pede confirmação; coordenadas → bloqueia.

### FL-06 · Colagem e lembrança (novo, 1.1 `[RECOMENDADO]`)
1. Do Quadro ou do trilho, **Colagem** (T-15).
2. **Sugestões** (T-16): até 3 layouts calculados no aparelho, cada um com uma frase de design.
3. Ajustar: fundo, posição, rotação, camadas, legendas.
4. **Lembranças** (T-17): formato (9:16, 4:5, 1:1), legenda do post, prévia.
5. Compartilhar (T-22) ou baixar. **Falhas:** sem suporte a compartilhar de arquivo → «Baixar imagem» com instrução do app de destino.

### FL-07 · Revisar, gerar e entregar
```
Pré-voo (T-18) → [2.0 Direito de uso (T-25/T-26)] → Gerar (T-20) → Entregar → Arquivar
```
- **Entregar:** imprimir agora (desktop), baixar (PDF, PNG, JPEG, ZIP), compartilhar. Celular: sem impressão direta; PDF em volumes de 60 MB.
- **Falha de foto na geração:** «2 fotos não puderam ser lidas» com **Tentar de novo · Trocar foto · Gerar sem elas · Cancelar**.
- **Sucesso:** «Concluído · 3 arquivos · 142 MB» com Baixar, Baixar novamente, Imprimir agora, Compartilhar. **Não existe «Abrir pasta».**
- **Arquivar:** lembrete de backup `.polarlife` ao fechar projeto com alterações.

### FL-08 · Verificar conexões (novo)
Entrada pela T-03 («Verificar conexão») ou pelo avatar. A T-23 lista cada serviço com estado e ação; «Testar» roda as linhas de verificação (T-24). Detalhes e estados: DOC-07.

## 3. Cenários de entrega

| Cenário | Comportamento |
| --- | --- |
| Impressora caseira, desktop | Pré-voo → Gerar → «Imprimir agora» com dicas (Tamanho real 100%, margens Nenhuma, sem cabeçalhos) → página de teste antes do lote |
| Impressora sem borda total | Aviso se a margem for menor que a do perfil; sugerir «Marcas de canto» |
| Celular | PDF baixado ou compartilhado ao app de impressão; recomendar «Adicione à Tela de Início» no iPhone |
| Gráfica (1.1) | Perfil «Gráfica»: marcas de canto, sem rodapé, nome neutro, sem sangria |
| Projeto grande (100+ fotos) | Volumes, geração cancelável, listas virtualizadas |
| Exportações seguidas | Fila; a segunda espera a primeira |
| Compra por Pix/boleto (2.0) | «Aguardando pagamento», projeto salvo, retomar depois |

## 4. Inventário de telas

Legenda: D desktop 1440 · T tablet 834 · C celular 390. Estados mínimos: **repouso · carregando · vazio · erro · sucesso** quando fizer sentido.

| ID | Tela | Dispositivos | Versão | Componentes-chave | Estados obrigatórios |
| --- | --- | --- | --- | --- | --- |
| T-01 | Home de projetos | D T C | 1.0 | Cartões de projeto, «Novo projeto» (LED) | vazia, com projetos |
| T-02 | Novo projeto e formato | D C | 1.0 | Seletor de formato, papel | formato personalizado |
| T-03 | Adicionar fotos (fontes) | D C | 1.0 | Cartões de conexão | cada serviço em cada estado |
| T-04 | Processando | D C | 1.0 | Barra determinada | erro por arquivo |
| T-05 | Resumo da importação | D C | 1.0 | Selos, ações | duplicadas, sem data |
| T-06 | Pergunta de orientação | D C | 1.0 | Pop-up LED | 3 opções |
| T-07 | Editor · Modo Folhas | D T C | 1.0 | Mesa, faixa de folhas, inspetor | folha parcial, não cabe |
| T-08 | Editor · Modo Quadro | D C | 1.0 | Polaroid grande, faixa do lote | foto «Ajustada», «Com ressalvas» |
| T-09 | Inspetor · Papel e guias | D T C | 1.0 | Campos, interruptores | guias ligadas, contorno ligado, sem linhas |
| T-10 | Inspetor · Legendas | D T C | 1.0 | Seletor de fonte, estilos | fora da área segura |
| T-11 | Inspetor · Ajustes e filtros | D T C | 1.0 | Deslizadores, grade de 12 filtros | «Ver original» |
| T-12 | Inspetor · Molduras e medidas | D T | 1.0 | Medidas, cadeado | |
| T-13 | Inspetor · Metadados | D T C | 1.0 | Leitura + 3 campos | sem data, sem local |
| T-14 | Lote e seleção | D T C | 1.0 | Seleção, «Valores diferentes» | ajuste individual protegido |
| T-15 | Modo Colagem | D T C | 1.1 | Canvas, camadas, alças | vazio, N fotos |
| T-16 | Sugestões de colagem | D C | 1.1 | Cartão de sugestão | poucas fotos, muitas fotos |
| T-17 | Lembranças | D C | 1.1 | Cartão de lembrança | formatos 9:16, 4:5, 1:1 |
| T-18 | Pré-voo «Tudo pronto para o papel?» | D C | 1.0 | Pop-up LED, itens 3 severidades | cada severidade |
| T-19 | Exportar | D C | 1.0 | Cartões de formato, estimador | volumes |
| T-20 | Gerando · recuperação · concluído | D C | 1.0 | Barra «Folha 1 de 6», diálogo | falha, cancelar, sucesso |
| T-21 | Imprimir agora e calibração | D | 1.0 | Dicas, 3 passos | bloqueio de pop-up |
| T-22 | Compartilhar | C D | 1.1 | Web Share, «Baixar imagem» | sem suporte |
| T-23 | Central de conexões | D T C | 1.0 (2.0 ativa) | Cartão de conexão | ver DOC-07 §3 |
| T-24 | Verificação de conexão | D C | 1.0 | Linhas de verificação | ok, atenção, falha |
| T-25 | Entrar (banner de login) | D C | 2.0 | Campo e-mail, botões Apple/Google, banners EXC-5 | código errado, expirado |
| T-26 | Direito de uso e compra | D C | 2.0 | Pop-up LED, métodos | pendente, recusado, confirmado |
| T-27 | Conta | D C | 2.0 | Plano, recibos, cancelar | |
| T-28 | Apresentação | D C | 1.0 | Hero com frase EXC-4 | |
| T-29 | Como funciona | D C | 1.0 | Passos | |
| T-30 | Páginas legais e banner de cookies | D C | 1.0 | Banner informativo, tabela | |
| T-31 | Estados vazios e erros | D C | 1.0 | Mensagens | arquivo inválido, falha de leitura, sem suporte |

## 5. Estados e mensagens (FIXO)

| Tipo | Forma | Exemplo |
| --- | --- | --- |
| Informação | Cadeado azul, borda 1 px | «Processamento 100% local. Suas fotos não sobem para nenhum servidor.» |
| Atenção | Ícone de aviso laranja + texto | «Resolução de 140 PPI na janela. Reduza o zoom ou escolha um formato menor.» |
| Erro | Borda preta 2 px + ✕ + texto | «A polaroid não cabe neste papel» |
| Sucesso | Borda preta 1 px + ✓ azul + «Concluído» | «Concluído · 3 arquivos» |
| Toast | Branco, anel LED 1 px | «6 folhas → 5 folhas · Desfazer» |

## 6. Dados de exemplo (usar em todas as telas)

Projeto **Viagem · Serra 2026** · 24 fotos · 6 folhas A4 · Polaroid Clássico 88 × 107 mm. Legendas: «Dias de sol», «Nós dois», «Dia de rolê», «Meu parceiro». Data `14.07.26`. Local «Campos do Jordão, SP». Foto 3 «Ajustada»; Foto 12 «Com ressalvas · 140 PPI»; demais «Boa · 326 PPI». Sem nomes reais, marcas de terceiros ou rostos sobre texto.

## 7. GUIADO e LIVRE

- **GUIADO:** a ordem dos blocos dentro de cada tela, desde que os componentes e estados do §4 existam.
- **LIVRE:** microcopy de estados vazios, ilustração de Home, transições entre telas.

## 8. Aceite

Cada tela entregue traz: dispositivos pedidos, estados do §4, chip de escopo (se editar), no máximo 1 botão LED, textos do §5 sem inventar variações de tom, dados do §6.
