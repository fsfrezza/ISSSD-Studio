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

- Os quatro mapas baixo/alto PC `116D81`, `116E18`, `116E5A`, `117057` continuam nos blocos comprimidos originais, com os tamanhos descomprimidos 240, 240, 656 e 656. Os templates não ultrapassam WRAM `7FC000..7FC720`.
- As frases compartilham até 41 blocos de 32×32. Blocos idênticos são deduplicados; sua ordem pode mudar para satisfazer também as capacidades comprimidas. Os descritores são repontados junto com os blocos.
- O novo alfabeto dos avisos ocupa até 96 tiles 2bpp (VRAM byte `BA00..BFFF`). O gráfico fica na reserva expandida PC `3E0000..3E0600` (CPU `FC8000`). Os quatro descritores DMA originais PC `1271F3`, `127200`, `12720D`, `12721A` passam a transferir 384 bytes cada. A região não sobrepõe a infraestrutura tática nem a Tela Inicial.
- **GOL!** usa desenhos maiores e o espaço gráfico original PC `CF5C3..CFA63`. Mantém a animação, paletas, faixa e informações de jogador do handler nativo.
- Assinaturas de mapas, ponteiros e DMA são verificadas antes da primeira escrita. A compressão, fonte e largura são validadas sem truncamento.

## Conferência

Os 17 eventos foram capturados dentro de uma partida no Snes9x 2005, ativando os estados de evento do handler nativo em WRAM para cobrir inclusive cartões, resultados e intervalos sem depender de partidas completas. Isso testa a renderização real, mas não substitui jogar partidas completas para exercitar cada gatilho pelas regras.

GOL!, cartões completos com acentos, IMPEDIMENTO e todos os demais avisos apareceram inteiros. Os nomes dos times usam a fonte intermediária e Brasil × Inglaterra foi conferido na apresentação. Os textos menores adicionais, como o contador GOALS junto ao nome do artilheiro, não fazem parte deste conjunto de 17 avisos.
