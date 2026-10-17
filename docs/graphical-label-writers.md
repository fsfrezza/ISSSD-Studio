# Textos gráficos de jogadores, formações e navegação

O build grava os valores confirmados de `additionalScreenTextsV1.values`.
Rascunhos não alteram a ROM. A normalização remove acentos, incluindo Ç → C;
o projeto mantém o texto digitado. Não há substituição por valores da FB96.

## Fontes verificadas

Os endereços são offsets PC da ROM Plus canônica de 2 MiB. A definição
executável de tamanhos, flags, ponteiros e reservas fica em
`src/core/graphical-label-layout.mjs`.

| Bloco original | Conteúdo | Fase |
| --- | --- | --- |
| F727E | PLAYER, SUBSTITUTE, SPEED | Jogadores |
| F7369 | atributos e POINTS LEFT | Jogadores |
| F758E | TYPE OF FORMATION, duas linhas de 4 e 5 tiles | Formações |
| DAD64 | ATTACK PARTICIPATION e botões DF/MF/FW | Formações |
| F6F2B | parte superior do botão DF | Formações |
| D7DEB | mapa nativo de formação e referências de MF | Formações |
| D0BE0 | ícones de posição copiados por CODE_80CC8B | Formações |
| 876D8 | CANCEL e cabeçalhos DF/MF/FW | Pré-Partida / Formações |
| AFBDC | botão EXIT compartilhado | Pré-Partida |
| 102100 | B:CANCEL, preservando B e a seta | Pré-Partida |
| D0B60 | CANCEL da faixa de estratégias | Pré-Partida |
| 3DFB7 | EXIT do menu de treino | Pré-Partida |

Referências: `Routine_Macros_ISSD.asm`, tabelas DATA_828EB0,
DATA_828ED6, DATA_8291B5, DATA_819419, CODE_80CC8B; nomes dos arquivos em
`AsarScripts/AssetPointersAndFiles.asm`.

## Espaço e integridade

Os streams permanecem nos primeiros 2 MiB: o descompressor usa o bit 6 do
banco como uma opção de mapa. As reservas são sub-regiões FF verificadas da
Plus, dentro de FREE_BYTES $80F828, $86CB9E, $86E5AB, $8AF558 e $AFBD1E.
Não são usados os intervalos já reservados para título, Cursor ou táticas.
Os ponteiros e tamanhos originais são verificados antes da gravação.

Os atributos continuam nos retângulos originais de quatro tiles. Palavras
longas usam a fonte compacta de 3×7 sem espaço entre letras, com hífen de
um pixel. Isso evita sobrepor os contadores atualizados durante a edição.
Textos que ultrapassem a capacidade geram erro explícito, sem truncamento.

O bloco 876D8 compartilha CANCEL e os cabeçalhos de posições. Ele usa um
stream de literais com posições fixas: a infraestrutura mantém a imagem
original, e cada fase altera somente seus bytes de pixels. Assim CANCEL
pode aparecer na fase 05 sem antecipar MC/AT da fase 09. O mapa de MF usa
uma cópia independente de F/C, preservando DF. Os botões menores conservam
suas bordas e recebem letras novas na faixa central.

## Validação

`tests/plus-graphical-labels.test.mjs` cobre as 18 solicitações, base e estado
imutáveis, fases desmarcadas, restauração em inglês, edição parcial, limites,
reservas ocupadas, compressão, separação cumulativa dos blocos compartilhados
e os sete intervalos de preenchimento de Estratégias antes sem classificação.
Os testes usam ROMs sintéticas, sem depender do projeto editável do usuário.

A conferência adicional com a ROM Plus real verifica os snapshots cumulativos
no emulador, incluindo os rótulos completos de atributos, cabeçalhos e botões
de posição, legenda de formação, participação no ataque, SAIR e DESFAZ.
