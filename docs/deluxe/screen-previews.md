# Prévias das telas seguintes ao menu principal

As abas Tela de Open Game, Handicap, Menu pré-partida e Seleção de estádio reúnem seus campos e uma prévia estática de 256 × 224. O fundo é extraído da ROM; os painéis e a fonte são aproximações. A seleção da prévia não muda equipes, regras ou o estado salvo do jogo.

Os campos existentes continuam em `changes.menuTexts`, nas seções `game-type-native`, `handicap-native`, `match-options-native` e `stadium-native`. Os projetos anteriores abrem sem migração; essas seções deixam de aparecer duplicadas na aba Textos. Português, restauração e validação usam o mesmo catálogo que a exportação.

Handicap: CONDITION, WEAK, STRONG, NUMBER OF PLAYERS e GOALKEEPER SKILL são rótulos gráficos, gravados em `changes.handicapLabels`. A edição recompõe os tiles 2bpp dos streams `9E:F615` e `9E:F691`, mantendo o layout e os demais recursos. Os dois lados usam a mesma arte WEAK/STRONG. Textos maiores são ajustados a duas linhas quando aplicável; valores que não cabem são rejeitados. Se a compressão crescer, cada stream pode ser realocado em uma reserva verificada da ROM de 2 MB. Os presets e a restauração da aba incluem os cinco campos.

`changes.preMatchLabels` acrescenta doze rótulos gráficos nativos: cinco de preparação, cinco de ajustes, início do treino e início do desafio. A escrita adapta o módulo do Editor Plus e verifica o atlas original, a ordem dos rótulos, os cinco mapas e a capacidade dos blocos antes de alterar qualquer byte. A prévia mostra as dez opções do menu de preparação ou o rótulo de treino/desafio conforme a seleção. O texto nativo de início fica na seleção de estádio, onde aparece no jogo.

Quando a compressão de uma edição isolada excede o bloco original, os recursos são realocados para a reserva `0x17E800–0x180000`, depois da tabela máxima de atributos das 67 entradas de execução. Apenas os seis ponteiros de descritores nativos verificados são alterados. Reservas ocupadas e textos largos demais bloqueiam a exportação. A restauração reconstrói a ROM a partir da base original.
