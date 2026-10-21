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
da equipe. Índice 0 é transparente; 1 é cabelo; 2–5 são tons de pele.

1. Edite os PNGs e salve nessa mesma pasta.
2. Reinicie o Editor: a construção da interface agora lê os PNGs diretamente.
3. Pare o servidor com Ctrl+C e execute `npm run serve:editor`.
4. No navegador: Ctrl+F5, reabra o projeto e salve novamente a ROM.

A exportação local da ROM relê os dois PNGs a cada pedido e confere seus pixels
na ROM final. Para uso fora do servidor, `npm run hair:import` atualiza o código compilado
`src/core/player-hair-manual.mjs`. A prévia e a geração da ROM usam os mesmos
quadros. Se houver erro de tamanho, cor ou transparência, nada é importado.

Esses desenhos são arquivos locais do Editor, **não estão embutidos no projeto
.issdproj**. O projeto guarda a seleção do tipo de cabelo de cada jogador.
Para compartilhar ou versionar seu desenho, inclua os PNGs e o módulo compilado.

Para reexportar as opções atuais, caso necessário:
`npm run hair:export -- "C:\caminho\International Superstar Soccer Deluxe Plus.sfc"`

A exportação recusa sobrescrever PNGs existentes. Use `--force` após o caminho
somente se quiser substituí-los. Preserve uma cópia das suas edições antes.

O limite nativo de três titulares com cabelo especial por equipe continua valendo.
Não há prévia do corpo completo nem alteração de retratos em cenas aproximadas.


## Tipos nativos

Os arquivos 01–13 foram extraídos sem alterar os índices dos pixels da ROM-base
Plus. Cada arquivo contém os 24 quadros na mesma disposição 64x24.
O Tipo 0 não possui uma sobreposição independente: ele é parte do sprite do corpo
e não está representado por uma folha vazia ou por um cabelo inventado.

Para extrair novamente apenas os tipos nativos, preservando 14/15:
`npm run hair:export:native -- "C:\caminho\International Superstar Soccer Deluxe Plus.sfc"`

A exportação recusa sobrescrever folhas existentes, a menos que receba `--force`.
A importação atual (`hair:import`) continua lendo somente os tipos 14 e 15.
Os PNGs nativos são referências editáveis; alterar 01–13 ainda não altera esses
tipos na ROM. Para testar uma variante com o gravador atual, use-a em uma das
folhas 14/15, preservando uma cópia anterior.


Para conferir uma ROM já exportada contra os PNGs atuais:
`npm run hair:verify -- "C:\caminho\Minha-ROM.sfc"`

O resultado informa quais tipos novos estão atribuídos a jogadores e quantos
quadros conferem exatamente. Uma diferença de pixels interrompe a verificação.
Isso confirma o conteúdo gráfico da ROM, não a composição final do jogo com o
sprite do corpo. O ZIP cumulativo inclui os hashes dos PNGs e a verificação em
`indice.json` (`playerHairAssets`).
