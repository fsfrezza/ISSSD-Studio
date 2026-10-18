# Nomes livres dos grupos e investigação ALL STAR

## Títulos personalizados implementados

A fase Seleção de equipes agora desenha `semantic.plusGroups.labels` nos dez títulos nativos. Os mesmos campos da aba Grupos salvam os nomes no `.issdproj`; reabrir o projeto e Salvar ROM é suficiente. Não é necessário aplicar um gráfico separado.

Quando os nomes correspondem aos títulos nativos associados aos ponteiros, o asset original não é alterado. Ao usar nomes personalizados, os títulos usam fonte compacta e centralizada no espaço nativo de 64 pixels. Letras A–Z, números, espaços, ponto e hífen são aceitos; acentos normalizam para suas letras sem acento. Não há corte silencioso: largura e capacidade do atlas são verificadas antes de gravar.

Mapa conferido na ROM Plus real:

- Continent Text: PC F6C78, capacidade nativa 691 bytes, stream original de 665 bytes e 992 bytes descomprimidos. Formato 2bpp sem transformação planar.
- Loader: PC 10EEE, fonte CPU 9EEC78.
- O primeiro tile efetivamente carregado corresponde ao código **B2**, não AE. A tabela de conversão em 87:C016 mapeia B2 para o tile 1C0; o último código utilizável nesse intervalo é F1, tile 1FF. Os comentários antigos do experimento GOSPEL-GOL não refletiam esse deslocamento na Plus.
- Os descritores continuam com oito células por duas linhas. Tiles idênticos são compartilhados; o atlas usa no máximo 64 tiles e não atravessa a página nativa de VRAM.
- O gravador de títulos roda depois do gravador de organização para garantir a associação correta entre cada nome lógico e seu descritor independente.

Testes cobrem títulos independentes, limites de atlas/stream, normalização, erros atômicos, preservação dos títulos originais e fase desmarcada. A conferência adicional com a ROM Plus real e o projeto verificou zero alterações sem fase, nenhuma pendência textual e isolamento da fase Seleção. No emulador, GRUPO A e GRUPO B apareceram nas duas páginas sucessivas, com seleção das equipes preservada. O projeto canônico do usuário não foi renomeado nem substituído nesta alteração.

## ALL STAR: investigação, ainda sem ativação publicada

Os seis mapas de composição dos Special Teams estão na Plus em A4:F64F, F69F, F6EF, F73F, F78F e F7DF, apontados pela tabela A4:F643. São seis mapas de 20 referências, cada um com 80 bytes; não são seis blocos novos que devam ser clonados do Brasil.

A página secreta atual usa os IDs normais 54 e 55 (bytes 6C/6E). O domínio especial nativo deslocado corresponde aos engine IDs 70,72,74,76,78,7A. Esses IDs não podem ser passados como índices normais ao gravador de jogadores de 56 equipes.

O experimento antigo `original-special6-only` não é uma implementação pronta:

- A seleção usa seis aliases gráficos de equipes comuns, e não as seis identidades especiais restauradas.
- Ele gravava E82E/E82F como terminador/contador, atingindo DATA_81E82E; esses bytes foram preservados nos testes exploratórios atuais.
- Há limites de página, slots e consumidores de tabelas independentes. Os retornos de contagem em 85:FC58/FC5C ainda informam nove páginas. Ajustar apenas esses retornos e limites conhecidos não bastou para confirmar acesso à página secreta no teste de navegação.
- As tabelas visuais normais não têm seis entradas especiais válidas consecutivas; simplesmente aumentar os limites expõe dados de outras estruturas.

Foi montada uma ROM de diagnóstico temporária para investigar esses caminhos, sem publicar a ROM nem habilitar o experimento no Editor. Ainda faltam seleção verificável de todos os seis, identidades visuais próprias e teste da entrada em partida com cada elenco. Nenhuma equipe do projeto foi removida ou substituída.

Auditoria de leitura reproduzível:

```sh
node scripts/audit-plus-all-stars.mjs "roms/International Superstar Soccer Deluxe Plus.sfc"
```

O relatório confirma os seis ponteiros e calcula hashes dos mapas, sem modificar a ROM. A habilitação do ALL STAR permanece pendente; o botão histórico de diagnóstico não deve ser apresentado como restauração completa.
