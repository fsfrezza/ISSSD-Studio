# Revisão do projeto e fotos de seleção

A referência efetiva dos elencos e recursos visuais é a IASBESR de sessenta equipes. O projeto Deluxe conserva seus slots, resolvidos por `plusId`; a organização é a solicitada pelo usuário, não a disposição antiga encontrada no arquivo Plus. São nove grupos regulares e seis equipes GG na página secreta.

A revisão verifica os 1.200 nomes, números, posições e nove atributos contra os registros efetivos da IASBESR. Também verifica que a adaptação de fotos não muda nenhum byte das tabelas de atributos e nomes exportadas nem as bandeiras, uniformes, grupos e compositor da tela de título. Os dezesseis ajustes de textos e os cinco rótulos de pré-partida já corrigidos são preservados.

`changes.teamPhotos` importa sessenta conjuntos independentes de seletores de corpo, rosto, sobreposição, detalhes, acessórios e formação, com cinco paletas por equipe. Os diretórios foram identificados pelos mesmos consumidores de código nas bases Plus e Deluxe. Diretórios indexados por tipo de rosto permanecem distintos dos indexados por equipe.

As tabelas e o código usam `0x242000–0x248000`. As paletas usam `0x24C000–0x24E000`, com ponteiros virtuais `0x4000–0x5FFF` e banco C9. O despachante mantém as paletas de uniformes em C5 e as nativas em 89. Registros iguais podem compartilhar armazenamento na ROM; os dados do projeto continuam separados por identidade. Reservas ocupadas e seletores fora dos limites bloqueiam a exportação.

A adaptação desta etapa cobre as fotos da seleção de equipes, incluindo os rostos que fazem parte delas. Retratos individuais, aproximações e outras cenas dos jogadores ainda precisam de seus próprios mapeamentos. A interface de edição livre de fotos/pixels não faz parte desta etapa.

### Importação independente (rascunho)

A aba Equipes aceita PNG, JPEG e WebP mesmo sem `changes.teamPhotos`. O bitmap é redimensionado proporcionalmente para 96 × 64 pixels, com índice zero transparente e até 15 cores BGR555 opacas. `changes.teamPhotoDrafts`, indexado pela identidade Plus da equipe, guarda a paleta e os pixels editáveis; não modifica as tabelas gráficas nativas. O Editor mantém o rascunho ao salvar/reabrir o projeto e bloqueia Gerar ROM enquanto houver rascunhos, evitando uma exportação que descartaria essas imagens silenciosamente. Remover uma imagem importada retorna à foto nativa. O resultado do compilador informa `pendingTeamPhotos` para que outros consumidores também possam distinguir rascunhos não gravados.

A individualização real dos bitmaps ainda depende da rotina nativa `CODE_85AFA0` e da composição/OAM iniciada por `CODE_85B18B`: atualmente os componentes de formação são carregados de gráficos compartilhados. A conversão acima não é uma implementação dessa rotina, nem implica funcionamento em emulador.

Também ficam identificadas como sem equivalente mapeado no menu nativo atual as chaves legadas `preKickoff.viewData` e as seis descrições auxiliares do projeto Plus. Elas não são anunciadas como traduções aplicadas à ROM. Os outros sete rótulos de pré-partida não tinham tradução explícita nesse anexo. As melhorias de jogabilidade continuam com o estado próprio da aba Melhorias.

No emulador, as seis GG foram selecionadas com os novos recursos de foto, e a seleção seguida de partida foi verificada. O acesso secreto continua com a organização previamente validada: nove páginas bloqueadas e dez após o segredo.
