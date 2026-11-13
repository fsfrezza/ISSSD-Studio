# Opções de jogabilidade Deluxe

`changes.improvements` aceita `low-goal-kick` e `backpass`, independentes,
desmarcados por padrão. A aba Melhorias valida a geração antes de atualizar
o projeto. Reabrir mantém a seleção; desmarcar reconstrói a ROM original.
Nenhuma alteração de grupos, jogadores, fotos ou táticas é necessária.

## Origem e limites

- Tiro de meta: helper de 44 bytes copiado da Plus limpa (85:FEC0), com o
  mesmo hook em 85:EF47. Ambos os goleiros consultam o próprio controle;
  B seleciona a ação 0A, mantendo 0B nos demais casos. Não altera o batedor.
- Recuo: reutiliza integralmente `experimental-backpass-penalty.mjs` do
  Editor Plus. As assinaturas das rotinas foram conferidas na Deluxe USA.
  O adaptador aplica somente os hooks, código e tamanho da SRAM, sem trazer
  as rotinas de goleiro batedor. Mantém punição por pênalti, não tiro livre.
- O recuo exige expansão de ROM para 4 MB e SRAM para 8 KiB. O estado
  temporário fica em 70:1800; os primeiros 2 KiB de saves permanecem intactos.
  O tiro de meta isolado permanece em 2 MB.
- Gravações sobre áreas ocupadas são recusadas. O código de recuo em
  3FF000..3FFD00 fica depois da reserva máxima de mídias (3F8000).

## Validação

87 testes passaram com as ROMs reais, incluindo execução das instruções dos
hooks, exclusões (pés, cabeçada, adversário), controles dos dois goleiros,
reabertura/salvamento/exportação pela interface e preservação de equipes,
jogadores, imagens e táticas do projeto de 60 equipes com GG secreto.

Snes9x libretro, ROM Deluxe com ambos os patches e projeto GG: cenários
controlados preparados em WRAM/SRAM, não partidas completas por comandos.

- Goleiros 0500 e 1000, posse com mãos, ação 0608, contador 48 e origem
  proibida: evento 7F01 no frame 30 e transição de pênalti no frame 31.
  Após 600 frames, a tela de cobrança foi apresentada sem corrupção visível.
- Mesma preparação com origem de cabeçada (1A): nenhum evento ou pênalti.
- Tiro de meta, ação nativa 05D0, contador 1: entrada B (8000) no controle
  correspondente produz ação 0A; ausência de B produz 0B, nos dois goleiros.

A validação em outros emuladores e partidas completas continua útil; estes
resultados não afirmam eliminar todos os bugs de jogabilidade do jogo.
