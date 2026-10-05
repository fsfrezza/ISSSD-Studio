# Artefatos de regressão materializados

Estes arquivos foram recuperados da conversa e verificados em 2026-10-05. Os hashes permitem garantir que futuras cópias sejam exatamente as mesmas.

| Artefato | Bytes | SHA-256 | Papel |
|---|---:|---|---|
| ISSSD-Studio(20261005-000948).html | 3479500 | 3ec85b2613defafa5a76ee7271a3214d07a4c58cda49b8118db45c0366f70f76 | base imediata da v6.92 |
| ISSSD-Studio-v6.92-TROCAS-ESCALACAO-E-CAMPO.html | 3482940 | cafe5879e60485edb1bed2c2df72908179d137b6984f234593cec7f59ae43d6e | principal baseline pré-regressão |
| ISSSD-Studio-v6.93-PERSISTENCIA-EQUIPES.html | 3486272 | dbe6e6cda778cf917277abc4923a3533f620186d4a7555cd337e059ad5367e76 | primeiro candidato pós-baseline |
| projeto(20261005-005734).issdproj | 871663 | 0f340a2ddc9c607eeff228295528d0be5a677e621397c67cef65d25dd28dfb4c | projeto antes do passe de skills Brasil |
| projeto(20261005-005734)-SKILLS-BRASIL.issdproj | 695367 | 7a04aed82d23d3ff902cb119f65d3095d07176c11e7bf3a1cf32fadcc85a4968 | projeto Brasil aprovado |

## Próximo teste manual

1. Abrir a ROM-base Plus limpa na v6.92.
2. Abrir `005734-SKILLS-BRASIL`.
3. Gerar ROM sem novas edições.
4. Testar boot.
5. Repetir exatamente o mesmo procedimento na v6.93.
6. Se v6.92 funciona e v6.93 trava, o intervalo de regressão fica reduzido a uma única mudança de versão.

A ROM-base comercial não deve ser versionada.
