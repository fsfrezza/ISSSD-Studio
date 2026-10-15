# Abertura semântica e exportação das telas de equipe

## Causas confirmadas

- A ponte legada declara `plusTacticalRecordForTeam` como `configurable: true`, mas sem `writable: true`. A atribuição em modo estrito interrompia a instalação do overlay antes da conexão de `studioTeamsV3ReadFull`. O modelo visual e o snapshot exportado podiam divergir. A instalação agora usa `Object.defineProperty`, mantendo a delegação ao leitor lexical.
- `window.rom` também é somente leitura. A atribuição externa usada para restaurar a base não substituía o buffer do núcleo. O reset agora passa por uma função definida no próprio escopo lexical.
- O wrapper v6.64, instalado no DOMContentLoaded, materializava textos depois do retorno da barreira semântica. Esse chamado automático foi removido. Os hooks visuais também deixaram de reaplicar fisicamente o projeto e o título interno.
- Rótulos `__pk590.native.*` e gráficos `controller.*` estavam persistidos, mas não tinham gravadores no pipeline do servidor. Agora são escritos em seus campos/bloco nativos. O controle mantém o atlas da ROM-base, o formato 2bpp, o orçamento comprimido e a validação de round-trip.
- O arquivo atual contém snapshots binários antigos de jogadores que conflitam entre banco principal e espelhos. Para equipes representadas em teamsV1 v3, esses snapshots deixam de concorrer com os dados semânticos. Campos ausentes continuam herdando a base. O arquivo de projeto não é regravado por essa filtragem.

## Fases cumulativas

A ordem 01–09 permanece. A seleção explícita da fase 04 também habilita o gravador nativo já existente para o menu confirmado; o build histórico sem seleção de fases mantém sua política anterior. Controles e campos de opções da partida pertencem à fase 05; rótulos e frases de estratégias à fase 06; nomes/atributos à fase 08; coordenadas à fase 09. Desmarcar uma fase impede sua aplicação às seguintes.

As frases de estratégias usam a matriz nativa de duas linhas de dez caracteres. As imagens ampliadas e a execução do jogo confirmaram esse formato; não foi criada uma terceira linha nem alterado o código de desenho. Textos ausentes do projeto continuam originais.

## Regressões cobertas

- Descritores globais reais, incluindo a propriedade não gravável.
- Hidratação, refresh, render, reconstrução, snapshot e identidade por baseSlot.
- Reset do buffer lexical e hooks visuais sem chamadas de escrita física.
- Projeto atual completo, com os snapshots legados conflitantes: vinte nomes do Brasil, camisa/skills e táticas sparse.
- Rótulos auxiliares, conversão dos nove campos gráficos de controles, limites e preservação da base.
- Exclusão das fases de textos/controles sem vazamento para ROMs de jogadores/formações.

O teste adicional no navegador usa a ROM-base de SHA-256 `ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a`: abertura pelo seletor de projeto, confirmação de todas as categorias, leitura de Cafu no modelo e no snapshot, comparação integral de base/current após os hooks e após a captura. O ZIP completo também foi aberto e validado: nove arquivos de 4 MiB, CRCs, checksums, espelhos, vinte nomes, fase correta de controles e permanência das fotos desde a fase 03. A ROM-base e imagens do usuário não são incluídas no Git.
