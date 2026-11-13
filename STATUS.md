# Status do projeto

Atualizado em 2026-11-13 (D-194 a D-207). O histórico das etapas antigas está em `docs/historico/` e no git; as decisões, em `docs/10_LOG_DECISOES.md`.

## No ar
- https://polar-life.vercel.app e https://mateus-senaj.github.io/polar-life/ (o mesmo `site/`, publicado a partir de `main`).
- Tudo roda no aparelho (T5): fotos, projetos (de cada conta, D-193) e arquivos gerados ficam no navegador.
- Fluxo completo: entrar → Início (banners, sugestões de design, colagens para as redes) → projetos → adicionar fotos → Quadro
  (recorte, ajustes, filtros, legendas, molduras) → Folhas ou Colagem → revisão → PDF, PDF profissional, PDF leve,
  imagens das folhas, polaroids avulsas ou imagem para as redes (1080 × 1080, 1080 × 1350, 1080 × 1920) → baixar, imprimir ou compartilhar.
- Contas de teste (admin, gratis, folha e pro @polarlife.test): botões na tela Entrar só no aparelho que abrir `/app/entrar/?contas-de-teste`; também entram com e-mail e senha (senhas com o dono, em `.local/contas-de-teste.txt`, D-196).
- Atalho «Fazer uma polaroid» (D-197): uma foto, legenda e «Baixar polaroid» em PNG a 300 DPI. Guias de corte tracejadas e suaves também no PDF (D-205).
- Conta com configurações de SaaS (perfil, plano e uso, códigos, pagamentos, segurança, preferências, privacidade); instalar como app é opcional, só na Conta (D-207).
- Colagem sem contorno preto (sombra e cantos opcionais), imagem para compartilhar em PNG Alta como padrão e revisor com miniaturas, interruptores e avisos (D-207).
- Compras de planos: **demonstração** (liberam créditos sem cobrar, com o aviso na tela), por decisão do dono. Entrar com Google é de verdade onde está configurado.

## Preparado, fora do ar
- Banco PostgreSQL para quando houver servidor (D-206): esquema em `db/`, regras de dados no DOC-15, operação em `db/README.md`.
  `npm run testar:banco` aplica tudo num PostgreSQL descartável e confere as regras. O site ainda não usa o banco.

## Como mexer
1. Ler `AGENTS.md` (Travas T1 a T8) e as decisões recentes do log.
2. Mudança nova: change do OpenSpec validado (`openspec validate --strict`) antes de implementar.
3. Trabalhar numa cópia em `.trabalho/<nome>` (branch `etapa-<nome>`), rodar `npm run verificar` e `npm run testar:node`.
4. Publicar: push da branch → CI verde → merge rápido em `main` → `vercel deploy --prod --yes` na cópia de deploy.

## Pendências do dono
- Conferir o nome do app («PolarLife») na tela de consentimento do Google (OAuth).
- Preencher nos Termos: razão social, CNPJ, endereço, e-mail de contato e prazos.
- Testar o Google Fotos com uma conta real.
- Pagamento real (Pix e cartão) fica para uma etapa própria, quando o dono decidir.
- Registrar o domínio próprio e decidir onde a API vai rodar; o banco vem depois, num PostgreSQL gerenciado na região de São Paulo (DOC-15 §10).
