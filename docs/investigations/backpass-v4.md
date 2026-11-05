# Recuo: v4 — cobertura dos caminhos comuns de posse

A análise começou pelo disassembly `Routine_Macros_ISSD.asm`, rotinas
85:F877, 85:F89B, 85:F8C5 e seus chamadores. Os bytes foram verificados na
ROM Plus limpa pelo gerador antes da aplicação.

A v3 observava 84:BA01 e 85:EE94. Outros caminhos chegam a 85:F8C5
sem passar por esses pontos. Eles substituem 12F4 e C8, perdendo a origem
antes de uma captura posterior. A v4 observa as três entradas compartilhadas
antes de STX 12F4, preservando registradores e flags e executando as instruções
nativas deslocadas. O registro continua restrito ao goleiro e preservado em
contatos consigo mesmo. A marcação continua restrita à posse com mãos,
após a espera em pé; pés, adversário e cabeçada permitida não são punidos.

## Evidência

Caso controlado no Snes9x libretro, com o registro privado zerado:
primeiro contato nativo (ação 19) no frame 6, seguido de nova trajetória
para captura pelo comando do controle. As posições e a trajetória foram
preparadas em WRAM para reprodução; não é uma reprodução completa dos
comandos do vídeo enviado pelo usuário.

- v3: captura frame 2, em pé frame 27, nenhum evento de pênalti.
- v4: captura frame 2, em pé frame 29, evento de pênalti frame 61.
- Controles no emulador: só pés sem evento; cabeçada sem evento; captura
  de bola adversária sem evento.
- 697 testes do projeto passaram, incluindo as três entradas para ambos
  os goleiros e preservação dos registradores e flags.

`backpass-v4-emulator-case.py` documenta o cenário para o runner ctypes
Snes9x usado na investigação (requer o estado clean-advance e o runner;
não faz parte dos testes portáveis). ZSNES não foi executado neste ambiente.

ROM SHA-256: dbb9f5cb36fdc84df39db34396dd950e4ee6949e96d5c4c2f8f802eba4bfda12.

## Etapa posterior solicitada

Não integrar ainda ao Editor. Depois da validação da regra, criar uma aba
entre as primeiras chamada “Melhorias de Jogo”. Opção desmarcada mantém a
regra original; opção marcada aplica a correção experimental.

Título: “Impedir que usuário burle recuo ao goleiro.”
Descrição: “Não deixa que o usuário com goleiro semiautomático segure a bola
com as mãos após recuo de outro jogador de sua equipe.”

Outras opções futuras: bug de pegar bola no replay do pênalti e tiro de meta
rasteiro com B. Não implementadas nesta etapa.

## Integração no Editor

A regra validada pelo usuário agora é opcional em “Melhorias de Jogo”, logo
após Visão Geral. Usa o campo persistente `specialRulesV1.goalkeeperBackpassNoHands`.
Projetos sem esse campo começam desmarcados. O arquivo-base continua imutável;
a ROM é reconstruída e a regra desmarcada não escreve nenhum hook.

A exportação cumulativa adiciona a fase 12 `melhorias-jogo`, sem renumerar
as anteriores. Hooks, código e expansão da SRAM pertencem à mesma fase,
para evitar uma ROM intermediária com patch parcial. O writer reutiliza
os bytes da v4 e rejeita conflitos com outras gravações nas mesmas posições.
A categoria também participa da abertura/salvamento seletivo do projeto.
As opções de replay e tiro de meta B são somente itens futuros.

Validação: build do HTML e invariantes finais aprovados; 698 testes da suíte
completa e teste adicional do runtime de preferências aprovados. Exportação
real do projeto Plus verificada (sem a fase de imagem inicial, que exige
conversão gráfica do navegador). Chromium não disponível neste ambiente;
a inspeção visual em navegador permanece pendente.
