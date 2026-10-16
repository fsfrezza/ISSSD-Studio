# Textos Cursor

A aba **Textos Cursor** reúne as inscrições e ajudas da tela Cursor. Ações dos botões permanecem na aba Controles. O conjunto `cursor-labels` substitui o nome antigo `control-labels`, preservando textos confirmados e rascunhos. Quando ambos existem, os valores de `cursor-labels` têm prioridade, campo a campo.

## Fontes e auditoria

Foram consultados os arquivos locais do [disassembly do ISS Deluxe](https://github.com/Yoshifanatic1/International-Superstar-Soccer-Deluxe-SNES-Disassembly), em especial `Tables/Fonts/SmallMenuText.txt`, `AsarScripts/DisassembleUnknownMenuScript.asm`, `AsarScripts/AssetPointersAndFiles.asm` e o README (mapeamento LoROM e necessidade de conferir a versão da ROM). Os endereços abaixo foram verificados diretamente na ROM Deluxe Plus, pois não se presume que os deslocamentos de outra versão sejam idênticos.

- ROM Plus sem header: SHA-256 `ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a`.
- Tabela de 14 ponteiros: PC `0x3CB0F` / CPU `$87CB0F`.
- Conteúdo: PC `0x3CB2B` até `0x3D2DF`, antes da tabela de ajuda das ações dos controles em `0x3D2E0`.
- Cada linha tem 28 células SmallMenuText. O bloco do tipo B termina no início do tipo C, sem um terminador adicional. Esse limite foi preservado.
- O tile `0x53`, usado como guia pontilhada em alguns blocos, é representado pelo caractere `…` no campo editável; seu código é preservado na regravação.

A extração reproduzível está em `scripts/audit-cursor-texts.mjs` e o resultado integral em `project-data/cursor-text-audit.json`. A auditoria recusa ROMs com outro hash. Os 14 originais foram codificados e comparados byte a byte com a ROM Plus real.

| Campo de ajuda | PC inicial | Linhas |
|---|---|---:|
| Trocar página com L/R | `0x3CB2B` | 2 |
| Introdução aos tipos de cursor | `0x3CB64` | 4 |
| Tipo A | `0x3CBD5` | 4 |
| Tipo B | `0x3CC46` | 8 |
| Tipo C | `0x3CD26` | 5 |
| Tipo D | `0x3CDB3` | 5 |
| Introdução às áreas | `0x3CE40` | 5 |
| Funcionamento da área | `0x3CECD` | 8 |
| Área A | `0x3CFAE` | 5 |
| Área B | `0x3D03B` | 5 |
| Área C | `0x3D0C8` | 5 |
| Cursor automático | `0x3D155` | 5 |
| Cursor manual | `0x3D1E2` | 4 |
| Selecionar o goleiro com L+R | `0x3D253` | 5 |

Os blocos incluem as inscrições de seus popups, como Controller Type, Area, ON/OFF, On the screen, The whole field, Auto e Manual. Além deles, a aba permite editar 12 rótulos de interface: TYPE, TYPE-A/B/C/D, AREA, AREA-A/B/C, CURSOR CHANGE, AUTO e MANUAL. São **26 campos** ao todo.

## Edição e salvamento

Os textos completos das ajudas usam caixas de várias linhas, com o limite nativo visível. Espaços, quebras de linha e campos vazios são preservados. Restaurar originais (inglês) e Usar em português preenchem rascunhos; Implementar no projeto confirma. O botão em português mantém os campos cujo texto em português ainda não foi definido pelo usuário. Não foram inventadas traduções para as novas descrições.

## ROM

Os 14 blocos de ajuda possuem gravação nativa na fase **05 — Pré-Partida**. A gravação preserva a ROM-base, ponteiros, controles e blocos vizinhos. Ç é convertido para C quando necessário. Texto que excede as linhas/células ou usa glifos não disponíveis é recusado com o nome do campo, sem truncamento. Confirmar o original também restaura esse bloco após patches legados.

Os 12 rótulos gráficos de interface ainda não têm gravadores. Alterações neles permanecem no projeto e são identificadas em TEXTOS-PENDENTES.txt e no índice do ZIP; não impedem as demais exportações. As ajudas nativas não aparecem nessa lista de pendências. Desmarcar Pré-Partida omite também suas alterações do Cursor.
