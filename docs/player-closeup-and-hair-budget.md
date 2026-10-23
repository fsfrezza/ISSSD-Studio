# Aparência no telão e orçamento de cabelos

A ROM usa três objetos de sobreposição de cabeça por equipe durante a partida.
Aumentar apenas o contador invade os objetos seguintes. O tamanho da ROM não
resolve a falta de objetos e das respectivas reservas de VRAM.

Os estilos 0 (Careca), 14 (original) e 15 (Cascão) agora usam o corpo diretamente,
sem consumir esses objetos. O estilo 15 tem uma tabela de corpos por pose em
PC 2D0000–2D7FFF; seus dados compartilham a reserva 308600–3DBFFF com os corpos
originais. A seleção acompanha a escalação e as substituições. Os tipos 1–13
continuam limitados a três titulares com sobreposição por equipe.

O telão de comemoração de três gols usa desenho e paleta próprios. O estágio
04d-player-closeup mantém as partes nativas do corpo e gera a paleta de cabelo
e pele por equipe e posição atual no elenco. Não altera a paleta do uniforme.
Os estilos nativos conservam seus desenhos grandes; Careca e Cascão usam uma
cabeça regenerada. Alterações manuais usam a vista diagonal (quadro 3) como
referência para o desenho grande. Isso é uma adaptação de pixel art, não uma
cópia de todos os 24 quadros pequenos. O cabelo original 14 mantém os oito tiles
originais da cabeça quando essa vista não foi editada.

Reservas: paletas 2B8000–2C7FFF; estilos 2C8000; cabeças 2C9000; helper 2CA000.
A leitura converte o identificador nativo da equipe (teamId × 2) e considera
lado e jogador atual, incluindo reservas. Outras
cenas cinematográficas mantêm seu comportamento nativo.

O menu de pausa possui texto próprio em Textos da partida: RETOMAR. A opção
REPLAY conserva os tiles originais. A tabela longa e os novos tiles da opção
RETOMAR ficam em reservas separadas; o cursor mantém seu envio nativo.
