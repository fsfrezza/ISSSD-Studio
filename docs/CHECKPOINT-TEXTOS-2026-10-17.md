# Checkpoint: textos e exportação — 17/10/2026

Baseline de código e projeto: `6d663235f54c856027358147e7a936ac529b7fc1`.
Branch: `refactor/build-pipeline-v1`.
Projeto: `International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj` na raiz.

## Estado preservado

- Os padrões em português do Editor seguem os textos do projeto fornecido pelo usuário.
- POINTS LEFT usa FALTAM; a ocorrência nativa GAME START (`match-options-native.data_87cada`) usa INICIO; RESET permanece RESET.
- Textos do Cursor têm sua própria aba. Os campos permanecem separados por tela.
- Foram corrigidos vínculos nativos, quebras de linha e legendas gráficas de seleção, pré-partida, jogadores, formações e uniformes. Jogadores, atributos, posições e imagens do projeto foram preservados.
- A última conferência de exportação das fases textuais não apresentou traduções pendentes nem alterações sem área atribuída. Isso não equivale a uma conferência visual exaustiva de todas as ocorrências do jogo.
- A ocorrência de GAME START na tela do estádio ainda deve ser conferida visualmente com INICIO na ROM recém-gerada.

## Fluxo para testar

1. Atualizar o código, reconstruir o Editor e reiniciar o servidor; atualizar a página com Ctrl+F5.
2. Abrir o projeto canônico da raiz. A abertura carrega o estado sem modificar a ROM-base.
3. Clicar em Salvar ROM, selecionar as áreas e gerar o ZIP. Não é necessário clicar em Implementar nem reaplicar as traduções.
4. A infraestrutura entra automaticamente no início: expansão para 4 MB e individualização das táticas. A fase 01 não possui caixa para desmarcar.
5. Usar a última ROM do ZIP para testar o resultado cumulativo das áreas selecionadas.

A mensagem ao abrir o projeto Plus informa que a expansão e a individualização serão aplicadas ao gerar as ROMs.

## Validação da baseline

`npm run validate:editor:local` aprovado após a alteração de INICIO/RESET, incluindo regressões, geração do HTML e invariantes. Arquivos protegidos inalterados. O comando não abre, migra ou salva o projeto do usuário.

A geração das fases textuais foi conferida adicionalmente com a ROM Plus real. Camadas personalizadas da Tela Inicial continuam dependendo da conversão gráfica feita pelo Editor durante a exportação.

## Próxima área

Próxima candidata: camisas/uniformes. As traduções das legendas CAMISA, CALÇÃO, MEIAS, COR, TIPO e EDITAR já possuem gravação; isso é distinto da edição dos gráficos e das paletas dos uniformes.

Antes de implementar novas funções, conferir o suporte atual a cores, padrões, uniformes de linha/goleiro e variantes; mapear os recursos no disassembly e verificar compartilhamentos entre equipes. Manter a ROM-base imutável, dados semânticos no projeto, geração determinística e separação por tela/fase.

Nenhuma nova funcionalidade de uniformes foi iniciada neste checkpoint. Outra área da ROM pode ser escolhida a partir desta mesma baseline.
