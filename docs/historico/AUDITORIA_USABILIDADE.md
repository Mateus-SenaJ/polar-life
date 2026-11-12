# Auditoria de usabilidade · todos os tamanhos de tela (2026-11-12, D-169)

Varredura automática de 22 telas × 14 tamanhos (320×640 até 2560×1440), com conta Pro e projeto real de 6 fotos (CC0), mais revisão visual das capturas.

| Categoria | Antes (ocorrências reais) | Depois |
|---|---|---|
| Rolagem lateral da página | Conta e Conexões a 320–360 px | 0 |
| Botão/link fora da tela | abas do inspetor (até 1280 px), «Pausar» (320 px), botões de Conexões (320 px), barra do Quadro (320 px) | 0 |
| Texto de botão cortado | cartões de Conexões em 320 px | 0 |
| Alvo de toque < 44 px | abas «Papel»/«Fotos» (38 px), LED pequeno (42 px), «Pausar» só ícone (40 px) | 0 |
| Imagem distorcida | logo do editor (768–820 px), prévia da colagem no Início (768–820 px) | 0 |
| Letra < 12 px | nomes de filtro, «Seu plano», rótulo da entrada no celular | 0 |
| Elemento escondido | selo «Ambiente de teste» atrás do cabeçalho do editor (todas as larguras) | visível |
| Coerência visual | banner 1 do Início com câmera desenhada e frase repetida da entrada | câmera realista e frase própria |

Falsos positivos descartados na varredura: rótulos só para leitor de tela (ícones do cabeçalho), carrosséis com rolagem lateral de propósito, partes internas do botão LED (fumaça e barra de progresso), campos numéricos (a caixa de 44 px é o alvo), prévias em miniatura dos modelos, rótulos mono de 11 px do sistema de design, e o painel inferior do editor no celular, que recolhe por desenho.

Teste permanente: `npm run testar:usabilidade` (15 telas × 6 tamanhos), incluído em `testar:node`.
