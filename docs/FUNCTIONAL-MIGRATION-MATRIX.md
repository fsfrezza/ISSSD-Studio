# Matriz de migração funcional do ISSSD Studio

Este documento transforma a linha histórica do monólito em um plano verificável de migração para o núcleo modular atual.

## Critério de status

- **MIGRADO**: existe representação semântica ou writer/contrato modular no `src/`, com testes automatizados específicos.
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
| Schema moderno + serialização canônica `.issdproj` | MIGRADO | `project-serialize.mjs`, `StudioSession.saveProject()` | schema/version explícitos; patches JSON-safe; round-trip canônico testado |
| Migração semântica de projeto legado | PARCIAL | `project-semantic.mjs`, compatibilidade `rle-base64-v1` | atributos, nomes, táticas e Estratégias cobertos; demais áreas ainda podem permanecer como patches |
| Patches legados ordenados | MIGRADO como compatibilidade | `canonical-patches.mjs` | RLE, overlap redundante e last-write-wins legado testados |
| Geração de infraestrutura apenas no build | MIGRADO para táticas | `plus-tactics-infrastructure.mjs` | expansão não deve persistir no `.issdproj` |
| Host/browser/desktop abstraction | PARCIAL | `browser-host.mjs`, `host-bridge.mjs`, `studio-session.mjs` | contrato de salvar projeto fechado; host desktop/Tauri ainda não concluído |
| Smoke test Mesen | MIGRADO mínimo | scripts Mesen + runner | ROM-base e ROM gerada sobrevivem 1200 frames |
| Teste semântico de telas no Mesen | PARCIAL | profile/probe/analyzer existem | ainda sem endereço WRAM semântico confirmado |

## Jogadores e escalação

| Funcionalidade histórica | Status | Implementação atual / falta |
| --- | --- | --- |
| Banco de 56 equipes × 20 jogadores × 7 bytes | MIGRADO | `plus-player.mjs` |
| Skills 1–10 ↔ nibbles 0–9 | MIGRADO | player core + testes |
| Posição natural | MIGRADO | player core + testes |
| Número da camisa | MIGRADO | writer cirúrgico + operações semânticas em `plus-team-roster.mjs` |
| Aparência raw | PARCIAL | preservada como dado opaco; sem writer semântico validado |
| Espelho especial do Brasil | MIGRADO | `plus-player-writer.mjs`; slots 2..7 + caso Pelé/Pardilla cobertos |
| Argentina sem espelho do Brasil | MIGRADO | comportamento coberto por teste |
| Edição de nomes de jogadores | MIGRADO | `plus-player-name.mjs`, `plus-player-name-state.mjs`, writer integrado e migração de `isssd-name-roster-v1` |
| Espaço, ponto e apóstrofo em nomes | MIGRADO | codec TallMenuText validado; apóstrofos equivalentes normalizados para byte `0x5A` |
| Alinhamento de nome / goleiros centralizados | MIGRADO | left/center/right/manual preservados; slots de goleiro forçam centro como no monólito |
| Camisas 1–20 únicas com troca automática | MIGRADO no domínio | `planPlusJerseySwap()` reproduz a troca individual; atribuição de equipe inteira exige permutação única 1–20 |
| Troca de ordem da escalação | PARCIAL | troca tática segura dos titulares está modelada; reordenação física de registros continua bloqueada sem mapa comprovado |
| Trocar slots titulares sem alterar camisa | MIGRADO no domínio | `swapPlusStarterTacticalAssignments()` troca apenas PosX/PosY/classe/ATACAR e preserva identidade/nome/camisa |
| Titulares/reservas | PARCIAL | contrato físico conhecido (11 titulares + 9 reservas); camada de UI ainda não reconstruída |
| Reordenar fisicamente registros de 7 bytes | BLOQUEADO/A VALIDAR | monólito registra ausência de mapa independente comprovado; não implementar por inferência |

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
| GK fixo | PARCIAL | goleiro fica fora dos 10 slots táticos de linha; validação/UI ainda precisa ser reconstruída |
| Coluna ATACAR | MIGRADO no domínio / UI pendente | flag tática já é semântica e participa da troca segura; representação visual ainda falta |
| Formação personalizada completa por equipe | PARCIAL | formato de tática migrado; fluxo completo de equipe/UI ainda não |

## Textos, menus e metadados

| Funcionalidade histórica | Status | Próxima ação |
| --- | --- | --- |
| Textos customizados | PARCIAL | Estratégias já têm codec/writer semântico; demais telas ainda precisam ser extraídas individualmente |
| Fonte nativa/original para controles | LEGADO | extrair fonte/tiles e contrato de escrita por tela; não confundir fonte gráfica com strings nativas |
| Texto por tela, não por palavra | MIGRADO para Estratégias / PARCIAL geral | `plus-strategy-text.mjs` modela cada uma das 8 estratégias como uma frase completa |
| Quebra de linha por espaços | MIGRADO para Estratégias / PARCIAL geral | duas linhas de 10 posições; quebra exclusivamente entre palavras e centralização por linha |
| Estratégias como campo inteiro | MIGRADO | 8 registros nativos de 20 bytes; reader/codec/writer + migração das chaves `strategy.screen.v614.*` |
| Preset de textos em português | MIGRADO no domínio / UI pendente | descritores guardam os 8 textos PT-BR validados; interface nova ainda não reconstruída |
| Menu principal customizado | LEGADO | separar strings/composição semântica dos assets gráficos e extrair o writer realmente confirmado |
| Título interno da ROM | MIGRADO | `plus-rom-meta.mjs`; 21 bytes ASCII em `0x7FC0`, aplicado semanticamente antes do checksum |
| `romMeta` / metadados | PARCIAL | título interno possui writer semântico; demais campos do cabeçalho continuam apenas como metadados/integridade |

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
| Migração `isssd-name-roster-v1` → `playerEdits` | MIGRADO | `nameHex` é decodificado semanticamente; bytes inválidos vão para quarentena |
| Migração das Estratégias de `textWorkspaceV2` | MIGRADO | extrai só `strategy.screen.v614.*` para `plusStrategyTexts`; intenções não relacionadas permanecem intactas |
| Descarte de `tactics.rawHex` legado | MIGRADO | semantic migration |
| Schema moderno/versionado de saída | MIGRADO | `isssd-studio-project-v1`, versão 1, perfil `plus` |
| Round-trip abrir → canonicalizar → salvar → reabrir | MIGRADO | `project-serialize.test.mjs` |
| Persistência de estado semântico | PARCIAL | jogadores, táticas, Estratégias e título interno têm modelo; demais domínios ainda não |
| Salvar projeto pelo `StudioSession` | MIGRADO | não reapresenta contêiner legado; salva documento canônico moderno |
| Host desktop/Tauri para salvar arquivo | LEGADO/PARCIAL | contrato existe, implementação desktop final ainda não |
| Reabrir projeto e reaplicar sobre ROM-base limpa | MIGRADO arquiteturalmente | núcleo novo separa open de build |

## Ordem de migração recomendada

A sequência abaixo minimiza risco e evita voltar a persistir bytes físicos como estado principal:

1. **Contrato de serialização do `.issdproj` moderno — CONCLUÍDO**: schema/version, JSON seguro e round-trip canônico.
2. **Nomes de jogadores — CONCLUÍDO**: codec, ponteiros Plus, writer, migração de projeto legado e testes específicos.
3. **Escalação/camisas — PARCIALMENTE CONCLUÍDO**: swap de camisa e troca tática segura entre titulares já são contratos testados; reordenação física permanece bloqueada até prova do mapeamento.
4. **Título interno + `romMeta` — CONCLUÍDO PARA O TÍTULO**: writer semântico do título validado; não ampliar para bytes de integridade derivados.
5. **Textos e menu principal — EM ANDAMENTO**: Estratégias concluídas como primeiro subdomínio nativo; próximo passo é separar texto lógico, composição e assets gráficos do Menu Principal.
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

A matriz deve ser atualizada sempre que uma funcionalidade muda de status.
