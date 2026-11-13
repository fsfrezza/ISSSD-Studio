# Telas de abertura e mídia convertida

As abas Konami, International e We Love Soccer oferecem Original, Imagem e Vídeo convertido. Sem substituição, a ROM permanece byte a byte igual; o projeto não ganha campos vazios. `changes.openingMedia` armazena apenas telas substituídas, com os quadros já convertidos, paletas e tempos dos fades. Nenhum MP4 é executado diretamente pelo SNES.

Imagens mantêm a proporção dentro de 256 × 224, com bordas pretas quando necessário. O conversor usa paleta de até 16 cores por quadro, tiles 4bpp deduplicados e compressão Konami. Vídeos importam o trecho inicial de até cinco segundos, até trinta quadros por tela, seis fps alvo e até 84 quadros no conjunto. A quantidade da última importação é reduzida se as outras telas já ocuparem esse limite. O áudio do arquivo não é importado; músicas nativas não são substituídas.

O vídeo é experimental: a descompressão e a transferência para VRAM ocorrem com apagamento de tela, podendo produzir intervalos pretos. A velocidade efetiva varia com a complexidade dos quadros. Não é reprodução fluida de vídeo moderno. O navegador oferece reprodução dos quadros convertidos e dos fades; referências originais são imagens estáticas.

Fade-in/fade-out variam de zero a três segundos, em passos de 0,25 s. A permanência da imagem varia de 0,5 a dez segundos. A duração dos vídeos segue seus quadros; Start/Select avança. A importação valida a geração completa antes de substituir a mídia anterior no projeto.

O escritor amplia para 4 MiB, reserva código em `0x240000`, paletas e diretórios no mesmo banco e quadros entre `0x250000` e `0x3F8000`. Descritores do leitor nativo ficam em `0x17B80–0x18000`, preservando a tabela de estatísticas em `0x17B60`. Toda reserva e os três pontos de entrada nativos são verificados. Limites ou conflitos bloqueiam a exportação sem alterar o projeto original.

As etapas substituídas ignoram sua animação nativa e usam a nova mídia. As etapas originais seguintes recuperam a configuração gráfica nativa antes de continuar. A tela de título, grupos, GG secreto, jogadores e recursos visuais permanecem independentes. Testes no Snes9x cobriram três imagens em sequência, quadros de vídeo distintos, retomada da etapa original seguinte e chegada à tela de título.

As prévias pós-título usam as capturas fornecidas pelo usuário, com máscaras nas áreas dos campos editáveis. Brasil, Inglaterra e U.S.A. são exemplos fixos. Seleção de estádio e Anúncio da partida têm campos separados, mas continuam usando os mesmos caminhos de projeto. A fonte substituta possui glifos amostrados das capturas e aproximações para os demais caracteres.
