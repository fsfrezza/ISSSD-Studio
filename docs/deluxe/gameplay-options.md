# Opções de jogabilidade Deluxe

`changes.improvements` aceita `low-goal-kick`, `backpass`, `penalty-interference` e
`controller-one-codes`, `one-minute` e `final-attack`, independentes,
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

Horário, bateria e correção do replay de pênalti continuam pendentes.


## Um minuto e espera do último ataque

A duração utiliza o índice 3, preservando os índices 0/1/2 de três, cinco e
sete minutos. As opções nativas passam a quatro, o texto de duração mostra
1/3/5/7 e o cursor recebe o mapeamento e espaçamento correspondentes.
As duas leituras do cronômetro usam o mesmo mecanismo da Plus: índice 3
retorna 0100 no período normal e 0030 na prorrogação. Os demais índices leem
as tabelas originais, sem alterações. O helper de tempo foi movido de A4:E180
para A4:FF80 porque E180 pertence às tabelas das equipes expandidas.

O último ataque reutiliza o mecanismo completo da Plus: filtro de estados da
bola e reinício, controle do apito e contador auxiliar. A entrada 86:DBC0 é
redirecionada para 86:CC00, dentro da reserva nativa CB9E..D1FF. A posição
86:F700 da Plus colide com os loaders de nomes compactos da estrutura GG.
Os helpers adicionais ficam em 80:F900 e A4:FF00, sem alterar as tabelas de
equipes. O comportamento é o mecanismo da Plus, não uma regra nova baseada
em uma estimativa de posição em JavaScript.

Validação: 92 testes com fixtures reais, incluindo as quatro durações,
prorrogação, posição do cursor, estados protegidos da bola, encerramento,
ativação/desativação e exportação das seis opções junto ao projeto GG.
No Snes9x, o menu exibiu 1/3/5/7, a escolha de 1 minuto gravou 1F88=3, e
uma partida GG carregou 1E5A=3 com relógio abaixo de 01:00 (00:56 na amostra).
No caso controlado de tempo zerado, a ação protegida da bola 3 foi mantida
por 120 frames sem evento de encerramento; após a liberação para ação 1,
o evento 6 ocorreu em 60 frames. Os estados foram preparados em WRAM;
não se trata de uma partida inteira com todas as trajetórias possíveis.

O bug do replay não foi marcado como corrigido: a rotina de replay e o
caminho de captura manual foram inspecionados, mas ainda é necessário
reproduzir a defesa indevida para selecionar e validar o ponto de bloqueio.
