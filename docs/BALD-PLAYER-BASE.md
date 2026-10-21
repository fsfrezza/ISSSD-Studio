# Base careca v1

O projeto usa `teamsV1.appearanceModel = "bald-base-v1"`.
O código 0 é careca; 14 recupera o cabelo original; 15 é Cascão.
A migração de projetos antigos troca 0/14 uma única vez, preserva os demais
atributos e guarda os desenhos antigos do 14 em `legacyBaldHeadDrawings`.
A ROM-base de 2 MiB é imutável.

## Gráficos

857 blocos de corpo e 929 descritores de pose estão mapeados. Sete descritores
sem sobreposição, incluindo giro e queda, também têm o cabelo removido no corpo.
O mapa gerado identifica 14908 pixels de cabelo; olhos identificáveis são
preservados. Apenas esses pixels podem mudar na preparação automática: corpo,
uniforme, DMA e dimensões permanecem iguais. Desenhos posteriores do usuário
têm prioridade, sujeitos ao formato nativo dos tiles.

Os corpos carecas ficam nos endereços nativos, após as edições de corpo do
projeto. As cópias com cabelo original ficam na expansão. O tipo 14 seleciona
essas cópias na transferência de gráficos, em vez de reservar um dos três
objetos extras de cabelo. Tipos 0, 1–13 e 15 usam os corpos carecas. A seleção
consulta o elenco atual e os dois lados, incluindo substituições.

PC 300000–307FFF: tabela de ponteiros indexada pelo descritor de pose.
PC 308000/308200: helpers de endereço/banco; 308400: filtro do cabelo 14.
PC 308600 em diante: corpos originais e variantes editadas, sem cruzar bancos
LoROM. O limite reservado é 3DC000, antes das áreas de textos em 3E0000.
Hooks: 0266FB, 026706, 01C930 e 01CAFE. Registradores X/Y, D, DB, largura e
flags relevantes são preservados; o retorno reproduz o LDA/AND substituído.
O DMA mantém o AND #00FF do banco nativo.

Se um PNG/quadro 14 difere da referência original, sua variante é recomposta
sobre o corpo careca. Transparência nunca restaura cabelo embutido antigo.
Sem edição, as cópias do 14 preservam exatamente os corpos originais de cada
pose, inclusive as poses sem uma sobreposição independente.

## Verificação

A suíte executa os bytes 65816 dos helpers para os dois lados, escalações,
substituições, tipos, carry/decimal flags e preservação de índices. Compara os
857 corpos e todas as entradas de ponteiro, testa transparência, migração,
colisões de espaço, fase desmarcada e ausência de alterações parciais.
A ROM Plus real também foi gerada e os pixels fora do cabelo foram comparados.
A prévia é estática; o teste visual no emulador ainda é necessário.
