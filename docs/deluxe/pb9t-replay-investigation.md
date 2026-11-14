# Investigação da referência PB9T

Referência indicada pelo usuário como livre da defesa durante o replay:
`ISSDPLUS_PB9T.sfc`, 2.097.152 bytes, SHA-256
`5c6a9e17e9ebd8f1a72f110476010c67a31091c7146c90dab276cffbd86219e0`.

Comparação com a Plus limpa SHA-256
`ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a`:
4.699 bytes diferentes em 626 intervalos contíguos. Há alterações de tabelas,
táticas, salvamento, menus e gráficos; esse diff não é um patch isolado de replay.

Observações verificadas na desmontagem e nos bytes:

- O dispatcher de replay é 8B:AB42, com reprodução em 8B:ACB3 e comandos
  A/B de avanço/retrocesso em 8B:AD1E. Bloquear esses botões indiscriminadamente
  removeria controles nativos da reprodução.
- A rotina de captura manual do goleiro, 85:EE57/EE94, mantém a sequência
  original na PB9T. Portanto não há fundamento para atribuir a correção a um
  bloqueio novo nessa entrada.
- A PB9T modifica 84:EA1C para chamar 84:FFB3, tratando as entradas dos dois
  controles e limpando 008E. Isso merece teste no fluxo da cobrança/captura,
  mas não foi demonstrado como correção autônoma do replay.
- O hook 84:8073 da Plus limpa para interferência na cobrança não está na
  PB9T; ela volta ao LDA/LSR original nesse ponto. Copiar ambos os tratamentos
  como se fossem a mesma melhoria seria uma atribuição não comprovada.
- O salvamento PB9T também difere do salvamento da Plus limpa. A adaptação
  Deluxe de bateria usa somente o password nativo, assinatura e checksum,
  sem importar essas rotinas maiores ou os mecanismos de proteção da ROM.

Estado: referência preservada; opção `penalty-replay` continua desabilitada.
Falta reproduzir a divergência Deluxe/PB9T com a mesma sequência de cobrança,
replay e controles, reduzir as alterações que a eliminam e validar a combinação
com `penalty-interference` e recuo. Não foi anunciado um patch de replay concluído.
