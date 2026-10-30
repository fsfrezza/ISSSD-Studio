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

## Versão v2 aprovada e integração definitiva

O usuário aprovou `ISSSD-Recuo-Tiro-Livre-v2.sfc`, SHA-256
`3d22305653c0c535fb2f0616e20943622e36f4ef8e135573a87dfc860d878bc1`.
A implementação foi movida sem mudar seus bytes para
`src/core/backpass-free-kick.mjs`; o gerador experimental reexporta esse código.

A v2 corrige a corrupção gráfica reproduzida com o goleiro visível: a saída da
posse com as mãos agora usa a ação nativa zero, que reinicializa os descritores,
em vez de saltar direto à ação 0010 com a pose anterior ainda carregada.
O pênalti validado anteriormente permanece intocado.

Se a bola estiver a menos de 0100 unidades da linha de fundo (distância nativa
da marca do pênalti), todos os destinos longitudinais da barreira vão para a
linha do gol. O hook de chegada 84:AF84 também posiciona os pés exatamente no
destino, eliminando a tolerância que permitia parar dentro do gol. Ambos os
lados foram testados, com seis jogadores chegando à linha em cada lado.

A fase 12 agora possui também os hooks 84:E4FE e 84:AF84 e todo o bloco
FF:F000–FFFF. O writer aplica a variante completa; a exportação cumulativa não
pode omitir os helpers novos. Desmarcada, não aplica esses hooks.

Verificação real de exportação: o runtime da aba foi extraído do HTML servido,
montado no DOM, usado para marcar tiro livre, salvar/reabrir o estado e enviar
o projeto ao endpoint HTTP utilizado pelo Editor. O ZIP retornou status
complete e zero ranges não classificados. Os 14 trechos da regra são idênticos
aos da ROM aprovada. A ROM completa tem 558 bytes diferentes: preparação
obrigatória de expansão/táticas do Studio (incluindo sua assinatura) e checksum.
Construir essa infraestrutura e sobrepor a regra aprovada reproduz exatamente,
byte por byte, os 4 MiB exportados. A ROM extraída do ZIP também concluiu o
cenário de goleiro visível no Snes9x, sem a corrupção anterior.

O mesmo endpoint exportou o projeto canônico completo com FK e CK habilitados.
Todos os trechos do recuo continuaram idênticos. A máscara 03 e o filtro 65816
extraídos da ROM final liberaram o goleiro nos dois seletores. Iniciando uma
partida nova dessa ROM completa no Snes9x, o cenário de goleiro visível concluiu
a cobrança e retornou ao jogo sem a corrupção reproduzida anteriormente.
