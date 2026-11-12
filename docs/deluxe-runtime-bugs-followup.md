# Correções verificadas no emulador — 2026-11-12

A ROM enviada como Deluxe-editado.smc mantinha os tiles de fotos idênticos à base original, diferindo do projeto convertido mais recente. O projeto atualizado mantém a composição já aplicada e recebeu os rodapés recuperados da ROM de teste (copyright 2026 e FREZZATECH GAMES), sem perder os demais dados.

## Menu que vazava nas outras telas

O writer reutilizado do Plus gravava a tipografia de prévia nos blocos 0xF58AB e 0x1169D0. Esses blocos são o wallpaper compartilhado pelos menus Deluxe. Os estados nativos dos botões já usam o OBJ de letras, o OAM e sua tabela de ponteiros. A gravação Deluxe passou a alterar somente esses três recursos; os dois recursos de fundo permanecem byte a byte originais. A prévia também é reconstruída a partir dos oito frames OBJ, em vez de depender da tipografia duplicada no BG.

Snes9x/libretro: emulação desde o reset até tipo de partida, controles, seleção dos dois times, estádio, vantagem e opções de partida. O menu continua traduzido e o wallpaper continua nativo nas telas seguintes. Não houve gravação de RAM nem avanço artificial de estado: somente comandos de controle. A fonte do projeto permanece em 95%.

## Texto solto na tela de título

Sprites excedentes do rodapé eram escondidos com Y=240, tratado pelo jogo como posição relativa e capaz de reaparecer por wrap. Agora usam o sentinela nativo 127. Os slots F4–FB da fonte ficam protegidos para PRESS START. Verificação visual com os rodapés personalizados de 2026, fotos migradas e PRESS START intacto; teste também confere os bytes desses glifos e o sentinela.

## Equipes e grupos

A estrutura passa a gerar nomes superiores independentes usando os glifos nativos 8×16 e os nomes das equipes do projeto. O novo Big OAM tem uma entrada por equipe e os consumidores apontam para suas entradas. As fontes existentes são mantidas; nomes extensos são abreviados para o espaço de 80 pixels. Uma representação 32×8 também é gerada para o loader Layer 3 nativo. Reservas guardadas: 0x365B0 para streams individuais (72 bytes por equipe), 0x37700/0x37730 para helpers e 0x37770 para bancos. Big OAM usa 0xDEA80 até 0xDF780; a reserva alternativa do mapa da faixa foi deslocada para 0xDF780–0xE0000, sem sobreposição.

Títulos de grupos personalizados usam oito códigos SmallMenuText no topo de seus registros 8×2; os títulos originais não editados preservam os gráficos originais. Reserva dos títulos: 0x3FC00–0x3FC90. Emulação confirmou BRASIL/INGLATERRA e AMERICA1/EUROPE1 nas páginas correspondentes do projeto. A grade do Editor usa três colunas por duas linhas sem os rótulos Vaga, preservando nomes acessíveis por aria-label.

## Novos textos traduzíveis

Os seis campos do submenu Tipo de partida foram acrescentados ao catálogo e aos presets. Escrita nas regiões originais, com comprimento/padding validados e sem modificar os bytes seguintes. Emulação confirmou AMISTOSO, LIGA CURTA, TORNEIO CURTO e Partida unica.

## Pendências explícitas

Nomes sob as bandeiras e bandeiras dos times adicionais ainda seguem as identidades visuais da equipe-base. NUMBER OF PLAYERS, WEAK/STRONG, GOALKEEPER SKILL, rótulos gráficos do menu de opções da partida, habilidades, uniformes e telas gráficas de competições/password ainda exigem mapeamentos próprios. Os textos nativos já catalogados continuam traduzidos; esse catálogo não representa todos os rótulos gráficos visíveis. As capturas de emulação confirmam essas pendências, não uma tradução integral. As 54 equipes e formações individuais ainda precisam de validação de jogo ampliada.
