# ZIP cumulativo com seleção de nove fases

**Salvar ROM** abre a seleção abaixo. Os arquivos seguem uma numeração fixa:

1. Infraestrutura
2. Metadados
3. Tela Inicial
4. Menu Principal
5. Pré-Partida
6. Textos da tela Estratégias
7. Seleção de equipes
8. Jogadores (incluindo paletas/uniformes já mapeados nesta área)
9. Formações

Uma fase desmarcada não gera arquivo nem aplica seus bytes às ROMs seguintes.
Assim, selecionar 01, 02 e 08 gera apenas esses três arquivos, com lacunas na
numeração. As fases marcadas geram um arquivo mesmo sem mudança binária; o índice
registra `sem-alteracao-binaria`. A preparação de 4 MiB e individualização é sempre
obrigatória; desmarcar 01 omite somente sua ROM separada.

Textos da tela Estratégias e registros táticos/Formações agora são fases distintas.
Offsets legados sem área confirmada são listados em `unassignedLegacyRanges` e
não são aplicados silenciosamente em outra fase. Não existe uma décima fase genérica.
`finalMatchesSelectedAreas` verifica a última ROM contra as áreas selecionadas,
sem afirmar equivalência com um build que inclui áreas desmarcadas.

## Fotos e gráficos da Tela Inicial

Se 03 estiver selecionada e houver imagens customizadas, o navegador executa o
conversor nativo do compositor antes de enviar a exportação. Ele prepara cópias
temporárias dos grupos e materializa os streams em uma cópia da ROM-base. Nenhum
override é materializado durante a abertura do projeto.

O servidor recebe grupos nativos (`fundo`, `letreiro`, `fotos`), verifica os
ponteiros, capacidade original, dimensões, descompressão/round-trip e conteúdo
diferente do original. Fotos preservam o bit 15 do cabeçalho Konami. Os pixels
validados entram na fase 03 e permanecem nas fases seguintes.

A ausência da conversão de uma camada customizada cancela a exportação. Conflitos
de tiles ou streams maiores que o espaço nativo seguro também impedem o download;
não há fallback silencioso para as fotos originais. Isso não implementa um hook
novo de realocação quando a imagem não cabe. A desmarcação de 03 dispensa a
conversão e preserva os gráficos da ROM-base nas fases seguintes.

O agrupamento usa os ponteiros reais dos streams nativos da Plus. Os offsets de
TITLE_GROUPS pertencentes a outras variantes não bastam para localizar as fotos.
Checksum e mirrors são recalculados em cada ROM. A ROM-base permanece imutável.

## Escopo

Writers semânticos ainda ausentes em outros domínios não passam a existir pela
seleção das fases. O índice descreve alterações efetivamente materializadas.
Backups, projetos, ROMs e pastas de recuperação continuam protegidos.
