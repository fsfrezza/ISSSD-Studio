# Permitir escolher a cor do número da camisa

Estado: patch opcional experimental, exportável; falta homologação visual em emulador.

## Mapeamento confirmado na Deluxe USA

- Banco 98, E5D4..F033 (PC C65D4..C7033): 83 tiles 4bpp, todos os pixels
  opacos usam índice 12. O último tile F014 é o sentinela vazio.
- A tabela 81:CEDE seleciona origens para os objetos gráficos; a rotina
  84:E7D0..E83F calcula a origem do DMA. O hook existente em 84:E816
  preserva o banco nativo para números e redireciona desenhos de uniforme.
- As paletas dos jogadores carregadas pelo trecho 8B:CFBB..D0A4 usam
  registros diferentes para as duas equipes e combinações de pele.
- O índice 12 também aparece nos sprites do uniforme. Alterá-lo diretamente
  não é uma cor independente, portanto o seletor dedicado antigo foi retirado.
- O novo codec permite remapear todos os tiles, preservando geometria e
  transparência, para qualquer índice opaco de 1 a 15. Não altera a entrada.

## Patch experimental

O disassembly identifica 81:E7D8 como tabela de paletas das bandeiras e
dos números. A4:920B carrega os números das duas equipes com destinos
44/46, correspondentes aos espelhos WRAM 7E:2D98/2DB8 (CGRAM CC/DC).
O carregador de bandeiras do campo usa outros destinos (3C/3E);
os goleiros usam os índices 1–11 das paletas 4/5.
O hook em A4:9225 preserva a chamada original e substitui somente os
dois primeiros words dos registros de números. O bit 8 de 0DA4/0EA4
seleciona o uniforme reserva, como na rotina original de uniformes.

Tabela: PC 24E000; rotina: PC 24E200. Valores BGR555 por slot e uniforme;
FFFF significa manter a cor nativa. Nenhum tile é regravado.
O patch exige 4 MB quando há uma cor personalizada.
O projeto guarda as escolhas em `changes.shirtNumberColors`, preservadas
mesmo quando a melhoria está desmarcada.

Teste pendente em emulador: partida nos dois lados, troca de uniformes,
replay, árbitros, goleiros e demais efeitos; confirmar ausência de
alterações visuais em outras telas que compartilham a rotina.
