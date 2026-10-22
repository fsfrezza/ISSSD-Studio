# Editor integrado de quadros de jogadores

Na aba Jogadores, abra **Editar aparência → Editor de quadros → Editar cabelos e corpo**.

- Há 16 tipos, numerados de 0 a 15, e 24 quadros para cada sobreposição 1–15.
- O tipo 0 está desenhado nos corpos; não é uma folha separada de cabelo.
- Os 857 blocos de corpo mapeados da Plus estão disponíveis por nome e endereço.
- Vinte poses confirmadas aparecem montadas em 16 × 48 pixels. Os demais
  blocos aparecem como tiles em ordem nativa, com oito tiles por linha.
  A montagem OAM completa dessas poses ainda não foi integrada.
- Lápis, borracha, preenchimento, conta-gotas, desfazer/refazer, espelhamento
  horizontal e copiar/colar quadros com as mesmas dimensões estão disponíveis.
- Uma referência do jogador inteiro acompanha a área de desenho. Alterar um
  pixel atualiza o cabelo sobre o corpo correspondente. **Animar movimento**
  percorre a sequência sem mudar o quadro selecionado para edição.
- As 24 poses de cabelo possuem referências; 850 dos 857 blocos de corpo têm
  montagem OAM mapeada para a referência. Os sete restantes mostram uma
  indicação de montagem indisponível e continuam editáveis como tiles.
- A referência usa as posições centrais, tamanhos e espelhamento dos objetos
  OAM nativos. Numeração, sombra e outros objetos carregados por transferências
  separadas não entram nesta referência de corpo/cabelo.
- A paleta mostra as cores da equipe e da paleta selecionadas; os desenhos
  guardam índices de cor, de 0 a 15. Zero é transparente.
- Os desenhos são compartilhados: editar um tipo ou bloco altera todos os
  jogadores que usam esse recurso. Isso ainda não cria um corpo individual
  para cada jogador nem remove o limite nativo de três cabelos especiais.

## Salvar e exportar

As mudanças de quadros são mantidas enquanto a janela de aparência permanece
aberta. Use **Aplicar desenhos ao projeto** antes de fechar a janela, depois
**Salvar projeto** para gravar no `.issdproj`. Os desenhos aplicados são lidos
novamente ao reabrir o projeto. **Restaurar este quadro** remove seu override
imediatamente no projeto em edição; salve o projeto para guardar a restauração.

**Salvar ROM** grava os desenhos na fase **Jogadores**. No ZIP cumulativo,
desmarcar essa fase exclui tanto os desenhos quanto os atributos dos jogadores.
A ROM-base carregada pelo Editor permanece imutável. A edição dos PNGs 14/15
continua funcionando, mas o desenho salvo no projeto tem prioridade por quadro.

Os desenhos ficam em `state.semantic.teamsV1.spriteEdits`, versão 1:
`hair` usa chaves `tipo:quadro` (quadros de 0 a 23) e `body` usa endereços CPU
como `8DC758`. Cada valor é um vetor de índices de pixels nas dimensões do
quadro exibido. Dimensões, intervalos, cabeçalhos DMA e tiles vazios finais são
validados antes de qualquer gravação. Cabelos 1–13 e corpos conservam as áreas
nativas. Cabelos 14/15 usam as áreas já reservadas na expansão.

A prova de composição `body:proof` continua sendo um experimento separado.
O editor integrado permite editar os recursos existentes; a migração para
cabeças compostas em todas as poses ainda não foi concluída.

## Validação

Testes cobrem roundtrip dos 857 blocos, edição de corpos e cabelos, gravação
nas 24 poses dos tipos 14/15, isolamento dos desenhos entre projetos, restauração,
falhas atômicas, salvamento/reabertura e edição pela interface ao trocar quadros.
A exportação cumulativa é conferida com Jogadores marcada e desmarcada.
Também foi conferido o roundtrip de todos os corpos na ROM Plus real e uma
exportação cumulativa real com desenhos alterados.

O build privado completo da interface e o teste visual no emulador não puderam
ser executados neste ambiente. Os testes de geração e de comportamento usam
fixtures; o teste binário real usa a ROM Plus canônica fornecida.

### Revisão de Careca e Cascão

Os 24 desenhos dos tipos 14/15 usam o corpo original como referência.
O seletor identifica direção, movimento e quadro de cada pose.
O botão “Restaurar Careca e Cascão (24 quadros)” remove somente os desenhos
desses tipos no projeto, recuperando os PNGs atuais; não muda jogadores nem
outros desenhos. Salve o projeto e exporte a ROM para persistir a restauração.

OAM direto da ROM armazena Y antes de X, enquanto os planos descomprimidos
armazenam X antes de Y. A extração foi corrigida para poses especiais,
incluindo lançamentos, giro e quedas.

### Modelo de aparência atual

A revisão anterior Careca=14 foi substituída pela [base careca v1](BALD-PLAYER-BASE.md).
0 agora é o corpo careca; 14 recupera o cabelo original; 15 é apenas a mecha
Cascão. O projeto antigo é migrado uma vez. A edição de corpo parte da versão
careca e a borracha dos cabelos revela essa base. O botão atual chama-se
“Restaurar Original e Cascão (24 quadros)”.

### Editar o nativo pela lista de tipos

Selecione “0 · Nativo / base careca (editar corpo)” no mesmo seletor dos cabelos.
As 24 poses levam diretamente ao bloco de corpo correspondente; a referência
mostra o jogador inteiro. Aplicar salva como edição de corpo no projeto e a
exportação grava na fase Jogadores. O seletor de tipos e poses permanece ativo.
Para os demais 857 blocos, use o conjunto “Corpos · todos os blocos nativos”.
