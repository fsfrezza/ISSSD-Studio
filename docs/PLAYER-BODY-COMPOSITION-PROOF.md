# Composição de corpo e cabeça — prova experimental

Esta prova é separada do Editor e da exportação normal. Não migra projetos,
não muda os tipos 0–15 do produto e não declara implementado um tipo 16.
O visual original permanece disponível no caminho nativo de cabelo 0.

## Gerar e testar no Windows

```powershell
npm run body:proof -- --rom "roms\International Superstar Soccer Deluxe Plus.sfc"
```

Saída em `scratch/player-body-proof/`:

- `prova-corpo.sfc`: ROM experimental de 4 MB, com base Plus original,
  sem aplicar traduções ou outras edições de um projeto.
- `editar-prova.html`: abra localmente no navegador. Mostra o corpo inteiro;
  permite desenhar a cabeça com lápis, apagar, desfazer e baixar o JSON.
- `cabecas.json`: os dois desenhos de cabeça desta pose.
- `relatorio.json`: hashes, equipe, jogadores alterados e escopo.

No emulador, escolha Brasil (ID 30) e observe os jogadores de linha correndo
**de costas, no primeiro quadro da animação**. Pause e avance quadro a quadro.
Os dez jogadores de linha alternam Careca/14 e Cascão/15: a prova não depende
somente dos três objetos nativos de cabelo especial. Goleiro e adversário
mantêm seus atributos. `--team 0` permite escolher outra equipe pelo ID nativo.

**Somente Up_Running1 foi composto.** Nas demais poses, os jogadores 14/15
voltam ao corpo original e os cabelos extras 14/15 ficam desativados nesta
ROM experimental. Alternar o visual entre os quadros é uma limitação esperada
da prova. Não use essa ROM como substituta do projeto de trabalho.

Após editar no HTML, baixe o JSON e regenere:

```powershell
npm run body:proof -- --rom "roms\International Superstar Soccer Deluxe Plus.sfc" --heads "C:\caminho\cabecas.json"
```

O JSON preserva ambos os desenhos. O HTML não grava o projeto `.issdproj`.
A importação de corpo/cabeça no Editor principal será uma etapa posterior.

## O que a prova implementa

- Corpo de `DATA_968000`, PC `0xB0000`, montado em 16 × 48 pixels.
- Dois blocos DMA nativos de 192 bytes, com os dois cabeçalhos preservados.
- Substituição completa da região da cabeça, incluindo transparência: o
  cabelo embutido deixa de aparecer por baixo da nova cabeça.
- Retângulo da cabeça x=4..11, y=0..6. A nuca na linha 7 fica preservada.
  O tile dos PNGs 14/15 começa em (5,1) no corpo desta pose. A conversão
  o desloca uma coluna e uma linha dentro do retângulo da prova em (4,0),
  preservando os pixels originais onde a sobreposição é transparente.
  Ele deve caber nas seis primeiras linhas e sete primeiras colunas.
  Esta calibração não deve ser generalizada automaticamente para outras poses.
- Variantes pré-compostas na expansão: PC `0x3F1000` e `0x3F1200`.
- Seleção da origem dos dados no momento em que o motor enfileira o DMA,
  consultando a escalação atual e o registro de aparência do jogador.
- Mesmos bytes por transferência, mesmos objetos OAM de corpo e mesma área
  de VRAM; não compõe pixels durante a partida, somente escolhe um ponteiro.
- PHP/PHX/PHY e restauração de registradores e flags dos leitores substituídos.
- Leitura dos dois lados e dos reservas após substituições; proteção contra
  índices inválidos, outros objetos e outras poses.
- Supressão de 14/15 na alocação dos objetos de cabelo, preservando 1–13.
  Os limites nativos de 1–13 não foram removidos.
- Validação integral de hooks e espaço livre antes de escrever, permitindo
  repetir a mesma instalação de forma idempotente.

Hooks: PC `0x266FB`, `0x26706`, `0x1C930`, `0x1CAFE`.
Código auxiliar: PC `0x3F0000`, `0x3F0200`, `0x3F0400`.
A instalação exige os leitores da Plus verificados e a CLI exige o hash
canônico da ROM de 2 MB. A base original é somente lida.

## Verificação e próximos critérios

Os testes executam as instruções emitidas dos auxiliares em um interpretador
65816 restrito, com pilha por bytes e acesso à WRAM: conferem ambos os lados,
os onze lugares em campo, identidades dos reservas, cabelos e carry inicial.
Também conferem os dados DMA, a preservação do uniforme e falhas atômicas.
Esse interpretador não simula NMI, PPU ou o tempo de DMA.

A prévia estática foi inspecionada. Falta confirmar em emulador o alinhamento,
transições, substituições e ausência de artefatos. Depois dessa confirmação:
mapear âncoras OAM por pose, ampliar para uma animação completa, definir a
nova tabela de aparências, preservar o antigo tipo 0 em um identificador
semântico próprio e integrar desenhos e escolhas ao `.issdproj` e ao Editor.
