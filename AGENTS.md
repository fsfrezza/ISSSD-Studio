# Investigação de ROM SNES

Por instrução do usuário, a pesquisa de comportamento do jogo deve sempre começar
pelo disassembly. Localize o fluxo e seus chamadores, leia as rotinas completas e
confira os bytes na ROM alvo antes de propor hooks ou depender de novas capturas.
Use emulação, traces e savestates para verificar a interpretação do assembly.

Referência: Yoshifanatic1/International-Superstar-Soccer-Deluxe-SNES-Disassembly,
especialmente `International_Superstar_Soccer_Deluxe/Routine_Macros_ISSD.asm`.
A ROM Plus deve ter sua compatibilidade verificada; endereços da versão USA não
devem ser presumidos compatíveis com outros hacks.
