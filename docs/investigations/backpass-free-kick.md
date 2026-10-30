# Recuo: tiro livre direto dentro da área

## Escolha no Editor

Em Melhorias de Jogo, a correção do recuo continua desmarcada por padrão.
Marcada, permite escolher Pênalti ou Tiro livre direto dentro da área. São
alternativas exclusivas; os recursos já presentes na Plus continuam bloqueados.

O projeto guarda `specialRulesV1.goalkeeperBackpassNoHands` e
`specialRulesV1.goalkeeperBackpassPunishment` (`penalty` ou `free-kick`).
Projetos antigos com o booleano verdadeiro e sem punição explícita mantêm
pênalti. A abertura restaura a escolha; a geração canônica aplica o código na
fase 12, Melhorias de Jogo. A ROM-base permanece imutável. Desmarcar e gerar
novamente reconstrói o comportamento original.

## Fluxo nativo e escopo

Fonte: Yoshifanatic1/International-Superstar-Soccer-Deluxe-SNES-Disassembly,
`Routine_Macros_ISSD.asm`. Foram lidos os chamadores e as rotinas completas
A4:DD11, A4:DD45–DE6C, A4:DE9F–DEFC, A4:E04C, 84:8544 e 85:EECE.
Os bytes são conferidos na ROM Plus antes de instalar o patch.

O evento privado do recuo continua usando a detecção validada de origem e a
espera do goleiro em pé. Para tiro livre, arma um marcador temporário e chama
A4:DD45. Em A4:DD51, após o teste nativo 80:D978, o desvio consome o marcador
e continua em A4:DD57, preparando a falta. Sem marcador, o carry original
continua decidindo: fora da área, falta; dentro da área, pênalti. O marcador
é consumido uma vez e também zerado ao iniciar partida.

A4:DD57 prepara o cobrador e a barreira e escolhe o estado 4 ou 5. A cobrança
usa o ponto da infração (CA/CE e 11F0/11F2), sem transportar a bola à marca do
pênalti. O goleiro infrator sai da animação com as mãos via 84:8544; a posse
é preparada pelo helper nativo 85:EECE. O tiro livre retoma no campo, com
E6 zerado. Reutilizar o fade exclusivo do pênalti não é correto para esse fluxo.

A opção Pênalti conserva exatamente os mesmos bytes da implementação anterior.
O hook adicional de decisão e o bloco FF:FD00 só são instalados no modo tiro
livre. Os blocos de goleiro batedor não se sobrepõem a esses destinos.

## Validação e limites

Testes portáveis executam os bytes 65816 emitidos, verificando ambos os
goleiros, consumo único do marcador, preservação de registradores e do carry,
penalidades comuns, reinício da partida, exportação cumulativa e round-trip
do projeto. O writer também rejeita bases incompatíveis e conflitos físicos.

No Snes9x libretro, uma partida iniciada do zero forneceu o estado `live`.
O caso `backpass-free-kick-emulator-case.py` prepara a posse com as mãos e o
registro privado de recuo de um companheiro. O restante executa o patch real:
evento 7F01, evento nativo 3, cobrança tipo 5, chute e retorno ao estado de
jogo com C0/C2 zerados. Ambos os goleiros foram exercitados, em seus lados
do campo. Não é uma reprodução completa de um passe e captura por comandos.
O caso requer o runner ctypes usado na investigação, uma ROM gerada e o
estado `live`; `KEEPER=0x1000` escolhe o segundo goleiro. ROMs e estados não
integram o repositório. ZSNES não foi executado nesta etapa.

A ROM canônica também foi exercitada com as duas opções de goleiro batedor
ativadas: cobrança tipo 5, chute e retomada do processamento normal; a bola
posteriormente saiu de campo e iniciou uma reposição nativa. Sem colisão de
hooks. A base usada tem SHA-256
`ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a`.

Validação local: 735 testes da suíte completa passaram; build completo do
Editor, invariantes finais e integridade dos arquivos protegidos aprovados.
Depois, os 27 testes focados passaram, incluindo o teste adicional de
coexistência/conflito. A montagem real do DOM e a mudança do select até a
finalização do projeto também foram verificadas. O teste de emulador cobre
um estado preparado, conforme descrito acima; não substitui uma rodada
manual em todas as situações de partida.
