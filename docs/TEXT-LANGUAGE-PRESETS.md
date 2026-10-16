# Referências de idioma nas telas de textos

- **Restaurar originais (inglês)** preenche os textos originais do Deluxe Plus.
- **Usar em português** preenche os textos definidos pelo usuário no projeto canônico, preservando a grafia salva.

Campos sem referência em português permanecem como estão. Não há preenchimento automático pela FB96 nem traduções inventadas. Novos textos serão definidos posteriormente pelo usuário.

Os botões preenchem campos editáveis. Implementar no projeto confirma as alterações; fonte, cores, layout e ROM-base permanecem preservados.

O catálogo `project-data/text-language-presets-v1.json` registra o nome e o SHA-256 do projeto usado como referência. Os textos completos dos controles são independentes. O menu usa as inscrições gráficas salvas no projeto, que prevalecem sobre os campos legados.

Os limites nativos dos gravadores continuam valendo na exportação.

## Campos adicionais das telas (16/10/2026)

Os campos de jogadores, formações, estratégias, controles, uniformes e botões compartilhados usam `additionalScreenTextsV1`. Cada seção possui os dois botões de idioma e confirmação separada. O arquivo guarda tanto os rascunhos quanto os valores confirmados; preencher um idioma não confirma o texto. Frases completas, espaços e campos vazios são preservados. Desmarcar a categoria de textos gráficos exclui esse estado do arquivo filtrado.

A referência inclui FORÇA-CHUTE, PULO, RESTANTES, ARRANQUE e RAPIDEZ, conforme definidos pelo usuário. O projeto mantém acentos; a normalização para uma fonte sem Ç resulta em C.

Esta revisão adiciona os campos ao Editor e ao projeto. Os novos conjuntos ainda não possuem gravadores nativos. Por isso a interface informa a limitação, e o build recusa alterações confirmadas desses conjuntos nas fases selecionadas, em vez de descartá-las silenciosamente. Rascunhos não alteram a ROM. Desmarcar uma fase mantém as demais exportáveis. A gravação nativa do campo DASH dos controles, que já existia, continua disponível com o preset ARRANQUE.
