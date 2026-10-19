# Avisos durante a partida — Deluxe Plus

Os 17 avisos de `DATA_8BE7D2` foram reconstruídos a partir dos descritores, mapas de tiles e letras da ROM Plus imutável. A tabela PC `5E7D2` mantém seus ponteiros originais. O leitor usa uma tabela privada no banco FC, em PC `3E3400..3E3C00`, para os descritores maiores, terminados por `FFFF`, e para o caso que mostra somente o placar. Não se trata dos textos das opções de regras nem das vozes do narrador.

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

AMARELO, VERMELHO e IMPEDIDO são alternativas autorizadas para limitações de espaço. Na fonte ampliada, CARTÃO AMARELO e IMPEDIMENTO cabem completos; CARTÃO VERMELHO usa VERMELHO quando excede 224 pixels. O renderizador tenta o menor número de alternativas somente se o conjunto completo exceder um orçamento nativo; texto livre inválido nunca é cortado.

## Editor e projeto

A aba **Avisos durante a partida** contém os 17 campos, os originais e o botão de português. Seu estado é `additionalScreenTextsV1.values['match-announcements']`; rascunhos continuam separados. O projeto canônico traz todas as traduções confirmadas. Abrir o projeto mantém a ROM-base imutável; Salvar ROM aplica o estágio na fase **10 — Textos durante a partida**. Desmarcar a fase preserva os avisos nativos nas demais ROMs.

## Gravação nativa

- Os quatro mapas baixo/alto originais PC `116D81`, `116E18`, `116E5A`, `117057` são validados e preservados. Os novos streams ocupam a reserva verificada PC `184400..184800`; os ponteiros com flag Map32 em `12038 + 6*i` são atualizados. Os tamanhos descomprimidos continuam 240, 240, 656 e 656. Os templates não ultrapassam WRAM `7FC000..7FC720`.
- As frases compartilham até 41 blocos de 32×32. Blocos idênticos são deduplicados; sua ordem pode mudar para satisfazer também as capacidades comprimidas. Os descritores são repontados junto com os blocos.
- O novo alfabeto dos avisos ocupa até 90 tiles 2bpp (VRAM word `5C80..5F50`, byte `B900..BEA0`). O gráfico fica na reserva expandida PC `3E0000..3E0600` (CPU `FC8000`). Os quatro descritores DMA originais PC `1271F3`, `127200`, `12720D`, `12721A` transferem 384, 384, 384 e 288 bytes. Os tiles `180..18F` são atualizados pelo placar e ficam fora da fonte; os nomes começam em `1EA` e também não são sobrescritos. A região não sobrepõe a infraestrutura tática nem a Tela Inicial.
- Os demais avisos passam de 24 para 32 pixels de altura, com corpo de até 28 pixels. Tiles 8×8 idênticos são compartilhados para manter o alfabeto nos 90 tiles disponíveis; os acentos continuam preservados.
- **GOL!** usa desenhos maiores e o espaço gráfico original PC `CF5C3..CFA63`. Mantém a animação, paletas, faixa e informações de jogador do handler nativo.
- Assinaturas de mapas, ponteiros e DMA são verificadas antes da primeira escrita. A compressão, fonte e largura são validadas sem truncamento.

## Conferência

Os 17 eventos foram capturados dentro de uma partida no Snes9x 2005, ativando os estados de evento do handler nativo em WRAM para cobrir inclusive cartões, resultados e intervalos sem depender de partidas completas. Isso testa a renderização real, mas não substitui jogar partidas completas para exercitar cada gatilho pelas regras.

GOL!, cartões completos com acentos, IMPEDIMENTO e todos os demais avisos apareceram inteiros. Os nomes dos times usam a fonte intermediária e Brasil × Inglaterra foi conferido na apresentação. Os textos menores adicionais, como o contador GOALS junto ao nome do artilheiro, não fazem parte deste conjunto de 17 avisos.

## Estatísticas e histórico de gols

A seção **Estatísticas e histórico de gols**, na mesma aba, traz CHUTES, FALTAS, ESCANTEIOS, PÊNALTIS, CARTÕES AMARELOS, CARTÕES VERMELHOS, IMPEDIMENTOS, GOL CONTRA, 1T e 2T. O Editor preserva acentos no projeto; esta fonte compacta normaliza os acentos na ROM. As inscrições maiores usam duas linhas, sem cortes. As letras vêm dos atlas nativos 9B8337/9B81FA, usados nos menus, em vez de um alfabeto redesenhado.

Os sete descritores PC `F1EB..F285` mantêm as capacidades, posições dos contadores e terminadores. A rotina nativa de gol contra conserva seus opcodes e destinos de escrita, alterando somente os operandos dos tiles. Os períodos ocupam os três tiles originais em `E865` e `E86D`; `1T`/`2T` deixam espaço para o relógio.

A tabela privada de fontes fica na reserva PC `17B60..17B77` (banco 82). Somente o caller do intervalo/final em `5A35C` passa a usá-la. Ela mantém o carregamento original dos números e acrescenta fontes em D0..FC, 190..19F, 1B3..1E9 e 1EE..1F9. O intervalo dos números 1A0..1B2 conserva os pixels originais; as faixas 180..18F, 1EA..1ED e 1FA..1FD não recebem transferências. Assim, flags e nomes dos dois times sobrevivem ao carregamento das estatísticas. Os três streams ficam em `184800..185000`. Os números do placar, nomes dos jogadores e fonte comum permanecem intactos. Todas as reservas são verificadas antes da primeira escrita. A fase 10 controla ambos os novos conjuntos.

A renderização foi conferida no Snes9x 2005 no handler nativo das estatísticas com registros de gols preparados em WRAM para cobrir gol contra e os dois períodos; isso não equivale a jogar uma partida completa.

A revisão de regressão conferiu CARTÃO AMARELO e GOL! no handler nativo, a volta à partida e a entrada nas estatísticas depois dos avisos. Durante CARTÃO AMARELO, os 90 tiles transferidos foram comparados com a fonte exportada: zero divergências. Os testes também interpretam os descritores DMA reais para verificar que nenhuma transferência toca os tiles de flags ou nomes.

### Correção do autor do gol e da largura de ESCANTEIOS

O leitor dos descritores traduzidos usa DB=$FC. Esse banco não espelha a RAM baixa, ao contrário do banco original $8B. A chamada final a `$80C932` agora passa por um invólucro que restaura DB=$8B durante a rotina nativa e retorna DB=$FC ao leitor. A rotina original continua montando o nome do autor e contando suas ocorrências no histórico da partida; seus gráficos e instruções permanecem intactos. Invólucro em PC `$3E3BE0`; chamada em `$5B72D`.

Nas estatísticas, ESCANTEIOS usa onze células (88 px) e mantém os dez glifos nativos de 8 px, centralizados, sem comprimir suas colunas. Apenas esse descritor passa para PC `$187400`, com invólucro em `$187440` e chamada em `$5A3C6`. O banco $B0 conserva o espelho de RAM exigido pelo decodificador. As posições dos números e as demais linhas permanecem iguais.

Validação no núcleo SNES: painel de estatísticas e aviso GOL! com nome do jogador e contador de dois gols. Testes executam os invólucros emitidos, verificam restauração de DB/pilha e comparam cada coluna dos glifos de ESCANTEIOS com a fonte nativa.
