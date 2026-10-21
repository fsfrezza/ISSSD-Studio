# Cabelos editáveis

- `01-nativo.png` até `13-nativo.png`: as treze sobreposições originais da ROM Plus.
- `14-careca.png`: Careca (R. Carlos).
- `15-cascao.png`: Cascão (Ronaldo).
- `paleta.gpl`: cores de edição por índice.

Cada PNG tem **64 × 24 pixels**, formando **8 colunas × 3 linhas** de quadros
8 × 8. A ordem é da esquerda para a direita, de cima para baixo (1 a 24).
Amplie a visualização no seu programa, mas mantenha o tamanho real do arquivo.
Use lápis sem suavização; mantenha transparência e apenas as cores fornecidas.

As cores do arquivo representam índices: a cor vista no jogo depende da paleta
da equipe. Índice 0 é transparente; 1 é cabelo; 2–6 são tons de pele.

1. Edite os PNGs e salve nessa mesma pasta.
2. Reinicie o Editor: a construção da interface agora lê os PNGs diretamente.
3. Pare o servidor com Ctrl+C e execute `npm run serve:editor`.
4. No navegador: Ctrl+F5, reabra o projeto e salve novamente a ROM.

A exportação local da ROM relê os dois PNGs a cada pedido e confere seus pixels
na ROM final. Para uso fora do servidor, `npm run hair:import` atualiza o código compilado
`src/core/player-hair-manual.mjs`. A prévia e a geração da ROM usam os mesmos
quadros. Se houver erro de tamanho, cor ou transparência, nada é importado.

Os PNGs são os padrões locais do Editor. Desenhos feitos no editor de quadros
são guardados no projeto `.issdproj` e têm prioridade sobre esses padrões.
Use **Restaurar Careca e Cascão (24 quadros)** para retirar os desenhos antigos
do projeto e voltar aos PNGs atuais. As seleções de cabelo dos jogadores continuam.

Para reexportar as opções atuais, caso necessário:
`npm run hair:export -- "C:\caminho\International Superstar Soccer Deluxe Plus.sfc"`

A exportação recusa sobrescrever PNGs existentes. Use `--force` após o caminho
somente se quiser substituí-los. Preserve uma cópia das suas edições antes.

O limite nativo de três titulares com cabelo especial por equipe continua valendo.
Há referência do corpo completo no editor de quadros. Retratos em cenas
aproximadas continuam independentes.


## Tipos nativos

Os arquivos 01–13 foram extraídos sem alterar os índices dos pixels da ROM-base
Plus. Cada arquivo contém os 24 quadros na mesma disposição 64x24.
O Tipo 0 não possui uma sobreposição independente: ele é parte do sprite do corpo
e não está representado por uma folha vazia ou por um cabelo inventado.

Para extrair novamente apenas os tipos nativos, preservando 14/15:
`npm run hair:export:native -- "C:\caminho\International Superstar Soccer Deluxe Plus.sfc"`

A exportação recusa sobrescrever folhas existentes, a menos que receba `--force`.
A importação atual (`hair:import`) continua lendo somente os tipos 14 e 15.
Alterar os arquivos PNG 01–13 não importa esses desenhos automaticamente.
A edição dos tipos nativos no editor de quadros é salva no projeto e na ROM.


Para conferir uma ROM já exportada contra os PNGs atuais:
`npm run hair:verify -- "C:\caminho\Minha-ROM.sfc"`

O resultado informa quais tipos novos estão atribuídos a jogadores e quantos
quadros conferem exatamente. Uma diferença de pixels interrompe a verificação.
Isso confirma o conteúdo gráfico da ROM, não a composição final do jogo com o
sprite do corpo. O ZIP cumulativo inclui os hashes dos PNGs e a verificação em
`indice.json` (`playerHairAssets`).

## Careca e Cascão por pose

`poses-careca-cascao.json` registra as 24 poses e os desenhos desta revisão.
As máscaras usam a cabeça do corpo original como referência; não são uma
recoloração do cabelo 13. Os pontos preservam o corpo por transparência.
Careca substitui apenas os pixels do cabelo por pele, preservando olhos e rosto.
Cascão acrescenta dois ou três pixels na testa; em vistas de costas a mecha
fica oculta. A inversão vertical do quadro 24 é aplicada pelo jogo.
Os nomes das poses aparecem no seletor do Editor.
