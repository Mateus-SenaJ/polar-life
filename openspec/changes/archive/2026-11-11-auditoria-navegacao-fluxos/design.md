## Context

O projeto aberto vive em dois lugares: o estado de edição em `sessionStorage` (chaves `pl-fotos`, `pl-quadro`, `pl-folhas`, `pl-orientacao`, `pl-fmt`, `pl-colagem`) e o identificador do projeto atual em `localStorage` (`pl-projeto-atual`). `PLSESSAO` grava o estado da aba no registro do projeto (IndexedDB) 600 ms depois de cada mudança. Uma aba nova herda o identificador, mas não o estado: o editor caía no exemplo e a primeira mudança gravava esse estado vazio por cima do projeto.

## Goals / Non-Goals

**Goals:** nenhuma gravação de estado que não pertença ao projeto atual; telas de projeto real sem dados do exemplo; escolhas de uma tela chegando à seguinte; navegação sem links mortos.

**Non-Goals:** mudar o modelo de dados, o formato do backup `.polarlife` ou as chaves existentes (`Number(src)` continua sendo a chave das fotos).

## Decisions

- **Marca de sincronia (D-157).** `sessionStorage['pl-projeto-sessao']` = id do projeto cujo estado está na aba. `PLPROJETOS.definirAtual` grava a marca; `sincronizado()` compara com `pl-projeto-atual`; `salvarEstado` vira no-op sem sincronia. Ao carregar, `PLPROJETOS.pronto` chama `abrir(atual)` quando falta a marca e, nas rotas `editor|resumo|orientacao|processando|adicionar-fotos`, recarrega a página (o documento fica invisível nesse intervalo). Alternativa descartada: mover o estado para `localStorage` (duas abas editando brigariam pela mesma chave).
- **`PLPROJETOS.abrir` devolve `{id, fotos, exemplo, nome}` (D-158).** Lista e Início decidem o destino: sem fotos e sem ser modelo → `adicionar-fotos/`.
- **Formato inicial em um lugar só (D-159, MT-02).** `PLFOLHAS.FORMATOS` (mm: `w`, `h`, `jh`, `lado`, `topo`; mesmas medidas do `FMT` de `molduras.js`) e `PLFOLHAS.formatoInicial()`, que lê `pl-fmt` (`mini`, `pocket`, `imini`, `isq`, `iwide`) e devolve a moldura em pé (`ori:'v'`). Editor, Quadro (Molduras), gerador e resumo usam essa função. Quando o editor grava a moldura em `pl-quadro`, `pl-fmt` é apagado.
- **Papel da T-02 como semente de `pl-folhas`.** Só `{papel, orient, w?, h?}` e só quando difere de A4 retrato; os demais campos seguem `PLFOLHAS.PADRAO`. A pergunta de orientação deixa de apagar `pl-folhas`: remove só o campo `separar`. A assinatura segue a preferência da conta enquanto `pl-folhas` não tiver o campo `assin`.
- **Formulário restaurado pelo navegador.** No `pageshow`, «Novo projeto» lê os controles marcados e acerta o estado interno.
- **Portão (D-163).** `usou = usadasMes > 0 || faltam >= n`; quantidade a comprar = `faltam` quando a folha do mês ainda está livre.
- **Colagem pelo Quadro (D-161).** Link `../#colagem`; o editor liga o modo e tira o fragmento com `history.replaceState`.

## Risks / Trade-offs

- Aba já aberta no momento da atualização do site não tem a marca → o projeto é recarregado do aparelho uma vez (perde no máximo os últimos 600 ms não gravados).
- Projeto atual excluído em outra aba → a marca nunca fecha; o identificador é limpo quando a aba não tem fotos.
- `location.replace` depois de entrar tira a tela de entrar do histórico (é o que se quer; D-118 mantido).
