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

Os painéis **Equipes GG** ficam dentro das abas existentes:

- Equipes: nome, nome grande, sigla, importar/exportar uma equipe e organização dos dez grupos. Mudar uma equipe de posição troca as duas posições, preservando as 60 equipes sem duplicação. Os nomes dos grupos são livres dentro do limite gráfico nativo.
- Jogadores: todos os 20 jogadores, incluindo goleiros; nomes, camisas, posição, nove skills, cabelo e paleta. Cabelo/pele dos goleiros ficam aqui; seus uniformes ficam em Uniformes.
- Uniformes: titular/reserva, cores predominantes, nove cores de roupa, oito quadros próprios de detalhes da camisa e cores individuais de cada goleiro.
- Formações: formação nativa e coordenadas/linha/apoio ao ataque dos dez jogadores de linha titulares.
- Bandeiras: desenho de 24×16 pixels e quatro cores. Seleção e partida guardam desenhos distintos; há um botão para copiar entre as telas.

A cópia inicial conserva as bandeiras dos doadores. As cores predominantes alteram roupas, sem recolorir pele ou cabelo. O reserva começa com as cores predominantes invertidas. As fotos recebem as mesmas cores de roupa.

Salvar o projeto preserva todos esses domínios; reabrir os hidrata sem escrever na ROM-base. Salvar ROM materializa as equipes pelo pipeline canônico. Na exportação cumulativa, a fase **Jogadores (08)** inclui a estrutura completa das seis equipes, seus nomes e organização de grupos, porque esses componentes precisam ser aplicados juntos. As ROMs anteriores à fase 08 conservam a estrutura anterior.

Os campos nativos dos antigos times secretos 54/55 são ocultados nos seletores de 56 equipes; esses times passam a ser editados nos painéis GG. As outras 54 seleções mantêm o Editor existente.

## Implementação nativa

- Diretórios de 60 equipes para elencos, nomes, uniformes, paletas, bandeiras, foto e formações.
- Registros independentes em bancos expandidos; atributos continuam no banco AA, com espaço verificado para as quatro equipes adicionais.
- Reservas: tabelas/nomes/código `2D8000–2DFFFF`; paletas `2E6000–2E7FFF`; padrões e táticas `2E8000–2E97FF`; gráficos das bandeiras de seleção a partir de `2E9800`; índice de alocação `2EF000–2EFFFF`; bandeiras comprimidas `2F0000–2F7FFF`; paletas de goleiros `2F8000–2FFFFF`.
- O índice de alocação registra os intervalos pertencentes à extensão, usados pelo classificador cumulativo. Bytes sem classificação não são descartados silenciosamente da extensão.
- O carregador de gráficos original reserva um bit do banco como comando. Fonte e OAM dos nomes ficam nos blocos nativos verificados; streams expandidos de bandeiras usam um marcador distinto e um adaptador explícito.
- A memória alta 7F é reutilizada por descompressões nativas. Bandeiras e siglas GG são lidas diretamente da ROM em cada upload; não dependem de cópias temporárias nessa memória.
- Nomes grandes GG usam dois espaços limitados para os adversários em uso, sem invadir objetos de menus, estádio, substituições ou palavras de estado.

## Verificação

Foram executadas partidas amistosas com cada uma das seis equipes em Snes9x, inclusive usando a ROM cumulativa. Também foram verificados: ROM-base imutável; alteração de uma equipe sem alterar os atributos das outras 59; gravação/reabertura do projeto; hidratação das cinco abas; exportação sem intervalos GG ausentes; e execução dos helpers 65816 de paletas, nomes grandes e placar.

O teste de interface usa o runtime real com um DOM de teste. O build completo do HTML legado não pôde ser executado neste checkout porque o baseline privado `.editor-vendor/legacy-ui/ISSSD-Studio.html` não está presente. O patch é aplicado depois da abertura semântica e antes do verificador final; a cópia local já existente do baseline deve ser preservada.

Não foi ampliado o formato dos campeonatos nem validado todo o fluxo de competições ou desafios com as equipes novas. As restrições nativas de cabelos sobrepostos 1–13 continuam valendo: até três titulares por equipe; Careca 0, Nativo 14 e Cascão 15 usam o corpo regenerado. As duas paletas de jogadores de linha pertencem à equipe; alterar suas cores afeta os jogadores que usam a mesma paleta nessa equipe.
