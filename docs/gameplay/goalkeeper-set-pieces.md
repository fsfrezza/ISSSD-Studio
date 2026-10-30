# Goleiro batedor de faltas e escanteios

A aba **Melhorias de Jogo** oferece duas escolhas independentes, inicialmente
marcadas como falsas: `goalkeeperFreeKickTaker` e `goalkeeperCornerKickTaker`.
Elas pertencem a `state.semantic.specialRulesV1`, mantendo o schema v1 e o
recuo opcional existente. Projetos anteriores continuam com ambas desligadas.
A geração cumulativa aplica o recurso somente na fase 12, Melhorias de Jogo.
O usuário define o batedor oficial em Substituições, antes do jogo ou na pausa.

## Implementação verificada

Origem: disassembly de Yoshifanatic1,
`International_Superstar_Soccer_Deluxe/Routine_Macros_ISSD.asm`, e experimento
v7 aprovado em partida pelo usuário. Todos os bytes nativos foram conferidos
na Plus(7). Não presumir compatibilidade com outros hacks.

- `86:AB4F`: a rejeição de índice zero passa por um filtro. `$1E=3` identifica
  FK e `$1E=4` identifica CK. O filtro libera zero somente para a escolha
  habilitada; outros menus e índices de linha seguem a rotina original.
- Os quatro leitores do batedor fazem DEC antes de mascarar o byte. Zero
  produz o objeto de goleiro em base-0x100, em vez de base-1.
- As rotinas nativas de preparo, transporte e colocação da bola são mantidas.
  O renderizador usa os quadros de goleiro, incluindo espera com mãos na
  cintura, caminhada, mãos segurando a bola, contato e continuidade do chute.
- Os estados `0448/0450` da troca de lado usam caminhada de goleiro. No contato
  `0440`, `$7A & 4` escolhe a inversão horizontal da pose de chapada.
- Os dados de caminhada com bola vieram da composição de quadros nativos da
  v6. Apenas esses dados são relocados para uso no Editor; não se reservam as
  áreas FC/FD do pacote experimental, pois o Studio já as usa para textos,
  cabelo e menus. As novas reservas são PC `3F2000..3F7C5B` e
  `3F8000..3FC443`, com ponteiros corrigidos em `FF:EA00`.
- A tabela de coleta foi movida de `82:FB60` (reservada ao carregador de
  estatísticas do Editor) para `82:FBA0`. O estado `0580` usa a pose estática
  diretamente no helper de corpo, liberando sua antiga tabela indireta.
- Os helpers v7 ficam em `FF:E000..EC7F`; o filtro de menu em
  `FF:ED00..ED39` e a máscara FK/CK em `FF:ED80`. OAM em `88:F8D9..F8F9`.
  São preservadas as áreas do recuo a partir de `FF:F000`.
- Os leitores compartilhados `84:E6FB/84:E706` encadeiam os helpers de
  aparência verificados do Editor. Fora do transporte do goleiro, o fluxo
  continua pela aparência de jogadores, inclusive substituições e cabelo.

A lista de patches contém somente trechos modificados e assinaturas, nunca
uma imagem completa da ROM. O writer valida todas as origens e destinos antes
de gravar e recusa conflitos. Recompilar a partir da base limpa com ambas as
opções desmarcadas deixa o jogo original para essas cobranças.

## Validação

`tests/goalkeeper-set-pieces.test.mjs` executa o filtro 65816 para as três
combinações habilitadas, todos os outros estados de menu e jogadores de linha.
Também cobre conflitos atômicos, relocação, composição com aparência, fase 12
e retorno ao comportamento original. O runtime da UI é exercitado por
`tests/special-rules-integration.test.mjs` para persistência independente e
projetos antigos.

ROMs reais foram geradas pelo Build Pipeline para FK, CK e ambos, junto à
regra do recuo. No Snes9x, eventos controlados de falta e escanteio concluíram
sem quadros de linha indevidos e com retorno do goleiro ao gol. Os testes
controlados complementam a aprovação visual da versão experimental.
