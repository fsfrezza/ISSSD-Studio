# Aparência dos jogadores — Deluxe Plus

Em Jogadores → Editar aparência, a janela mostra os códigos 0–15 de cabelo,
as duas paletas individuais e as cores que a equipe realmente possui na ROM
carregada. As miniaturas usam Canvas com pixels sem interpolação, sem a antiga
imagem fixa de cabelos e sem a silhueta de uniforme que ignorava a escolha.

## Possibilidades nativas

- **Cabelo 0:** usa a cabeça já desenhada no sprite do corpo; não possui uma
  sobreposição independente. A interface indica isso explicitamente.
- **Cabelos 1–13:** treze sobreposições diferentes, cada uma com 24 tiles 8×8.
  A galeria compara o mesmo quadro em todos os tipos. A prévia mostra os 24
  quadros do tipo escolhido. Eles não são novos cabelos nem retratos das cenas
  aproximadas: são os gráficos pequenos existentes na ROM.
- **Paleta 0/1:** escolha individual do jogador. Os tons de pele, cabelo e
  calçado contidos em cada paleta são compartilhados pela equipe. A paleta 1
  pode ser idêntica à 0 em algumas equipes; a janela informa isso.
- **Quatro referências alternativas de pele:** clara, pálida, morena e escura,
  lidas dos blocos nativos. O catálogo é informativo: elas não são quatro
  escolhas independentes disponíveis a todo jogador. A paleta principal tem
  ainda os tons próprios da equipe.
- **Goleiro:** utiliza sua paleta própria em campo. A janela identifica quando
  as cores exibidas são referências dos jogadores de linha; não simula uma
  troca de cor do goleiro que o jogo não executa por esse seletor.

A edição das cores compartilhadas e dos uniformes fica para a próxima etapa.
Esta janela não publica alterações de uniformes, não transplanta gráficos e
não modifica os retratos das cenas aproximadas.

## Fontes verificadas na ROM Plus

O banco de cabelos é lido pelos 13 ponteiros de quatro bytes em PC `$ED6D`
(`DATA_81ED6D`); cada tipo aponta para 768 bytes no banco `$97`. Cada quadro
é um tile SNES de quatro planos, com 32 bytes. Não são blocos 16×16.

A paleta principal vem do operando do leitor em PC `$5CFD0`, cujo ponteiro
nativo Plus é `$828274`. Os leitores em `$5CFEA` e `$5CFFB` apontam para as
substituições de pele/calçado e cabelo da paleta 1. Os cinco tons substituídos
ocupam índices 2–6; o cabelo ocupa o índice 1. Zero no ponteiro preserva a cor
principal. O banco de paletas é `$89`; cada registro tem um tamanho de dois
bytes seguido das cores BGR555. Os quatro blocos de pele são `$898342`,
`$89834E`, `$89835A` e `$898366`. A tabela de goleiros tem leitor em `$5D06E`.
O leitor suporta ROMs com cabeçalho de copiador sem alterar os offsets PC.

## Projeto e geração da ROM

Aplicar guarda `teamsV1.teams[team].players[].custom.appearance` (`hair` e
`palette`) através do overlay semântico. A identificação usa `playerId` e
`baseSlot`, acompanhando o jogador quando ele muda de slot. Os campos iguais
à aparência original são removidos do override ao restaurar. Nomes, skills,
camisa, posição e tática não são regravados pela confirmação da janela.

O writer canônico existente materializa a aparência na fase Jogadores:
`hair` ocupa o nibble superior do sétimo byte de atributos; `palette` altera
somente o bit zero. Os demais bits e os outros seis bytes são preservados.
Não há nova seção de projeto nem migração obrigatória.

## Verificações

A suíte verifica todos os 13×24 tiles, as 32 combinações individuais de cabelo
com paleta, RGB BGR555, ponteiros, cabeçalhos, restauração e reabertura por
identidade. Também executa o setter do overlay no escopo privado do Editor e
confere que a injeção gerada substitui a arte antiga sem remover os IDs usados
pelos handlers legados. O teste local da janela com DOM cobre escolha de
cabelo/paleta, aplicação e próximo, reabertura e restauração, mantendo a ROM
inalterada. O baseline privado do Editor e a ROM não são incluídos no Git.

## Copiar e trocar entre jogadores

A janela permite escolher outra equipe e um jogador e executar três operações:
Copiar deste para o selecionado, Copiar do selecionado para este, ou Trocar
entre os dois. A lista usa os nomes atuais do projeto, inclusive jogadores
reordenados. As duas alterações da troca são preparadas antes de hidratar o
projeto, seguindo `team`, `playerId` e `baseSlot`. Nenhuma operação move o jogador
ou altera seus outros atributos. Selecionar a mesma identidade desativa os botões.

As operações usam os atributos já confirmados no projeto; rascunhos da janela
não são incluídos. A operação já é aplicada ao projeto em memória: Cancelar/Fechar
a janela não desfaz a transferência. Para persistir, salve o projeto; Salvar ROM
materializa os atributos pela fase Jogadores existente.

O que se copia/troca é **tipo de cabelo e índice de paleta 0/1**. A transferência
não copia blocos de cores compartilhados, uniformes, retratos ou a paleta própria
do goleiro. Entre times diferentes, o índice idêntico pode produzir outra cor.
Isso é mostrado junto aos controles, em vez de prometer uma cópia visual idêntica.

## Individualização das cores

Qualquer jogador já pode usar qualquer um dos códigos nativos de cabelo 0–13,
independentemente da equipe. As cores de pele/cabelo continuam pertencendo às
paletas compartilhadas da equipe; o atributo individual reserva só um bit para
selecionar 0/1. Separar os blocos compartilhados entre equipes permitiria editar
as cores de cada equipe sem alterar as demais, mas manteria duas combinações
por equipe no renderizador atual. Essa edição de cores não foi implementada.

Cores arbitrárias independentes para todos os jogadores não se obtêm acrescentando
campos ao projeto nem apenas expandindo a ROM: exigem novos dados e mudanças no
carregamento e uso das paletas pelo renderizador, com verificação dos limites de
paletas simultâneas, goleiros, poses, cenas aproximadas e replays. Isso permanece
uma investigação estrutural, não uma capacidade já oferecida pelo Editor.

## Tipos adicionais 14 e 15

O Editor oferece **14 · Careca (R. Carlos)** e **15 · Cascão (Ronaldo)**.
A primeira versão usa a silhueta dos 24 quadros nativos do tipo 13: mantém a
transparência e o contorno e substitui pixels escuros internos por pele. O
Cascão difere apenas pelo pequeno tufo no destaque frontal de pele. As cores
continuam vindo da paleta da equipe. Estes desenhos precisam de conferência
visual no emulador; não são alterações dos retratos de cenas aproximadas.

A escolha fica no mesmo `custom.appearance.hair`, agora aceitando 0–15. A fase
Jogadores instala os gráficos apenas quando um código novo é usado. A tabela
original de 13 ponteiros é copiada para PC `$3E8000` e recebe duas entradas; os
52 bytes originais permanecem iguais. Os gráficos novos ficam em `$3E8100` e
`$3E8400`, com 768 bytes cada. Dois helpers em `$3E8040`/`$3E8060` permitem
ler os ponteiros no banco expandido sem modificar a tabela seguinte em `$81EDA1`.
Os hooks substituem seis bytes em PC `$C7BC3` e `$C7BE0`, verificando os opcodes
originais antes de qualquer gravação. O tipo zero e os 13 tipos anteriores são
preservados. As regiões novas pertencem à fase cumulativa Jogadores.

**Limite nativo descoberto no disassembly:** `CODE_83CAD7` procura os jogadores
com cabelo especial e para após três por equipe, usando os objetos de
`DATA_81AF01`/`DATA_81AF07`. A expansão da tabela não aumenta esse espaço em
VRAM. Quando uma equipe usa um tipo novo, o gravador verifica os onze titulares
e recusa mais de três atributos de cabelo não zero nessa equipe. Escolhas em
reservas devem respeitar o mesmo limite quando forem movidas para titulares.
Aumentar esse limite é outra mudança estrutural e não foi realizado aqui.

Verificações: todos os 24 quadros de cada tipo, diferença restrita ao tufo,
preservação dos gráficos e ponteiros existentes, preflight atômico, instalação
idempotente, limite de titulares, execução dos helpers emitidos preservando X/Y,
exportação cumulativa selecionada e exclusão quando desmarcada. Uma geração
cumulativa também foi executada com a ROM Plus real de SHA-256
`ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a`,
sem regiões não classificadas e sem alteração da base. Não houve teste de jogo
em emulador nesta etapa.
