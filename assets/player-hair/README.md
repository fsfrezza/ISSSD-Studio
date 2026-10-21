# Cabelos editáveis

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
2. No PowerShell, na pasta do Studio: `npm run hair:import`.
3. Pare o servidor com Ctrl+C e execute `npm run serve:editor`.
4. No navegador: Ctrl+F5, reabra o projeto e salve novamente a ROM.

A importação valida os dois PNGs antes de atualizar o código compilado
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
