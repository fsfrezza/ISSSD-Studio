# Sons no projeto e na ROM

A aba Sons permite ouvir Original, Galvão, FB96 e Atual, parar a reprodução,
trocar uma amostra, aplicar um conjunto inteiro e restaurar os originais.
Os conjuntos em lote cobrem os **74 slots BRR catalogados**, incluindo os efeitos
presentes nesse catálogo. Música, instrumentos e sons ainda não mapeados não
são transplantados. Galvão é a referência já integrada ao Editor; FB96 vem da
ROM doadora fornecida ao projeto, sem seu cabeçalho de copiador de 512 bytes.

## Persistência

`state.semantic.soundsV1` usa o schema `isssd-sounds-v1`. Cada chave de `values`
é um ID do catálogo `src/core/sound-slots.mjs`; o registro contém `source`
(`galvao`, `fb96`, `original` ou `custom`) e `brrBase64`. A amostra BRR fica
embutida no `.issdproj`. Reabrir o projeto não exige a ROM FB96 ou o arquivo de
áudio original. As escolhas não alteram a ROM-base nem o buffer do navegador.

O som Atual prioriza a escolha do projeto. A importação de arquivo converte
para mono/10300 Hz/BRR e preserva a duração; não acelera a fala para caber.
Amostras grandes demais são recusadas. Previews de referência usam os dados
BRR originais, sem reconversão com perda.

## Exportação

A fase **11 — Sons** materializa as escolhas pelo Build Pipeline Plus. A fase
pode ser desmarcada, sem vazar alterações de áudio para as demais ROMs.
Amostras sem escolha mantêm o estado anterior. Uma escolha semântica explícita
vence espelhos binários antigos do mesmo som.

Cada lote é validado completamente antes da primeira escrita: IDs conhecidos,
Base64, capacidade, cabeçalhos BRR e bloco END. Apenas o primeiro stream BRR
terminado é copiado. Isso é necessário porque algumas antigas alocações
englobam outros dados depois do END; copiar toda a capacidade ou todo o banco
poderia alterar música, tabelas ou outros conteúdos. Não se modificam os
ponteiros, palavras de transferência ou código do driver SPC.

## Verificações

Os testes conferem os 74 sons das duas referências, persistência e reabertura,
prioridade sobre espelhos antigos, exportação cumulativa selecionada e
excluída, integridade dos bytes fora dos streams, lotes inválidos sem escrita
parcial e restauração do estado da UI após falha de importação de projeto.
