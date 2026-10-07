# Matriz de migração funcional do ISSSD Studio

Este documento transforma a linha histórica do monólito em um plano verificável de migração para o núcleo modular atual.

## Critério de status

- **MIGRADO**: existe representação semântica ou writer modular no `src/`, com testes automatizados específicos.
- **PARCIAL**: existe infraestrutura modular relevante, mas a funcionalidade completa do Studio ainda depende de compatibilidade legada, patches persistidos, UI ausente ou semântica incompleta.
- **LEGADO**: funcionalidade conhecida do monólito/histórico, ainda sem módulo semântico equivalente no núcleo novo.
- **A VALIDAR**: há evidência histórica da função, mas ainda precisamos extrair contrato, offsets/formato ou comportamento de um snapshot aprovado antes de implementar.

Um patch histórico que ainda é apenas reproduzido byte a byte **não conta como migração da funcionalidade**.

## Infraestrutura transversal

| Área | Status | Implementação atual | Testes / observação |
| --- | --- | --- | --- |
| ROM-base Plus imutável | MIGRADO | `plus-baseline.mjs`, `plus-base-verifier.mjs` | baseline/hash validados |
| Build determinístico | MIGRADO | `build-plus.mjs`, `project-build.mjs` | build repetido byte-idêntico; projeto real validado |
| Checksum SNES | MIGRADO | `rom-integrity.mjs` | testes unitários + build real |
| Abrir projeto sem mutar ROM | MIGRADO | `project-open.mjs`, `project-state.mjs` | regressão v6.93 coberta |
| Migração semântica de projeto legado | PARCIAL | `project-semantic.mjs`, compatibilidade `rle-base64-v1` | jogadores/táticas cobertos; demais áreas ainda podem permanecer como patches |
| Patches legados ordenados | MIGRADO como compatibilidade | `canonical-patches.mjs` | RLE, overlap redundante e last-write-wins legado testados |
| Geração de infraestrutura apenas no build | MIGRADO para táticas | `plus-tactics-infrastructure.mjs` | expansão não deve persistir no `.issdproj` |
| Host/browser/desktop abstraction | PARCIAL | `browser-host.mjs`, `host-bridge.mjs`, `studio-session.mjs` | ainda falta fechar serialização/salvamento final do projeto desktop |
| Smoke test Mesen | MIGRADO mínimo | scripts Mesen + runner | ROM-base e ROM gerada sobrevivem 1200 frames |
| Teste semântico de telas no Mesen | PARCIAL | profile/probe/analyzer existem | ainda sem endereço WRAM semântico confirmado |

## Jogadores e escalação

| Funcionalidade histórica | Status | Implementação atual / falta |
| --- | --- | --- |
| Banco de 56 equipes × 20 jogadores × 7 bytes | MIGRADO | `plus-player.mjs` |
| Skills 1–10 ↔ nibbles 0–9 | MIGRADO | player core + testes |
| Posição natural | MIGRADO | player core + testes |
| Número da camisa | MIGRADO no writer | escrita cirúrgica coberta; regra de unicidade/troca automática ainda precisa existir na camada de edição/UI |
| Aparência raw | PARCIAL | preservada como dado opaco; sem writer semântico validado |
| Espelho especial do Brasil | MIGRADO | `plus-player-writer.mjs`; slots 2..7 + caso Pelé/Pardilla cobertos |
| Argentina sem espelho do Brasil | MIGRADO | comportamento coberto por teste |
| Edição de nomes de jogadores | LEGADO | histórico v6.34/v6.84+; precisa extrair codec/layout aprovado e criar writer semântico |
| Espaço, ponto e apóstrofo em nomes | LEGADO | regra funcional conhecida, ainda sem módulo novo |
| Camisas 1–20 únicas com troca automática | PARCIAL | writer grava camisa; lógica de edição/normalização ainda não modularizada |
| Troca de ordem da escalação | LEGADO | histórico v6.88/v6.92; precisa extrair estrutura semântica |
| Trocar slots titulares sem alterar camisa | LEGADO | requisito conhecido; sem writer modular específico |
| Titulares/reservas | LEGADO | UI/estado ainda não formalizados |

## Táticas / formação / campo

| Funcionalidade histórica | Status | Implementação atual / falta |
| --- | --- | --- |
| Registro físico de tática de 31 bytes | MIGRADO | `plus-tactics-record.mjs` |
| Coordenadas PosX/PosY | MIGRADO | record/state/writer; conversões testadas |
| Endereçamento/pointer table | MIGRADO | `plus-tactics-address.mjs` |
| Infraestrutura para táticas personalizadas | MIGRADO | `plus-tactics-infrastructure.mjs` |
| Expansão 2 → 4 MiB em build | MIGRADO | infraestrutura gerada, não persistida |
| Estado semântico de tática | MIGRADO | `plus-tactics-state.mjs` |
| Writer cirúrgico de tática | MIGRADO | `plus-tactics-writer.mjs` |
| Setas/controles de posicionamento | LEGADO/UI | sem camada nova de interface |
| GK fixo | LEGADO/UI + regra | precisa formalizar validação de edição |
| Coluna ATACAR | LEGADO/UI | representação de UI ainda não migrada |
| Formação personalizada completa por equipe | PARCIAL | formato de tática migrado; fluxo de escalação/equipe ainda não |

## Textos, menus e metadados

| Funcionalidade histórica | Status | Próxima ação |
| --- | --- | --- |
| Textos customizados | LEGADO | extrair codecs/tabelas da linha v6.58+ |
| Fonte nativa/original para controles | LEGADO | extrair fonte/tiles e contrato de escrita |
| Texto por tela, não por palavra | LEGADO | formalizar modelo semântico de strings por tela |
| Quebra de linha por espaços | LEGADO | transformar regra em codec/layout testável |
| Estratégias como campo inteiro | LEGADO | extrair tabela e limites reais |
| Preset de textos em português | LEGADO/UI | implementar só após codec semântico |
| Menu principal customizado | LEGADO | histórico v6.76–v6.82; extrair offsets/layout aprovado |
| Título interno da ROM | LEGADO | histórico v6.65/v6.66; candidato de baixa complexidade após extração do contrato |
| `romMeta` / metadados | PARCIAL | fluxo histórico conhecido; sem módulo dedicado atual |

## Seleção de equipes, grupos e organização

| Funcionalidade histórica / requisito | Status | Próxima ação |
| --- | --- | --- |
| Organização das equipes | LEGADO | extrair estrutura de slots/IDs e writer |
| Grupos Plus AMERICA 1–3, EUROPE 1–4, ASIA, AFRICA | LEGADO | criar modelo semântico de grupos |
| Slot vazio `0x70` | A VALIDAR | regra conhecida, precisa contrato completo da tabela |
| Mapeamento Plus 54→56 equipes | A VALIDAR | IDs conhecidos; falta formalizar tabela integral |
| Tela de seleção sem TEAM STATISTICS | LEGADO | edição gráfica/textual ainda não modularizada |
| FORMAÇÃO/GO/DF/MC/AT | LEGADO | idem |
| 1P ativo | LEGADO | controle de seleção/UI ainda não migrado |
| Distintivos quadrados com transparência | LEGADO | pipeline gráfico ainda não migrado |
| Grupo secreto All Stars IDs 61..66 | A VALIDAR | histórico de travas/fonte corrompida exige engenharia antes de writer |

## Tela inicial, imagens e cores

| Funcionalidade histórica / requisito | Status | Próxima ação |
| --- | --- | --- |
| Camadas da tela inicial | LEGADO/UI | precisa modelo de assets + compositor |
| Referência vazada superior | LEGADO/UI | idem |
| Substituição/posição/escala por elemento | LEGADO/UI | idem |
| Fundo/telas 1P e 2P com cores editáveis | LEGADO | extrair paletas/endereços aprovados |
| Cores de botões | LEGADO | extrair paletas/endereços aprovados |
| Prévia visual | LEGADO/UI | reconstruir sobre módulos, sem copiar dependências frágeis do monólito |

## Áudio

| Funcionalidade | Status | Próxima ação |
| --- | --- | --- |
| Comparação/identificação de narração | A VALIDAR | investigação separada; não há writer de áudio no core atual |
| Substituição de narração/áudio | LEGADO ou não formalizado | só implementar após mapear bancos/ponteiros e limites |

## Projeto `.issdproj`

| Funcionalidade | Status | Implementação atual / falta |
| --- | --- | --- |
| Leitura de projeto moderno | MIGRADO | project state/open |
| Leitura de patchesCompact RLE legado | MIGRADO | canonical patches |
| Migração `attrHex` → `playerEdits` | MIGRADO | semantic migration |
| Descarte de `tactics.rawHex` legado | MIGRADO | semantic migration |
| Persistência de estado semântico | PARCIAL | jogadores/táticas têm modelo; demais domínios ainda não |
| Salvar projeto pelo Studio desktop | PARCIAL | `StudioSession` existe; contrato final de serialização ainda precisa ser fechado |
| Reabrir projeto e reaplicar sobre ROM-base limpa | MIGRADO arquiteturalmente | núcleo novo separa open de build |

## Ordem de migração recomendada

A sequência abaixo minimiza risco e evita voltar a persistir bytes físicos como estado principal:

1. **Fechar o contrato de serialização do `.issdproj` moderno**: versão de schema, domínios semânticos e round-trip estável.
2. **Nomes de jogadores**: já convivem diretamente com o domínio de jogadores e têm alto valor funcional.
3. **Escalação/ordem/camisas**: completar o domínio de equipe antes de construir a UI nova.
4. **Título interno + `romMeta`**: domínio pequeno e isolável, bom para validar o padrão writer + teste.
5. **Textos e menu principal**: extrair codec/layout e abandonar a edição por offsets soltos.
6. **Organização de equipes/grupos/seleção**: formalizar tabelas e IDs antes da interface.
7. **Assets gráficos, paletas e tela inicial**.
8. **All Stars/expansões especiais** apenas depois que as tabelas regulares estiverem semânticas e testadas.
9. **Áudio** como subsistema separado.

## Regra para cada migração

Nenhuma função deve ser marcada como MIGRADO apenas porque a ROM real continua sendo reproduzida por patches históricos. Para cada domínio, o ciclo esperado é:

```text
snapshot histórico aprovado
    ↓
extrair contrato/formato/endereço
    ↓
reader/estado semântico
    ↓
writer cirúrgico
    ↓
teste unitário de bytes
    ↓
teste de round-trip/projeto
    ↓
build determinístico
    ↓
Mesen como regressão de integração quando aplicável
```

A matriz deve ser atualizada no mesmo commit em que uma funcionalidade muda de status.