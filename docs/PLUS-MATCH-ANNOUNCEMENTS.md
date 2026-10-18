# Avisos durante a partida — Deluxe Plus

Os 17 avisos de `DATA_8BE7D2` foram reconstruídos a partir dos descritores, mapas de tiles e letras da ROM Plus imutável. A tabela PC `5E7D2` mantém seus ponteiros originais; cada lista em `5E7F6..5E944` conserva sua capacidade e termina com `FFFF`. Não se trata dos textos das opções de regras nem das vozes do narrador.

| Inglês | Português do projeto |
| --- | --- |
| GOAL | GOL! |
| FOUL | FALTA |
| OWN GOAL | GOL CONTRA |
| YELLOW CARD | CARTÃO AMARELO |
| RED CARD | CARTÃO VERMELHO |
| CORNER KICK | ESCANTEIO |
| OFF SIDE | IMPEDIMENTO |
| PENALTY KICK | PÊNALTI |
| TIME UP | FIM DE JOGO |
| FREE KICK | TIRO LIVRE |
| GOAL KICK | TIRO DE META |
| HALF TIME | INTERVALO |
| THROW IN | LATERAL |
| 1P WIN | 1P VENCEU |
| 2P WIN | 2P VENCEU |
| WIN | VITÓRIA |
| LOSE | DERROTA |

AMARELO, VERMELHO e IMPEDIDO são alternativas autorizadas para limitações de espaço. As três inscrições completas cabem na combinação canônica e foram mantidas. O renderizador tenta o menor número de alternativas somente se o conjunto completo exceder um orçamento nativo; texto livre inválido nunca é cortado.

## Editor e projeto

A aba **Avisos durante a partida** contém os 17 campos, os originais e o botão de português. Seu estado é `additionalScreenTextsV1.values['match-announcements']`; rascunhos continuam separados. O projeto canônico traz todas as traduções confirmadas. Abrir o projeto mantém a ROM-base imutável; Salvar ROM aplica o estágio na fase **10 — Textos durante a partida**. Desmarcar a fase preserva os avisos nativos nas demais ROMs.

## Gravação nativa

- Os quatro mapas baixo/alto originais PC `116D81`, `116E18`, `116E5A`, `117057` são validados e preservados. Os novos streams ocupam a reserva verificada PC `184400..184800`; os ponteiros com flag Map32 em `12038 + 6*i` são atualizados. Os tamanhos descomprimidos continuam 240, 240, 656 e 656. Os templates não ultrapassam WRAM `7FC000..7FC720`.
- As frases compartilham até 41 blocos de 32×32. Blocos idênticos são deduplicados; sua ordem pode mudar para satisfazer também as capacidades comprimidas. Os descritores são repontados junto com os blocos.
- O novo alfabeto dos avisos ocupa até 96 tiles 2bpp (VRAM byte `BA00..BFFF`). O gráfico fica na reserva expandida PC `3E0000..3E0600` (CPU `FC8000`). Os quatro descritores DMA originais PC `1271F3`, `127200`, `12720D`, `12721A` passam a transferir 384 bytes cada. A região não sobrepõe a infraestrutura tática nem a Tela Inicial.
- Os demais avisos passam de 24 para 32 pixels de altura, com corpo de até 28 pixels. Tiles 8×8 idênticos são compartilhados para manter o alfabeto nos mesmos 96 tiles; os acentos continuam preservados.
- **GOL!** usa desenhos maiores e o espaço gráfico original PC `CF5C3..CFA63`. Mantém a animação, paletas, faixa e informações de jogador do handler nativo.
- Assinaturas de mapas, ponteiros e DMA são verificadas antes da primeira escrita. A compressão, fonte e largura são validadas sem truncamento.

## Conferência

Os 17 eventos foram capturados dentro de uma partida no Snes9x 2005, ativando os estados de evento do handler nativo em WRAM para cobrir inclusive cartões, resultados e intervalos sem depender de partidas completas. Isso testa a renderização real, mas não substitui jogar partidas completas para exercitar cada gatilho pelas regras.

GOL!, cartões completos com acentos, IMPEDIMENTO e todos os demais avisos apareceram inteiros. Os nomes dos times usam a fonte intermediária e Brasil × Inglaterra foi conferido na apresentação. Os textos menores adicionais, como o contador GOALS junto ao nome do artilheiro, não fazem parte deste conjunto de 17 avisos.

## Estatísticas e histórico de gols

A seção **Estatísticas e histórico de gols**, na mesma aba, traz CHUTES, FALTAS, ESCANTEIOS, PÊNALTIS, CARTÕES AMARELOS, CARTÕES VERMELHOS, IMPEDIMENTOS, GOL CONTRA, 1T e 2T. O Editor preserva acentos no projeto; esta fonte compacta normaliza os acentos na ROM. As inscrições maiores usam duas linhas, sem cortes.

Os sete descritores PC `F1EB..F285` mantêm as capacidades, posições dos contadores e terminadores. A rotina nativa de gol contra conserva seus opcodes e destinos de escrita, alterando somente os operandos dos tiles. Os períodos ocupam os três tiles originais em `E865` e `E86D`; `1T`/`2T` deixam espaço para o relógio.

A tabela privada de fontes fica na reserva PC `17B60..17B72` (banco 82). Somente o caller do intervalo/final em `5A35C` passa a usá-la. Ela mantém o carregamento original dos números e acrescenta fontes nas faixas livres D0..FC e 1B3..1FF. Os dois streams ficam em `184800..185000`. Os números do placar, nomes dos jogadores e fonte comum permanecem intactos. Todas as reservas são verificadas antes da primeira escrita. A fase 10 controla ambos os novos conjuntos.

A renderização foi conferida no Snes9x 2005 no handler nativo das estatísticas com registros de gols preparados em WRAM para cobrir gol contra e os dois períodos; isso não equivale a jogar uma partida completa.
