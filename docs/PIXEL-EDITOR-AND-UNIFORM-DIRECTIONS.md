# Editor de pixels e prévia direcional de uniformes

## Implementação

O núcleo `src/core/pixel-editor.mjs` trabalha somente com índices de paleta,
dimensões e máscara opcional. Não conhece ROMs, endereços, equipes ou DOM.
Inclui traços interpolados, preenchimento limitado por máscara, amostragem,
transações de edição, cancelamento e histórico de 64 operações.

O adaptador `editor-src/pixel-editor.mjs` liga esse núcleo a um canvas com
Pointer Events. Um viewport permite trabalhar em um quadro de um documento
maior. Em Uniformes, os oito quadros formam um documento 8 × 64; preencher um
quadro não invade os outros e desfazer/refazer atravessa mudanças de quadro.
Titular e reserva usam o mesmo rascunho de desenho, com paletas independentes.

A importação ajusta a imagem inteira para 8 × 8, sem suavização, e escolhe os
índices mais próximos na paleta atual. Transparência usa índice zero; pixels
opacos nunca são convertidos em zero. A importação permanece em rascunho até
**Aplicar desenho ao projeto**. Exportar PNG salva o quadro na resolução nativa.
Não há recorte interativo nesta etapa.

A interface existente de Uniformes usa esse componente para lápis, borracha,
preenchimento e conta-gotas. O componente já aceita máscaras para outros
adaptadores; bandeiras e estádios ainda não foram ligados a ele.

## Oito direções

`uniformDirectionalViews()` estende nosso compositor existente de sprites.
Usa cinco orientações de corrida do catálogo nativo (costas, diagonal de costas,
perfil, diagonal de frente e frente), com espelhamento horizontal para completar
as oito direções. Cada orientação tem dez passos selecionáveis, e cada direção
mostra titular e reserva lado a lado.

A pesquisa partiu do disassembly Yoshifanatic1:
`DATA_82A3D7`, `DATA_82A431`, `DATA_82A48B`, a tabela em torno de `$82:CEF8`
e o carregador `CODE_84E6C7`. Os catálogos Plus e a montagem OAM existentes
continuam sendo a fonte dos gráficos. Não foi copiado código do editor externo,
nem foram adicionados hooks ou novos endereços de gravação.

Os oito tiles de detalhe de camisa NÃO representam oito direções. O compositor
continua consultando o modo de cada pose e só sobrepõe o detalhe quando o modo
nativo está entre 129 e 136. A galeria não força um detalhe sobre uma pose que
não o utiliza. Trata-se de uma prévia de arte/paleta, não de uma captura de jogo
com todos os elementos dinâmicos, como numeração nas costas.

## Persistência e limites

O formato `uniformsV1` e os writers existentes foram preservados. Alterações de
desenho continuam na fase Jogadores. Não existe edição exclusiva do corpo
completo por equipe: a arte do corpo continua compartilhada e o detalhe segue
as regras já existentes de compartilhamento/independência do projeto.

A troca de equipe ou desenho pode substituir um rascunho ainda não aplicado;
confirme o desenho antes de trocar de recurso. Trocar quadro ou titular/reserva
mantém o rascunho atual e seu histórico.

## Validação

Testes automatizados cobrem proteção por máscara, preenchimento, transações,
interpolação, cancelamento, quantização, viewport, histórico entre quadros,
montagem clássica do runtime e oito direções/espelhamentos sem mutar a base.
Os testes existentes de serialização e writers de uniforme continuam aplicáveis.

Este checkout não contém a baseline privada `.editor-vendor/legacy-ui/ISSSD-Studio.html`
nem a ROM Plus. O build completo e a conferência visual no emulador precisam
ser realizados na instalação local que contém esses arquivos. Não substituir
a baseline por um HTML gerado.
