# Treinos, avisos e apresentações

Os campos novos ficam nas abas Treinamento, Desafio, Senha, Competições e Cenários. O catálogo compartilhado fornece as sugestões portuguesas; o projeto canônico já confirma esses valores. Rascunhos e fases desmarcadas continuam sem produzir gravações.

## Avisos da partida

As letras comuns usam células de 16×32 e o GOL! usa 32×32. A altura e a posição vertical foram conservadas. O alfabeto comum continua dentro dos 96 tiles de VRAM; cada caractere utiliza um bloco nativo de quatro colunas, com as duas colunas finais vazias. As transferências seguintes substituem essas colunas, da esquerda para a direita, sem apagar letras já desenhadas. Isso permite compartilhar 25 blocos, sem ampliar os mapas em 7FC200..7FC720.

O leitor 8BB703 passa a consultar uma tabela no banco FC, na reserva PC 3E3400..3E3C00. Há 18 ponteiros: 17 avisos e o terminador usado pelo caminho que mostra somente o placar. Os descritores antigos e a infraestrutura de táticas Plus em 5FDD0 ficam intactos. CARTÃO VERMELHO usa a alternativa aprovada VERMELHO quando sua largura completa excede 224 pixels; as demais inscrições portuguesas completas cabem.

## Treino e desafio

Os scripts de HUD em 81E511..81E59F usam dois alfabetos nativos de 16 pixels e um alfabeto pequeno de oito pixels. Os novos scripts são alocados na lacuna verificada PC F9B3..FA49, e todas as referências de código são repontadas juntas. O tempo e a lógica de pontuação permanecem nativos.

| Inglês | Português |
| --- | --- |
| TRAINING / TRAINING START | TREINO / INICIAR TREINO |
| CHALLENGE START | INICIAR DESAFIO |
| START / CLEAR / MISS | INÍCIO / ACERTO / ERRO |
| TIME UP | FIM DO TEMPO |
| TIME / BONUS TIME / BONUS CHANCE | TEMPO / BÔNUS / BÔNUS |
| CORNER KICK / FREE KICK | ESCANTEIO / FALTA |
| BEST TIME / BEST SCORE / LV. | TEMPO / PONTOS / N. |

O atlas AEBCA4 recebe retângulos independentes para as modalidades e os recordes, mantendo os 38 tiles originais. O fluxo expandido ocupa a reserva PC 176500; seus descritores deixam de depender de sufixos ingleses compartilhados.

Os nomes grandes preservam os últimos 32 tiles do atlas original. Seus caches persistentes passam a 7E5FF8/7E5FFA, fora da página 0F00 usada por objetos dos menus. A cópia de planos só aceita as bases 5280 e 5A00. Valores de RAM não inicializada são descartados.

## Senha, competições e cenários

O cabeçalho DIGITE SENHA usa os glifos nativos e mantém as duas linhas do mapa AAF469. As apresentações MEGACOPA, CAMPEONATO e as duas temporadas recompõem os glifos e o reflexo do atlas A6E80A. Os tiles originais permanecem no começo do atlas para preservar outras apresentações. A fonte ampliada é carregada em PC 185000, e os três mapas usam reservas verificadas no banco AE.

TIME REMAINING é uma legenda gráfica sobreposta à segunda linha dos cenários. Como a descrição portuguesa já informa o tempo, o padrão novo deixa essa legenda vazia. O campo continua editável: vazio a oculta; até cinco letras mostram uma legenda pequena; restaurar o inglês conserva o original. As descrições completas não são encurtadas.

Os escritores validam fontes, mapas, carregadores e reservas antes de aplicar os bytes. Intervalos novos têm classificação explícita nas fases Pré-Partida e Textos durante a partida.

## Conferência

Validação local: 512 testes e auditoria do HTML final. No Snes9x 2005 foram conferidos os menus de treino e desafio, modalidades e recordes, o cabeçalho da senha, os cenários e a apresentação da primeira temporada. INICIO foi acionado pelo estado nativo do desafio; CARTÃO AMARELO e GOL! pelo estado nativo de avisos de uma partida. Essas provas exercitam os leitores, carregadores e transferências reais, sem substituir o renderizador do jogo. Não equivalem a completar todas as modalidades ou temporadas.
