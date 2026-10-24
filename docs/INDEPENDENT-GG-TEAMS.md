# Equipes independentes do grupo GG

O projeto canônico contém 60 equipes físicas: as 54 seleções anteriores e seis equipes GG. As equipes secretas 54/55 foram reaproveitadas; 56–59 são quatro registros físicos adicionais. A página secreta fica disponível com seis posições e nome inicial GG.

| ID | Equipe | Sigla | Cores | Cópia inicial |
|---|---|---|---|---|
|54|ADIPOSOS|ADI|Laranja / preto|Brasil|
|55|BUGIGANGAS|BUG|Azul marinho / vermelho|Argentina|
|56|ENCEFALICOS|ENC|Preto / branco|Alemanha|
|57|MACUCOS|MAC|Branco / verde|Itália|
|58|TELURICOS|TEL|Azul / preto|Inglaterra|
|59|VAPOROSOS|VAP|Amarelo / vermelho|Espanha|

A equipe fonte indica apenas a procedência inicial. A exportação não consulta seus dados para gerar uma equipe GG. Os registros completos de nomes, atributos, formações, cores, desenhos de camisa, uniformes dos goleiros, fotos e bandeiras ficam em `state.semantic.independentTeamsV1`. Cada equipe usa suas próprias tabelas e paletas; gráficos nativos imutáveis de corpos, cabelos e poses continuam sendo reutilizados por referência, como no restante do jogo.

## Edição e persistência

As seis equipes usam os mesmos seletores e formulários das demais equipes.
Os IDs 54 e 55 substituem as duas identidades secretas antigas; 56 a 59 são
acrescentados, totalizando 60 equipes. Não existem seções separadas para GG.

- Equipes: seleção normal de todas as equipes, nomes completo/grande/sigla e tática no campo existente.
- Grupos: dez cartões no organizador comum, com nomes livres e troca de posições entre quaisquer das 60 equipes.
- Jogadores: seletor comum e os 20 jogadores do elenco, incluindo goleiros; nomes, camisas, posições, skills e aparência usam os controles existentes. A edição em massa também usa esses dados.
- Uniformes: os seletores comuns incluem as 60 equipes; cores titular/reserva, desenho próprio e uniformes dos dois goleiros são persistidos nos dados individuais.
- Bandeiras: as equipes usam o mesmo seletor e editor de paletas, lendo seus gráficos próprios de 24 × 16 pixels.

As referências aprovadas já estão no projeto. O reserva começa com as cores
predominantes invertidas. Fotos e uniformes mantêm seus mapeamentos individuais.

Salvar o projeto preserva todos esses domínios; reabrir os hidrata sem escrever na ROM-base. Salvar ROM materializa as equipes pelo pipeline canônico. Na exportação cumulativa, a fase **Jogadores (08)** inclui a estrutura completa das seis equipes, seus nomes e organização de grupos, porque esses componentes precisam ser aplicados juntos. As ROMs anteriores à fase 08 conservam a estrutura anterior.

Os antigos slots secretos 54/55 e os quatro slots adicionais usam os seletores comuns, junto das outras 54 seleções.

## Implementação nativa

- Diretórios de 60 equipes para elencos, nomes, uniformes, paletas, bandeiras, foto e formações.
- Registros independentes em bancos expandidos; atributos continuam no banco AA, com espaço verificado para as quatro equipes adicionais.
- Reservas: tabelas/nomes/código `2D8000–2DFFFF`; paletas `2E6000–2E7FFF`; padrões e táticas `2E8000–2E97FF`; gráficos das bandeiras de seleção a partir de `2E9800`; índice de alocação `2EF000–2EFFFF`; bandeiras comprimidas `2F0000–2F7FFF`; paletas de goleiros `2F8000–2FFFFF`.
- O índice de alocação registra os intervalos pertencentes à extensão, usados pelo classificador cumulativo. Bytes sem classificação não são descartados silenciosamente da extensão.
- O carregador de gráficos original reserva um bit do banco como comando. Fonte e OAM dos nomes ficam nos blocos nativos verificados; streams expandidos de bandeiras usam um marcador distinto e um adaptador explícito.
- A memória alta 7F é reutilizada por descompressões nativas. Bandeiras e siglas GG são lidas diretamente da ROM em cada upload; não dependem de cópias temporárias nessa memória.
- Nomes grandes GG usam dois espaços limitados para os adversários em uso, sem invadir objetos de menus, estádio, substituições ou palavras de estado.

## Verificação

Foram executadas partidas amistosas com cada uma das seis equipes em Snes9x, inclusive usando a ROM cumulativa. Também foram verificados: ROM-base imutável; alteração de uma equipe sem alterar os atributos das outras 59; gravação/reabertura do projeto; integração dos seletores e formulários comuns; exportação sem intervalos GG ausentes; e execução dos helpers 65816 de paletas, nomes grandes e placar.

O teste de interface usa o runtime real com um DOM de teste. O build completo do HTML legado foi validado com o baseline privado fornecido pelo usuário. O patch é aplicado depois da abertura semântica e antes do verificador final; a cópia local já existente do baseline deve ser preservada.

Não foi ampliado o formato dos campeonatos nem validado todo o fluxo de competições ou desafios com as equipes novas. As restrições nativas de cabelos sobrepostos 1–13 continuam valendo: até três titulares por equipe; Careca 0, Nativo 14 e Cascão 15 usam o corpo regenerado. As duas paletas de jogadores de linha pertencem à equipe; alterar suas cores afeta os jogadores que usam a mesma paleta nessa equipe.

## Bandeiras das seis referências

As referências aprovadas estão em `assets/team-flags/*-reference.png`. Cada
`*-native.png` mostra o resultado exato de 24 × 16 pixels, com no máximo quatro
cores BGR555. A adaptação amplia a proporção horizontal sem cortar os símbolos.
O manifesto `gg-flags.json` guarda pixels nos índices nativos 12–15 e as quatro
cores. As bandeiras são independentes em seleção e partida.

O projeto canônico já contém os bytes 4bpp e suas paletas em
`independentTeamsV1.teams[54..59].data`. Importar o projeto recupera esses dados;
exportar a ROM os materializa nas regiões próprias das equipes GG. Nenhuma
imagem externa é necessária para abrir ou exportar o projeto. O Editor continua
permitindo editar os desenhos e cores sem restaurar automaticamente as referências.

Para reaplicar explicitamente as referências ao projeto canônico (substitui suas
bandeiras GG), execute `node scripts/apply-gg-reference-flags.mjs`.

## Diagnóstico de versão antiga

Se ainda aparecer a opção de adicionar a extensão removida ou ALL STARS com duas
equipes, a página não é o build atual. O servidor atual recusa esse HTML com HTTP
409 em vez de permitir uma exportação aparentemente atualizada. Seu endpoint
`/__isssd/build-info` identifica `independentTeams.count: 6`. Use o endereço exato
impresso pelo servidor: caso 4173 esteja ocupada por uma instância antiga, o novo
servidor pode iniciar em outra porta.

Depois da atualização, importe o projeto canônico da raiz. A mensagem de abertura
confirma as seis equipes; o painel Equipes GG apresenta os dez grupos e todos os
60 times. Na exportação cumulativa, a fase Jogadores inclui a estrutura GG; use a
última ROM do ZIP para testar todas as fases selecionadas.

## Integração com o HTML legado enviado

O organizador comum de Grupos apresenta dez grupos e 60 equipes. As formações
ficam no campo tático existente em Equipes. Os painéis separados GG foram
removidos. A ponte semântica hidrata os modelos normais e intercepta somente as
gravações dos novos registros; os primeiros 54 times preservam seu fluxo nativo.
Os endereços virtuais usados pela UI nunca são gravados no buffer ROM. A ROM final
continua sendo produzida exclusivamente pelo pipeline canônico.

O removedor da extensão antiga não atravessa corpos de funções para decidir se
uma chamada pertence ao recurso removido: o IIFE principal é preservado. Ramos,
spreads e concatenações do estado antigo são eliminados sem deixar chamadas a
`undefined` ou espalhamentos de valores ausentes.

## Recuperação de projetos que conservaram somente os nomes

O módulo visual `type="module"` pode substituir o finalizador depois dos scripts
clássicos. Por isso o coletor e o serializador aplicam diretamente a persistência
das equipes independentes, além do finalizador global. Os testes reproduzem essa
substituição tardia; apenas testar a ordem textual dos scripts não é suficiente.

Uma lista com mais de 56 nomes sem `independentTeamsV1` não comprova que existem
registros adicionais. O Editor detecta essa inconsistência ao importar e solicita
`/__isssd/recover-independent-teams`: cria os seis registros a partir das equipes
fonte do projeto, acrescenta as bandeiras aprovadas e restaura as seis posições GG.
As nove organizações normais e os demais estados semânticos são preservados.
A geração direta de ROM e o serializador recusam um projeto ainda inconsistente.

O arquivo `International-Superstar-Soccer-Deluxe-Plus-projeto-recuperado.issdproj`
contém a recuperação do projeto anexado, preservando suas alterações
nacionais esparsas. O projeto padrão completo permanece separado para evitar
substituir silenciosamente seus dados pelos de uma revisão diferente.

## Correção da composição das fotos e novas bandeiras

Os prints de corrupção dos IDs 56–59 foram reproduzidos em Snes9x. Além das
paletas e tipos de corpo/rosto, a foto lê seletores de sobreposições em
`81:FBD1` e `81:FC09`, uma tabela de acessórios em `82:F970` e flags de um
byte por equipe em `81:FE78`. Essas tabelas ainda eram nativas e limitadas aos
slots anteriores. A leitura dos IDs novos ultrapassava os diretórios e gerava
objetos inválidos, que contaminavam a seleção e a transição para a partida.

As quatro propriedades são capturadas nos registros independentes
(`overlayType`, `extraType`, `accessory`, `formationFlags`) e os diretórios
agora cobrem 60 equipes. `82:F600/F608` são tabelas por tipo de rosto,
não por equipe, e permanecem com sua indexação nativa. Projetos antigos sem
as novas propriedades usam sobreposições vazias e limitadas; os projetos
incluídos já contêm os seletores corretos de suas cópias iniciais. Nenhum
carregamento consulta a equipe doadora para resolver esses novos campos.

As seis referências integrais fornecidas nesta revisão substituem as sombras
anteriores. As imagens originais estão nos arquivos `*-reference.png`; o
manifesto e os `*-native.png` contêm a conversão para 24 × 16 e quatro cores
BGR555. Textos e detalhes muito pequenos não são legíveis nesse formato.
Ambos os projetos incluídos contêm os gráficos de seleção e partida.

Verificação desta revisão: 653 testes; build completo do Editor; reprodução
antes/depois na seleção; seis partidas GG contra Inglaterra na ROM cumulativa
final; confrontos GG entre slots antigos e novos. A inspeção do emulador
verificou campo, jogadores, minimapa, placar e bandeiras, além dos registros ROM.
