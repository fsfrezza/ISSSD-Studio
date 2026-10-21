# Aparência: base careca e cabelos

- **0 · Careca:** a cabeça está no corpo regenerado, sem sobreposição de pele.
- **1–13:** cabelos nativos.
- **14 · Cabelo original:** o cabelo que antes fazia parte do tipo 0.
- **15 · Cascão:** somente a pequena mecha na testa, sobre a base careca.

`14-original.png` e `15-cascao.png` têm 64 × 24 pixels: 8 colunas × 3 linhas,
com 24 quadros 8 × 8. Transparência deixa aparecer o corpo careca.
Os arquivos padrão 14/15 contêm apenas cabelo (índice 1); não pintam pele.
As cores no jogo seguem a paleta do jogador. Use lápis sem suavização e as cores
de `paleta.gpl`; índice 0 é transparente. Preserve dimensões e transparência.

`14-careca.png` é uma referência antiga, mantida para preservar edições locais.
**Esse arquivo não é mais importado.** Para editar o tipo 14 atual, use
`14-original.png`. Para editar a base careca, use os corpos no Editor de quadros.

## Editor

Jogadores → Editar aparência → Editor de quadros → Editar cabelos e corpo.
O corpo completo aparece ao lado do quadro editável. Os corpos são carregados
com a base careca. A borracha no cabelo revela essa base, sem revelar o cabelo
embutido antigo. Os 24 quadros têm nomes de direção e movimento.

Desenhos feitos no Editor são guardados no projeto e têm prioridade sobre os
PNGs locais. **Restaurar Original e Cascão (24 quadros)** remove os desenhos
salvos desses dois tipos e volta aos PNGs atuais; mantém as escolhas dos jogadores.
Salve o projeto e gere novamente a ROM.

Ao abrir um projeto antigo, a migração acontece uma única vez:
antigo 0 → 14; antigo Careca 14 → 0; Cascão 15 continua 15.
Desenhos antigos de pele do tipo 14 ficam preservados em um registro de migração,
sem serem reutilizados como cabelo. No tipo 15, a migração retém a mecha.

O tipo 14 recupera o corpo original sem usar objetos adicionais de cabelo.
Por isso todos os antigos jogadores do tipo 0 podem usá-lo. O limite de três
sobreposições por equipe continua para os tipos 1–13 e 15.

## Arquivos locais

A construção do Editor e cada exportação local da ROM leem os PNGs atuais.
Pare o servidor, execute `npm run serve:editor` e atualize com Ctrl+F5.
`npm run hair:import` atualiza `src/core/player-hair-manual.mjs` para usos fora
 desse servidor. A exportação confere os 24 quadros de cada tipo usado na ROM.

Os arquivos 01–13 são referências extraídas da Plus. Alterá-los no disco não os
importa automaticamente; edite esses tipos pelo Editor de quadros.
`npm run hair:export:native -- "caminho/Plus.sfc"` extrai os nativos.
`npm run hair:verify -- "caminho/ROM-exportada.sfc"` confere os tipos 14/15.

A geração offline `scripts/generate-bald-player-base.mjs` usa a Plus imutável
para registrar os pixels de cabelo dos 857 blocos de corpo. A ROM-base em disco
é preservada. No build, os corpos carecas e o seletor de corpos originais são
aplicados na fase Jogadores. Cenas aproximadas e retratos usam outros gráficos.
