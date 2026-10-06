# Regression corridor manifest

Recovered byte-exact artifacts for the critical v6.81–v6.93 corridor. The binaries are preserved outside Git until the connector supports direct file-reference uploads; these hashes pin their exact identity.

| Version | SHA-256 |
|---|---|
| v6.81 MENU ESTAVEL | 2325f89a42a7b33a9ee2bc01941da6543283a1ba7e23259fa9ed87d9c3a52166 |
| v6.82 MENU CENTRALIZADO | daee47997f43945c2e2450282a8e8d727ddcb9502aa0baadb4b7b36d75f33f07 |
| v6.83 LISTAS ALTERACOES COLUNAS | 7fb8bf1fa36fdf8932f7f579e7a07ee995db67f7873c4a631195594ce8a4c0f9 |
| v6.84 JOGADORES COMPLETOS PLUS | 14d5d6d5d548267743bec95b180781ab43f5d9f25044b6af1ef6e0d36f36503c |
| v6.85 ATRIBUTOS EDITAVEIS | abf71459fea9a9fc646a530264610d54484b07e5c76093344b1001fb38941ede |
| v6.86 SKILLS 1-10 | e0aff71e94aa2b838f24181d23bc8215b01e0fbd04b3bba4066cf9c62104a64b |
| v6.87 WRITERS CIRURGICOS | e11af04b640852a94ecc95b875b0026618be823df1974fa066366ac8dc7b6c29 |
| v6.88 TROCA ORDEM ESCALACAO | 556d8a7f4e18b06bc56485f10a1635bc526b7025dc6d24c1c400b61c79b0f0aa |
| v6.89 DIAGNOSTICO JOGADORES PLUS | b721d94786a2e505bd7bdd6d10166cbb39dca7275d502dbcd8f94cc0f0b2fadb |
| v6.90 DIAGNOSTICO VISIVEL | 5d69da07d8cb9ae5c5321e7a98fe9fe59198be8c3dba3d3369720a3f9d05e72f |
| v6.91 ATRIBUTOS PLUS REATIVADOS | 3ec85b2613defafa5a76ee7271a3214d07a4c58cda49b8118db45c0366f70f76 |
| v6.92 TROCAS ESCALACAO E CAMPO | cafe5879e60485edb1bed2c2df72908179d137b6984f234593cec7f59ae43d6e |
| v6.93 PERSISTENCIA EQUIPES | dbe6e6cda778cf917277abc4923a3533f620186d4a7555cd337e059ad5367e76 |
| 005734 SKILLS BRASIL project | 7a04aed82d23d3ff902cb119f65d3095d07176c11e7bf3a1cf32fadcc85a4968 |

## Test order

Use the same immutable Plus base ROM and the same 005734-SKILLS-BRASIL project. Generate without additional edits in each Studio snapshot. Record boot/no-boot and output SHA-256. Once the first bad snapshot is found, diff only that adjacent pair.
