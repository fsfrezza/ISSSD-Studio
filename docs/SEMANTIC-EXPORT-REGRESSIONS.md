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

## ATACAR por identidade

O checkbox tático atualizava somente a seta no campo. Ao salvar/reabrir, o snapshot voltava a obter o valor do overlay anterior ou da baseline; isso podia dar a impressão de que a escolha de R. Gaúcho havia ido para Dunga. Agora cada linha captura `playerId` e `baseSlot` e grava `custom.tactical.attack` por essa identidade. `false` é preservado explicitamente quando a baseline é `true`; valores iguais à baseline permanecem sparse. Trocar slots não troca a identidade destinatária da edição.

A coluna ATACAR foi movida para depois de X/Y, mantendo os handlers de coordenadas existentes. O teste no navegador salva o projeto, recarrega a página e reabre os dados: R. Gaúcho marcado, Dunga desmarcado, coluna final e ROM interna idêntica à base. As regressões também verificam JSON, troca de slots e os bits nativos exportados.

## Fonte dos textos de controles

O bloco nativo 2bpp usa índice 1 para a tinta clara, 2 para suavização e 3 para o contorno preto. O conversor anterior contava qualquer pixel não transparente como tinta: escolhia o contorno (mais frequente) e não conseguia separar os glifos. Isso resultava em letras pretas de uma fonte alternativa.

O atlas agora extrai os glifos claros por limites explícitos do gráfico original, preserva a suavização e recompõe o contorno antes de desenhar as letras. C deriva dos traços do G nativo. O posicionamento pode ser ajustado dentro de cada campo para respeitar os 390 bytes reservados, sem expandir o bloco sobre dados vizinhos. Campos não alterados continuam intactos.

A regressão usa um gráfico 2bpp com tinta, suavização e contorno distintos; verifica a reprodução dos pixels claros, o contorno e a imutabilidade da base. A conversão do projeto atual com a ROM Plus real também foi conferida: 346 bytes comprimidos, de 390 disponíveis, com os textos não alterados e os bytes externos preservados.

## Controles: uma inscrição completa por ação

O mapa antigo de palavras não correspondia às células usadas pela rotina nativa. HIGH BALL usa tiles $72..$76; PASS BALL reutiliza os três tiles de BALL e acrescenta $77/$78. Os limites anteriores também invadiam SHOOT e DASH. Apenas trocar os pixels de cada palavra produzia inversão, cortes e vazamento entre inscrições.

O modelo agora resolve oito inscrições completas: highball, passball, shoot, dash, keeper, semiauto, auto e manual. `screenTextsV1.values.controls` é prioritário; as antigas chaves high/ball/pass são lidas para compatibilidade, sem modificar o projeto ao abrir. Palavra única e texto vazio são aceitos. O Editor não divide a frase ao salvar.

Na exportação o writer aloca tiles exclusivos para cada inscrição dentro dos mesmos 31 tiles e atualiza os descritores nativos de cada ação. O KEEPER tem três células e as outras ações/modos têm cinco. O bloco continua limitado a 390 bytes comprimidos; limites por linha e total são verificados antes de gravar. Descritores inesperados da base são recusados. Tanto os tiles como os descritores pertencem à fase Pré-Partida; desmarcá-la preserva ambos.

Regressões cobrem migração BOLA + ALTA → BOLA ALTA, frase e palavra única, linha vazia, troca de duas frases sem compartilhar tiles, seleção de fase, limites, guardas da base e preservação dos bytes externos. No navegador, o projeto anexado foi aberto, editado, salvo e reaberto: BOLA ALTA, TOCA AQUI e CHUTE permaneceram independentes, com ROM-base intacta.
