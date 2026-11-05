# Análise defensiva do tiro livre por recuo — 2026-10-30

Esta etapa não altera código, ROM, geometria ou interface. Fonte: disassembly
Yoshifanatic Routine_Macros_ISSD.asm e bytes da Plus original conferidos em
A4:DD57, 84:E482, 84:E4A7, 84:E53C, 84:AF7C e A4:E0B3.

Foram executados no Snes9x 120 cenários preparados (dois gols × seis distâncias
× cinco deslocamentos laterais × dois tipos de cobrador) e 36 verificações até
a ação de cobrança pronta 0460/0468/0470. Usou-se a ROM completa gerada pelo
Editor no teste de integração da v2. Posições iniciais e origem do recuo foram
preparadas em WRAM/SRAM; não são 120 sequências manuais de passe/captura.
A posição efetiva da bola na falta, após seu deslocamento nativo na mão do
goleiro, foi registrada: não confundir a distância inicial solicitada com a
coordenada efetiva. A marca do pênalti está a 0100 unidades da linha do gol.

## Resultados

- A seleção de jogador de linha ou goleiro como cobrador produziu os mesmos
  destinos da defesa nas 60 combinações geométricas comparadas.
- 592 destinos de jogadores da barreira: nenhum atrás da linha de fundo.
- 176 posições efetivas de membros da barreira verificadas quando o cobrador
  estava pronto: nenhuma atrás da linha de fundo.
- Em cada lado, 8 das 30 geometrias tiveram todos os centros da barreira fora
  da abertura entre os postes na preparação. Isso descreve esta grade de
  diagnóstico, não uma estimativa de frequência em partidas.
- Os 36 cobradores chegaram à ação de cobrança. Em seis casos o goleiro
  defensor estava ligeiramente além da linha (até 13 unidades), embora seu
  destino fosse legal. Há tolerância de chegada separada da barreira.

Exemplos quando o goleiro adversário era cobrador, gol esquerdo. Unidade de
coordenada interna, não pixel/metragem. Postes: deslocamentos -48 e +48 em
relação ao centro. A tabela usa as posições efetivas quando a cobrança ficou
pronta, sem inferir colisão/alcance de defesa a partir dos centros dos sprites.

| Distância efetiva da bola à linha | Lateral da bola | Centros da barreira no eixo lateral | Goleiro defensor (profundidade; lateral) |
|---|---:|---|---|
| 21 | -1 | -15 a +38, seis jogadores | 16; 0 |
| 21 | +79 | -78 a -67, três jogadores | 16; +20 |
| 21 | +159 | -3 a +3, três jogadores | 15; -5 |
| 133 | -1 | -15 a +38, seis jogadores | -13; +1 |
| 133 | +79 | -19 a +20, cinco jogadores | 30; +31 |
| 255 | +159 | +48 a +85, cinco jogadores | 15; +27 |

## Causa geométrica

A4:DD57 calcula ângulo 11EC, centro 11F8/11FC a uma distância nativa 00A0 da
bola e quantidade de membros 11F6. 84:E4A7 espalha os membros numa direção
perpendicular ao vetor bola/gol. A v2 limita a profundidade dos destinos,
mas mantém a coordenada lateral obtida para a barreira afastada: o ponto pode
ter ultrapassado lateralmente a boca do gol. Para ângulos quase laterais, a
projeção perpendicular restante fica muito estreita depois de achatar a
profundidade na linha. Três jogadores ficaram em apenas seis unidades.

O goleiro tem rank 68 zero e segue outro ramo, 84:E482/84:E53C, com tabelas
81:CC56/81:CC78 e seus próprios destinos/movimentação. Não se deduz seu destino
como complemento da cobertura efetiva da barreira. Nos ângulos extremos ele
pode buscar o lado oposto ao da bola. A tolerância de chegada pode levá-lo
além da linha mesmo com destino na linha. O hook 84:AF84 protege a chegada dos
membros da barreira, não é uma proteção universal para goleiros.

O limite solicitado foi preservado: distância 255 força a barreira à linha;
256 usa a formação nativa. A passagem pode ser visualmente abrupta e deve ter
regressão própria. A nova análise não relaxa esse limite.

## Requisitos para a próxima correção

1. Manter a profundidade na linha no caso de curta distância, tanto no destino
   quanto na posição de chegada.
2. Recalcular a distribuição lateral usando bola, ambos os postes e a abertura
   angular do gol; não reaproveitar apenas a lateral da barreira afastada.
3. Preservar espaçamento físico entre membros, em vez de permitir sobreposição
   da projeção lateral em ângulos extremos.
4. Coordenar a faixa coberta pela barreira com o destino do goleiro defensor.
5. Proteger a posição efetiva do goleiro contra ultrapassar a linha.
6. Separar preparação, chegada, cobrança e retomada. O goleiro cobrador deve
   manter sua função de batedor; o goleiro defensor protege o gol atacado.
7. Usar como controles faltas normais, pênaltis, bola antes/no/depois do limite,
   espelhamento dos gols, laterais positivos/negativos e ambos os tipos de
   batedor. Casos já coerentes não devem ser modificados por aproximação global.

## Tela de substituições

Os anexos mostram fragmentos de textos/objetos em posições erradas. O relato
com e sem habilitar goleiro batedor impede atribuir a falha somente à permissão
de selecionar o goleiro. A análise estática identifica o cache OAM/fontes e a
restauração dos objetos compartilhados com nomes grandes como caminho de
investigação: 57D2..5846, relocação 5EB2 e quatro planos. Isso é hipótese, não
uma causa binária isolada. Os testes de cache existentes não substituem uma
captura da ROM/projeto exatos do usuário nessa tela. Não foi aplicada uma
correção visual por suposição nesta etapa.
