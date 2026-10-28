# v2 — somente mãos, levantamento e transição limpa — 28/10/2026

Pedido do usuário após testar a v1: corrigir pixels corrompidos entre a marcação
e a escolha do cobrador; punir somente a captura com as mãos; deixar o goleiro
agarrar, levantar e segurar a bola antes da marcação.

## Mudança de ponto de observação

A v2 não modifica mais os contatos gerais `84:BA01` e `85:F8C5`.
A pesquisa começou novamente em `Routine_Macros_ISSD.asm`:

- `84:BB95` registra o tipo da bola que chega em jogador+$78 e inicia a captura.
- A sequência `84:EA79`/`84:EAA2`/`84:EABF` termina em `84:EADA`, incluindo
  levantamento e ajuste de orientação. A captura manual em salto passa por
  `85:EE94`, aterrissa em `84:EF9D`/`84:EFAA` e converge em `84:EADA`.
- `84:EB5D` chama `80:D78D`, que marca `$11FA & $0040` (posse com as mãos),
  instala a ação `$0608` e inicia o temporizador de espera com `$70=$0030`.
- `84:EB81` é a atualização de espera do goleiro já de pé com a bola. O novo hook
  mantém essa animação por 30 ciclos de jogo e só então agenda a infração.
- `$12A0` retém o jogador anterior antes de `$C8` ser substituído pelo goleiro
  em `85:F8D6`/`85:F90A`. Isso evita reservar WRAM nova para o atraso.
- `DATA_81DB1E` bit `$08` é a classificação nativa de recuo restrito consultada
  em `84:BA4A`. A v2 a verifica no tipo de bola guardado em jogador+$78; cabeçadas
  lícitas seguem o caminho nativo. Exige também posse de captura `$12F4=$000E`.
- Na captura manual, jogador+$78 antes era usado como distância do salto. Um hook
  em `85:EE94` guarda o tipo da bola antes que a atribuição nativa de posse o
  substitua por `$000E`. Não interfere na geometria de colisão nem concede uma
  captura que o jogo tenha recusado.

Durante o pequeno intervalo, o caminho da infração ignora comandos de distribuição
para permitir que a sequência solicitada termine. O temporizador nativo só avança
com o jogo em andamento. Após a marcação, o goleiro mantém a bola durante o apito
até a troca de tela, em vez de executar arremesso/chute no meio da transição.

## Correção visual

A transição anterior aguardava o preâmbulo longo de falta enquanto o goleiro podia
continuar sua distribuição. A v2 mantém a bola nas mãos e usa 48 ciclos para o
preâmbulo, seguido do fade nativo. Ao entrar em `A4:DAC0`, com `$C2=6`, mantém
`INIDISP` e seu espelho `$1EA0` em `$80` durante a preparação da próxima tela.
A inicialização nativa `80:8217` restaura a exibição na tela de destino.
NMI permanece habilitado: o processamento do jogo também executa dentro de NMI.
As transições de outros tipos não recebem esse apagamento.

## Patches da v2

| Ponto SNES | Offset | Função |
| --- | --- | --- |
| `84:EB81` | `0x26B81` | Espera com a bola nas mãos; atraso e elegibilidade |
| `85:EE94` | `0x2EE94` | Preserva o tipo do passe na captura manual |
| `A4:DBFF` | `0x125BFF` | Prepara o pênalti nativo para a equipe adversária |
| `A4:DAC0` | `0x125AC0` | Apaga a exibição durante o carregamento da próxima tela |

Código expandido: `FF:F000`–`FF:F7FF`. Não há novas variáveis persistentes em WRAM.
A base continua imutável e o editor não ativa essa experiência automaticamente.

## Verificação

Suíte completa: 693 testes passaram, sem falhas.

- Testes dos bytes 65816 emitidos: atraso para ambos os goleiros, mãos/pés,
  levantamento, origem adversária, cabeçada lícita, posse própria, eventos já
  ativos, ponteiros inválidos, captura manual, preservação de registradores e
  escrita de 8 bits em INIDISP sem tocar em OBSEL ou desabilitar NMI.
- Snes9x: partida iniciada pela própria ROM, capturas nativas em cenários
  controlados. No cenário restrito, a origem da bola é ajustada após a captura
  para reproduzir recuo recebido manualmente; não confundir isso com um replay
  completo de entrada A/B do usuário.
- Goleiro `$0500`: captura no frame relativo 78, de pé no 98, infração no 129.
  Cerca de 0,5 s visível após o levantamento; abriu a cobrança nativa da Inglaterra
  e retornou à partida após a cobrança.
- Goleiro `$1000`: captura no frame 0, de pé no 20, infração no 51; abriu a seleção
  de cobrador do Brasil.
- Controle com defesa de chute adversário e controle com cabeçada lícita: sem
  infração. Comandos A/B repetidos durante a espera não anteciparam a distribuição
  nem impediram a marcação no frame 129.
- Timeline visual revisada entre captura, apito, fade, carregamento e cobrança:
  campo preservado, intervalo preto durante a carga e tela de pênalti normal.

SHA-256 da ROM v2: `4b7f28db7b84fb6907bc54dc7afcf4fda23c07161697d3f03379f2bb7c67262f`.
A validação no Mesen com a entrada manual real fica para o teste prático do usuário.

---

# Histórico da v1 (substituído pela v2)

# ROM experimental implementada — 28/10/2026

A investigação desta etapa começou pelo disassembly. O protótipo está em
`src/core/experimental-backpass-penalty.mjs`, separado da exportação do editor.
A regra final em Regras Especiais continua bloqueada: esta entrega é a ROM de
experimento amplo solicitada, não uma implementação da regra oficial.

## Fluxo identificado no assembly e conferido na Plus

| Ponto SNES | Offset de arquivo | Função nesta implementação |
| --- | --- | --- |
| `84:BA01` | `0x23A01` | Contato, antes da atualização do último toque; hook primário |
| `85:F8C5` | `0x2F8C5` | Entrada alternativa de posse/liberação de bola; hook complementar |
| `80:B173` | `0x3173` | Copia evento `$BA` para `$BC` e chama o preparador nativo |
| `A4:DB90` | `0x125B90` | Preparação comum de reinício |
| `A4:DBFF` | `0x125BFF` | Hook de despacho, antes da tabela de eventos |
| `A4:DE9F` | `0x125E9F` | Preparação nativa de pênalti: cobrador, estatística, ponto da bola e estado 6 |
| `A4:DD27` | `0x125D27` | Pós-etapa indispensável: `$E6=0x0100` inicia a transição nativa |

Fonte: `Routine_Macros_ISSD.asm` do disassembly Yoshifanatic1 (versão USA).
Os pontos modificados e a entrada/saída do preparador têm assinaturas verificadas
na ROM Plus; o CLI também exige SHA-256 exato da base.

## Condição e funcionamento

- Papel do objeto atual `$30=1`: goleiro; modo de jogo `$70=8`.
- `$C8` identifica o último jogador a tocar na bola; objeto alinhado entre
  `$0500` e `$1A00`, diferente do goleiro atual.
- Campo `$9A` coincide entre o jogador anterior e o goleiro: mesma equipe.
- `$BA`, `$BC` e `$C0` precisam estar zerados: nenhum reinício em andamento.
- Agenda evento experimental `$7F01` em `$BA`, sem reservar WRAM arbitrária.
- Usa `$C4` como infrator e um objeto do adversário em `$C6` para selecionar a
  equipe no preparador nativo. O objeto usado como referência não é
  necessariamente o cobrador: o jogo escolhe o cobrador em `$11E8`.
- O hook do despacho converte o evento em falta nativa, seleciona posse adversária,
  zera cartões, chama `A4:DE9F` e reproduz o pós-processamento `A4:DD27`.
- Hooks em `FF:F000`, `FF:F200` e `FF:F400`; ROM expandida para 4 MiB, com tamanho
  e checksum atualizados. ROM-base permanece imutável.

O primeiro hook interrompe o processamento do contato. O complementar mantém as
instruções nativas de posse e agenda a interrupção no ciclo seguinte. Não depende
explicitamente de A/B, nem diferencia mão/pé. Este protótipo usa a equipe do último
toque, sem distinguir passe com os pés, cabeçada ou desvio: é propositalmente mais
amplo que a regra final. Não ativar silenciosamente essa regra no editor.

## Reprodução da build

```bash
node scripts/build-experimental-backpass-penalty.mjs Plus-limpa.sfc ISSSD-Recuo-Penalti-Experimental.sfc
node --test tests/experimental-backpass-penalty.test.mjs
```

Base SHA-256: `ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a`.
ROM produzida SHA-256: `089a65e98238c9697ce8e96f2c4ecd16005503b9b5449025281d431d70960d4b`.

## Validação executada

Seis testes de hooks executam os bytes 65816 emitidos, cobrindo ambos os goleiros,
preservação de registradores/flags, chute adversário, liberação do próprio goleiro,
jogador de linha, reinício ativo, ponteiros inválidos, caminho alternativo e
pós-processamento `$E6`. Não se limitam a simular a condição em JavaScript.

Em Snes9x, a ROM foi inicializada até uma partida Brasil x Inglaterra. A partir
de um estado dessa própria ROM, foi criado um cenário controlado de contato:
bola colocada no goleiro e último toque de companheiro, com o goleiro disponível
para receber a bola. Não é um replay do savestate Mesen enviado pelo usuário.

- Goleiro `$0500`: evento experimental no frame relativo 78, preparação nativa
  no frame 79, estado `$C0/$C2=6`, cobrança da Inglaterra no ponto `$0100/$0140`.
  A tela nativa de pênalti abriu, a IA cobrou e o jogo voltou ao campo.
- Goleiro `$1000`: evento no frame relativo 0, preparação no frame 1, cobrador
  do Brasil e ponto `$0640/$0140`; abriu a seleção nativa de cobrador para 1P.
- Controle com último toque adversário: nenhum evento experimental nem entrada
  no preparador do pênalti durante o mesmo cenário de teste; defesa nativa mantida.

A cobertura inclui os dois lados em cenários controlados e a volta ao jogo após
uma cobrança por IA. Captura manual A/B e partidas completas ainda precisam do
uso prático no Mesen; não declarar cobertura total de todos os tipos de contato.

---

# Registro da etapa anterior (estado histórico)

# Continuação no Work — 28/10/2026

## Contrato atual do experimento

O último pedido do usuário substitui as alternativas históricas abaixo: gerar uma
ROM experimental isolada em que **qualquer contato do goleiro com recuo do próprio
time, com mãos ou pés**, interrompa a partida e acione a rotina **nativa de pênalti**
contra sua equipe. Não exigir A/B nem captura com as mãos neste primeiro teste.
Isso é um experimento personalizado, separado da regra oficial e da implementação
final opcional em Regras Especiais. O campo persistido `goalkeeperBackpassNoHands`
permanece compatível; a exportação continua bloqueada enquanto não existir patch
validado.

## Evidência reproduzida nesta continuação

- Branch de partida: `fix/goalkeeper-backpass-investigation`, commit `a0f5f93`.
- Savestate Mesen2 SNES formato 4: `International Superstar Soccer Deluxe Plus_2.mss`.
- SHA-256 do estado: `8ab78a7bf219dd7bf05ea09a864ecb01ed5bc631cb91444396cf98d4b255ed2a`.
- 1.344 campos extraídos; WRAM de 131.072 bytes; frame 5.061.
- CPU: A=15223, X=319, Y=320, PC=$FF9B, K=$00, DBR=$81, SP=427, PS=4.
- A extração reproduz os valores do diagnóstico anterior. O PC salvo isoladamente
  não identifica a rotina de contato nem a de pênalti.
- Nenhum endereço de gameplay foi confirmado; nenhuma ROM experimental foi gerada.
- O emulador disponível localmente é Mesen-S; o estado foi produzido pelo Mesen2.
  Os formatos diferem. A compilação do Mesen2 neste ambiente não iniciou por falta
  de Clang e SDL2. Não tratar a leitura do estado como replay executado.

## Ferramenta implementada

```bash
node scripts/inspect-backpass-state.mjs antes.mss saida [depois.mss]
```

Lê o contêiner Mesen2 v4, valida seus tamanhos e campos e exporta
`backpass-wram.bin` e `backpass-state.json`. Com um segundo estado da mesma ROM
nominal, exporta `backpass-wram-diff.json`, agrupando alterações adjacentes e
mapeando offsets de WRAM para $7E:0000–$7F:FFFF. A ferramenta é somente leitura
sobre os estados de entrada e não altera a ROM. Nomes de ROM coincidentes não
comprovam ROMs com bytes idênticos; conferir a base antes de comparar capturas.

Testes cobrem compressão e estado sem compressão, truncamento, formato não
suportado, tamanho de WRAM, limites dos dois bancos, identidade e ROMs divergentes.

## Evidência ainda necessária para construir o hook

É preciso um par controlado antes/depois do contato no recuo e um par antes/depois
de uma falta que resulte em pênalti nativo, na mesma ROM. Comparar também uma defesa
legal após chute adversário. Esses pares permitem selecionar endereços candidatos;
write breakpoints/trace de CPU devem então confirmar quem os escreve, a equipe
cobradora e a transição de reinício. Um único snapshot não permite inferir esses
handlers. Não aplicar hooks em endereços escolhidos apenas pela diferença de RAM.

---

# Histórico anterior (substituído pelo contrato acima)

> **Atualização de prioridade — 28/10/2026:** usuário prefere marcar **tiro livre indireto** após captura ilegal, em vez do desvio. O plano abaixo descreve a alternativa anterior; investigar primeiro rotinas de falta e reinício (incluindo possível reutilização de controle de segundo toque do kick-off). Sem patch confirmado, manter bloqueio de exportação quando a regra estiver ativada.

## Roteiro prioritário: tiro livre indireto

1. Reproduzir recuo com os pés + captura com B, e repetir com A nos modos semi e manual.
2. Localizar a decisão de conceder posse ao goleiro e diferenciar passe deliberado com os pés, cabeçada lícita e lateral direto do companheiro.
3. Criar casos comparativos de falta existente e kick-off no Mesen; identificar variáveis de equipe cobradora, tipo de reinício, posição da bola, estado de jogadores, barreira e segundo toque.
4. Determinar se as rotinas existentes suportam cobrança dentro da área, sem novos endereços presumidos. Para infração na pequena área, usar o ponto mais próximo da linha da pequena área paralela à linha de fundo.
5. Proibir gol diretamente de cobrança indireta sem segundo toque; impedir contato antecipado irregular e respeitar posicionamento da defesa.
6. Só construir writer quando houver mapa de código/WRAM e replays reproduzíveis. Desvio permanece alternativa de contingência.

# Investigação: goleiro agarrando recuo — issue #21

## Escopo da primeira entrega

Bloquear a posse com as mãos após passe **deliberado com os pés** de um companheiro ao goleiro. A bola deve sofrer desvio ou rebatida usando uma rotina já existente, sem parar a partida e preferencialmente sem animação de contato das mãos. Não criar hitboxes por parte do corpo nesta fase. O modo semiautomático é o caso confirmado; testar também manual.

**Estado**: diagnóstico planejado; offsets, estados de WRAM, handlers 65816 e patch ainda não identificados. Não alterar a ROM comercial nem aplicar hooks por suposição.

## Hipóteses a distinguir

- H1: a rotina de recepção automática consulta uma flag de recuo, mas o comando manual usa outro caminho de captura.
- H2: ambas consultam a flag, mas ela é limpa quando o usuário seleciona o goleiro ou salta.
- H3: não há flag permanente; a captura automática infere o tipo de passe apenas quando o toque acontece.
- H4: a animação de rebatida também concede posse de bola em algum ramo; é preciso interceptar a atribuição de posse.

Nenhuma dessas hipóteses está comprovada.

## Experimento controlado no Mesen

1. Executar a ROM Plus base em partida com goleiro semiautomático; criar savestate S0 **antes do recuo** e S1 imediatamente antes da colisão.
2. De S1, executar A/B e reproduzir a captura ilegal; registrar frame, PC 65816, call stack, registers, comandos e bytes de WRAM estáveis/alterados.
3. Restaurar S1 e não pressionar A/B: registrar captura automática sem mãos/domínio, coordenadas, velocidade da bola, estado e animação do goleiro.
4. Reproduzir a mesma trajetória após chute de adversário e testar captura legal. Registrar diferença de WRAM antes da colisão e transições que concedem posse.
5. Repetir S0/S1 no modo manual, com recuo rasteiro e elevado, e com cabeçada lícita de companheiro.
6. Em cima do endereço candidato à posse, colocar write breakpoint (WRAM) e rastrear para trás até o branch que decide **agarrar / rebater / dominar**.
7. Mapear PC SNES para offset físico da ROM Plus somente depois de verificar mapeamento LoROM/HiROM, banco e possíveis hooks da versão expandida; comparar bytes da original com a Plus.

### Artefatos locais (não commitar ROM)
- `goalkeeper-backpass-S0.mss`, `goalkeeper-backpass-S1.mss` ou extensão gerada pelo Mesen.
- `backpass-illegal-trace.txt`, `backpass-legal-trace.txt`, `backpass-passive-trace.txt`.
- `backpass-wram-diff.json`: observações e endereços candidatos, **não** tratá-los como mapeamento confirmado.
- Capturas de tela dos frames imediatamente anteriores e posteriores à colisão.

## Contrato desejado da correção

```text
onGoalkeeperBallContact:
  if ball.isDeliberatelyKickedByTeammate
     and backpassRestrictionStillApplies:
       avoidCatchTransition()
       chooseExistingNonHandDeflectionWhenAvailable()
       keepBallLooseAndInPlay()
  else:
       executeOriginalGoalkeeperContact()
```

Pseudocódigo conceitual, não representa funções comprovadas da ROM.

### Cuidados

- Não considerar toda bola vinda do próprio time um recuo ilegal.
- Não punir cabeçada de companheiro ou mero desvio involuntário.
- Não desligar controles A/B: mudar a resolução da colisão/captura.
- Se a animação de A/B tocar visualmente a bola com a mão, **não** afirmar que o patch é legalmente correto; selecionar caminho nativo alternativo sem mão.
- Não injetar falta indireta nesta versão.
- Não presumir uma flag de recuo até que ela seja observada.
- Um simples smoke test de inicialização não valida esse bug: precisa replay da situação na partida.

## Integração prevista

Após mapear e reproduzir o ponto:
- Introduzir writer semântico isolado do gameplay, aplicado durante `buildPlusProjectRom`, preservando ROM-base imutável.
- Guardar intenção da correção no projeto, não offsets/bytes físicos.
- Testar o writer em bytes, a build determinística e um replay do savestate na ROM produzida.
- Manter a opção desligada até validação em Mesen.

## Critérios de aprovação

1. Sem posse das mãos após recuo proibido nos modos semi e manual.
2. Bola continua em movimento após o contato e goleiro pode disputar com os pés.
3. Animação não encosta mãos na bola, ou a implementação é recusada como incompleta.
4. Chute adversário permite defesa normal.
5. Cabeçada lícita e desvio involuntário não são classificados como recuo deliberado.
6. Nenhum travamento, perda de controle, gol fantasma ou alteração de bola parada em replay.
