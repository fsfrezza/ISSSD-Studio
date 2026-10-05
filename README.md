# ISSSD Studio

Editor/Studio para projetos de ROM baseados em International Superstar Soccer Deluxe.

## Objetivo deste repositório

Este repositório passa a ser a fonte de verdade do desenvolvimento do ISSSD Studio: histórico de versões, regressões, testes automatizados e builds reproduzíveis.

## Regras do projeto

- A ROM-base comercial **não é versionada**.
- Projetos `.issdproj` e versões históricas do Studio podem ser preservados quando não contiverem a ROM integral embutida.
- O build deve ser determinístico: ROM-base imutável + projeto = ROM de saída.
- Alterações semânticas devem ser preferidas a patches físicos históricos.
- Expansões/infraestrutura gerada devem existir apenas no build quando possível, não se acumular no projeto.
- Toda regressão encontrada deve ganhar um teste automatizado.

## Baseline conhecido

ROM-base Plus esperada:
- tamanho: 2 MiB (2097152 bytes)
- SHA-256: `ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a`

A ROM em si não deve ser enviada ao GitHub.

## Investigação atual

Regressão de 2026-10-05:
- abrir ROM-base e salvar gera ROM funcional;
- abrir projeto e desmarcar todas as alterações gera ROM funcional;
- manter qualquer alteração do projeto gera ROM que trava;
- projetos recentes acumularam patches de expansão de 2 MiB em `0x200000`;
- a linha v6.92 é o principal baseline pré-regressão a recuperar/testar.

Veja `docs/HISTORY.md` e `docs/RECOVERY.md`.
