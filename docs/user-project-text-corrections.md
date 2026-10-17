# Correção dos textos do projeto de 17/10/2026

Fonte: `International-Superstar-Soccer-Deluxe-Plus-projeto(20261017-172858).issdproj`
e capturas 09-formacoes 0002(2) a 0011. O arquivo canônico no repositório
passa a conter esse projeto, com os textos corrigidos. Equipes, identidades,
atributos, coordenadas, imagens e demais dados foram comparados com o anexo
e permanecem iguais.

## Padrões de português

`src/core/user-portuguese-presets.mjs` conserva os textos confirmados no
projeto, inclusive acentos, espaços e quebras de linha. O Editor usa esses
valores nos botões de português. `FALTAM` substitui `RESTANTES` por solicitação
posterior do usuário. `DESFAZ`, `GOLERO`, `JOGATINA` e `X1 maroto` permanecem
com a grafia escolhida no projeto.

As legendas de vantagem, seleção e pré-partida que não tinham campos próprios
foram acrescentadas às abas das respectivas telas. Os textos de uniformes
continuam na aba de uniformes.

## Gravação e limites

- Modos de jogo: os seis valores de screenTextsV1 agora alcançam as ocorrências
  nativas em 87DA0D–87DA91. Descrições usam linhas de 17 células, sem cortar palavras.
- Pré-partida: os dez rótulos gráficos do menu são reconstruídos nos cinco
  mapas nativos, incluindo intervalo e torneios. Os tiles são deduplicados
  depois da composição; frases não compartilham pixels editáveis. Não se usa FB96.
- Vantagem: a ajuda inclui todo o bloco `Press ...`, em duas linhas de 27
  células. Os seis primeiros bytes pertencem à Vantagem, e não à Tela Inicial.
  Número de atletas respeita as duas faixas de 6 e 5 tiles. A legenda menor
  usa NÍVEL para permanecer legível.
- Estratégias: ONE e FOUR são duas chamadas independentes, separadas por quatro
  bytes. Os valores 1 e 4 são gravados nos respectivos offsets; não são tratados
  como uma frase contínua.
- Jogadores: POINTS LEFT começa no tile 39, não no 38. Os onze tiles de dígitos
  e ícones são preservados, e a legenda passa a ser FALTAM.
- Uniformes: CAMISA, CALÇÃO, MEIAS, COR, TIPO e EDITAR têm gravação real nos
  tiles do asset A486CF. As setas e os controles RGB são preservados.
- Seleção: FORMAÇÃO, VER DADOS e GO/DF/MC/AT cobrem as ocorrências gráficas e a
  tabela nativa de abreviações de posições. NÚM. também cobre o botão superior
  das telas de jogadores.

O asset A0A100 compartilha legendas da seleção e B:CANCEL. Assim como 90F6D8,
usa literais de posição fixa e uma base equivalente na infraestrutura. Cada
fase cumulativa altera somente os pixels de sua tela, sem antecipar alterações
de outra fase. As novas reservas ficam em áreas FF verificadas nos primeiros
2 MiB; o descompressor mantém seu significado original para o bit de banco.

## Verificações

Testes de regressão cobrem os offsets de 1/4, quebra de palavras, preservação
progressiva das fases, limites de texto, mapas incompatíveis, campos não
editados, setas de uniformes e o tile de dígito que era sobrescrito. A
conferência adicional usa a ROM Plus real e o projeto recebido, no emulador.
O build das fases textuais não apresenta textos pendentes nem bytes sem fase.
As camadas personalizadas da Tela Inicial continuam usando a conversão gráfica
já enviada pelo Editor; suas imagens não foram substituídas.
