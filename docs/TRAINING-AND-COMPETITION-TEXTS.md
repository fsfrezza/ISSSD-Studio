# Treinos, avisos e apresentações

Os campos novos ficam nas abas Treinamento, Desafio, Senha, Competições e Cenários. O catálogo compartilhado fornece as sugestões portuguesas; o projeto canônico já confirma esses valores. Rascunhos e fases desmarcadas continuam sem produzir gravações.

## Avisos da partida

As letras comuns usam células de 16×32 e o GOL! usa 32×32. A altura e a posição vertical foram conservadas. O alfabeto comum continua dentro de 90 tiles de VRAM, em 5C80..5F50, fora das flags e nomes do placar; cada caractere utiliza um bloco nativo de quatro colunas, com as duas colunas finais vazias. As transferências seguintes substituem essas colunas, da esquerda para a direita, sem apagar letras já desenhadas. Isso permite compartilhar 25 blocos, sem ampliar os mapas em 7FC200..7FC720.

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

O atlas AEBCA4 recebe retângulos independentes para as modalidades e os recordes, mantendo os 38 tiles originais. O fluxo expandido ocupa a reserva PC 176500; seus descritores deixam de depender de sufixos ingleses compartilhados. FALTA, TEMPO e PONTOS usam os pixels do mesmo alfabeto nativo de DRIBLE e PASSE, extraídos de 9B8337. O TEMPO do relógio mantém a âncora 5B58; começar em 5B57 permitiria que a limpeza nativa de 5B56/5B57 apagasse o T.

Os nomes grandes preservam os últimos 32 tiles do atlas original. Seus caches persistentes passam a 7E5FF8/7E5FFA, fora da página 0F00 usada por objetos dos menus. Os planos dos nomes são recompostos de uma cópia derivada imutável na ROM, nas bases 5280 ou 5A00 conforme a tela.

## Senha, competições e cenários

O cabeçalho DIGITE SENHA usa os glifos nativos e mantém as duas linhas do mapa AAF469. As apresentações MEGACOPA, CAMPEONATO e as duas temporadas recompõem os glifos e o reflexo do atlas A6E80A. Os tiles originais permanecem no começo do atlas para preservar outras apresentações. A fonte ampliada é carregada em PC 185000, e os três mapas usam reservas verificadas no banco AE.

TIME REMAINING é uma legenda gráfica sobreposta à segunda linha dos cenários. Como a descrição portuguesa já informa o tempo, o padrão novo deixa essa legenda vazia. O campo continua editável: vazio a oculta; até cinco letras mostram uma legenda pequena; restaurar o inglês conserva o original. As descrições completas não são encurtadas.

Os escritores validam fontes, mapas, carregadores e reservas antes de aplicar os bytes. Intervalos novos têm classificação explícita nas fases Pré-Partida e Textos durante a partida.

## Conferência

Validação local: 521 testes e auditoria do HTML final. No Snes9x 2005 foram conferidos os menus de treino e desafio, modalidades e recordes, o cabeçalho da senha, os cenários e a apresentação da primeira temporada. INICIO foi acionado pelo estado nativo do desafio; CARTÃO AMARELO e GOL! pelo estado nativo de avisos de uma partida. Essas provas exercitam os leitores, carregadores e transferências reais, sem substituir o renderizador do jogo. Não equivalem a completar todas as modalidades ou temporadas.

### Retorno à seleção de estádio e ordem do seletor

Os menus seguintes ao estádio usam os mesmos intervalos de WRAM. Restaurar
apenas o nome ou reconhecer mais chamadores não preserva seus objetos. Agora
os nomes, cursores compartilhados e objetos do estádio têm cópias derivadas
imutáveis em ROM; cada contexto restaura seu conjunto antes de usá-lo.
A sequência estádio → Vantagem → menu pré-partida → Vantagem → estádio foi
conferida duas vezes no mesmo processo do emulador.

Quando o campo MODE contém MODO, somente os quatro posicionamentos do seletor
são alterados: MODO TREINO e MODO DESAFIO. As outras ocorrências de TRAINING e
MODE continuam independentes e nas posições originais.

ESCANTEIO usa redução de 8 para 6 colunas por célula. A redução cobre todas as
colunas da origem e prioriza a tinta branca sobre o contorno escuro, preservando
a diagonal de N sem escurecer as letras. A altura nativa permanece inalterada.

Os extremos direitos de Vantagem usam coluna 21 para o início de FORTE e
coluna 26 com alinhamento à direita para FRACO, acompanhando o 5 e o 1.

### Modalidades sem sufixo e botão da senha

As quatro escolhas são LIVRE, DEFESA, FALTA e GOLEIRO. Os campos FREE e KEEPER
aceitam até oito células e usam as reservas 87:FBA0/87:FBA8, com ponteiros e
comprimentos próprios. O script termina antes das quatro chamadas do sufixo
TRAINING; o seletor MODO TREINO permanece independente.

A aba Textos Senha inclui EXIT/SAIR. Somente o carregador da senha, PC 117D1,
usa a cópia privada da fonte em PC 187000. As células 3, 4 e 32 do stream
ADBAF9 formam EXIT; sua substituição mantém OK e os símbolos do teclado
intactos. Os demais carregadores continuam usando a fonte original.
