# Opções de jogabilidade Deluxe

`changes.improvements` aceita `low-goal-kick`, `backpass`, `penalty-interference` e
`controller-one-codes`, independentes,
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

## Controles: segunda integração

A correção de interferência copia os 26 bytes da Plus em 84:FFC0 e o hook
em 84:8073. Reexecuta o LDA/LSR deslocado, preservando carry e resultado.
O tratamento da entrada considera o botão Select e a situação de reinício.
Não modifica o replay nem suas rotinas.

Os códigos secretos usam o detector e as três tabelas nativas. Um adaptador
em 80:FA00, chamado pelo ponto original 80:84C2, combina temporariamente
as entradas de borda P1/P2. Preserva os dois valores de entrada, registradores,
flags e rotina nativa de desbloqueio. Ao contrário da troca simples P2→P1
presente na Plus, mantém suporte ao controle 2. Comandos simultâneos diferentes
nos dois controles não constituem uma sequência válida; faça cada código
normalmente em um controle.

Snes9x com os quatro patches e estrutura GG: os códigos de árbitro cachorro
(↑ ↑ ↓ ↓ ← → ← → B A) e equipes (R ↑ ↓ L X B ← A → Y) foram executados por
entradas de controle, separadamente nos controles 1 e 2. As quatro combinações
ativaram a flag nativa correspondente (7E:D854 ou 7E:D856 = 1).

Partida de um minuto, último ataque, horário e bateria continuam pendentes.
O minuto extra exige concluir a apresentação da quarta opção e sua leitura
pelas rotinas de partida; localizar seus bytes não basta para disponibilizá-lo.
