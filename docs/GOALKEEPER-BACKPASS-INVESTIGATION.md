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
