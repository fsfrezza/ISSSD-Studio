# ISSSD Studio

Editor/Studio para projetos de ROM baseados em International Superstar Soccer Deluxe.

## Objetivo deste repositório

Este repositório é a fonte de verdade do desenvolvimento do ISSSD Studio: histórico de versões, regressões, testes automatizados e builds reproduzíveis.

## Regras do projeto

- A ROM-base comercial **não é versionada**.
- Projetos `.issdproj` e versões históricas do Studio podem ser preservados quando não contiverem a ROM integral embutida.
- O build deve ser determinístico: ROM-base imutável + projeto = ROM de saída.
- Alterações semânticas devem ser preferidas a patches físicos históricos.
- Expansões/infraestrutura gerada devem existir apenas no build quando possível, não se acumular no projeto.
- Toda regressão encontrada deve ganhar um teste automatizado.
- Uma função só é considerada migrada quando existe contrato semântico/writer modular e teste específico; mera reprodução de patch histórico não basta.

## Baseline conhecido

ROM-base Plus esperada:
- tamanho: 2 MiB (2097152 bytes)
- SHA-256: `ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a`

A ROM em si não deve ser enviada ao GitHub.

## Estado atual

O núcleo novo já consegue:
- abrir projetos sem mutar a ROM-base;
- migrar compatibilidade crítica de projetos históricos;
- gerar a ROM Plus de forma determinística;
- aplicar writers semânticos de jogadores e táticas;
- gerar infraestrutura de táticas apenas no build;
- recalcular checksum;
- validar uma ROM real no Mesen por 1200 frames, tanto na base quanto na saída gerada.

A antiga regressão v6.92 → v6.93 está documentada e coberta pelo núcleo/testes. O foco atual deixa de ser apenas recuperar o build e passa a ser **migrar funcionalidade por funcionalidade do monólito para módulos semânticos testáveis**.

A lista de funções, status de migração e ordem recomendada está em:

- `docs/FUNCTIONAL-MIGRATION-MATRIX.md`
- `docs/HISTORY.md`
- `docs/V692-V693-ROOT-CAUSE.md`
- `docs/EMULATOR-TESTING.md`
