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

Esta revisão adiciona os campos ao Editor e ao projeto. Os novos conjuntos gráficos ainda não possuem gravadores nativos; as 14 ajudas do Cursor já têm gravação nativa, descrita em CURSOR-TEXTS.md. A interface informa a limitação. A exportação continua com todas as alterações suportadas e identifica os campos ainda não aplicados no aviso do navegador, em `TEXTOS-PENDENTES.txt` e em `indice.json`. O índice marca `allSelectedChangesApplied: false` quando houver pendências; isso não equivale à aplicação dessas traduções na ROM. Rascunhos não alteram a ROM. Desmarcar uma fase mantém as demais exportáveis. A gravação nativa do campo DASH dos controles, que já existia, continua disponível com o preset ARRANQUE.


A correção da exportação cumulativa preserva os seis textos auxiliares dos controles no projeto, sem impedir o download das nove ROMs. A resposta HTTP informa `X-ISSSD-Pending-Text-Count` e `X-ISSSD-Export-Status`; o aviso aparece após iniciar o download. As entradas de cada fase listam apenas suas próprias pendências. Fases desmarcadas não geram pendências na exportação selecionada. Falhas reais dos gravadores continuam interrompendo o build.

A seção antiga de textos auxiliares dos controles migra para a aba **Textos Cursor**. Os valores de `control-labels` são preservados em `cursor-labels`; rascunhos e textos confirmados continuam separados. A auditoria dos 14 blocos nativos, os limites e a distinção entre rótulos gráficos e ajuda estão em [CURSOR-TEXTS.md](CURSOR-TEXTS.md).
