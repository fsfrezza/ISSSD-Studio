# Aparência, uniformes, fotos e defesa experimental

A aba agora se chama Correções e Melhorias. O tiro livre por recuo permanece
visível, porém indisponível para novas seleções. A escolha em projetos antigos
é preservada; o endpoint de exportação rejeita sua aplicação enquanto a fase
de melhorias estiver incluída. Pênalti e correção desmarcada seguem disponíveis.
A defesa experimental abaixo não é chamada pelo writer do Editor.

## Fotos e aparência

Cada cabelo de jogador de linha possui um botão Editar, que abre o editor de
pixels existente em uma segunda janela. O desenho continua compartilhado pelos
jogadores que usam aquele tipo, conforme aviso no editor. O goleiro conserva
seu cabelo integrado ao sprite nativo.

Uniformes reúne titular, reserva e goleiros, incluindo cores e prévias em tempo
real. A galeria mostra os gráficos nativos de goleiro nas oito direções.

Equipes mostra a composição nativa da foto de formação. Uploads são ajustados
para 96 × 64 e quantizados em 15 cores visíveis SNES mais transparência. O campo
`teamPhotosV1` guarda pixels e paleta independentemente para cada uma das 60
equipes. O pipeline aplica as fotos apenas na fase Seleção de equipes.

As fotos usam 3104 bytes por equipe em 240000..26FFFF, sem cruzar bancos.
O loader em 247A00 usa a rotina original de foto como gateway e substitui
apenas os atores da foto quando há upload para aquela equipe. Um descritor
OAM direto em ROM evita sobrescrever o cache OAM compartilhado em WRAM.
Todas as reservas são verificadas antes de qualquer escrita.

No navegador: upload, salvamento, reabertura, exportação HTTP 200, mudança
dinâmica da cor de goleiro e aplicação de pixels de cabelo foram exercitados
sem erros JavaScript. O teste detectou e corrigiu a ordem dos finalizadores
que inicialmente descartava as fotos. O teste de emulação da ROM exportada
chegou à seleção de equipes exibindo a foto convertida.

## ROM direta: defesa v4

Gerador: `scripts/build-experimental-backpass-defense-v4.mjs`.
Base aceita: SHA-256 ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a.

A rotina 80:E1AF confirma a projeção horizontal `worldX + worldY - cameraX`.
A v4 usa a projeção relativa ao centro do gol para escolher o lado da barreira;
a rotina anterior usava apenas worldY. O goleiro recebe o lado complementar.
O espaçamento de 12 unidades e o limite dos postes são mantidos, com assentamento
na linha do gol nos casos próximos. As rotinas v2/v3 continuam disponíveis.

Os testes de instruções verificam os dois gols, lados negativo/central/positivo,
contagens de barreira, destinos, espaçamento e pilha. A matriz controlada no
Snes9x acionou 36 cobranças (dois gols, três distâncias, três projeções e dois
tipos de cobrador). A preparação precisou neutralizar um chute adversário já
pendente no savestate; sem isso, a posse era trocada antes da checagem do recuo.

Isso confirma a chegada à cobrança, mas não substitui a aprovação visual em
partida nova. A medição de prontidão não garante que todos os defensores tenham
terminado o deslocamento; não deve ser apresentada como validação visual completa
das 36 barreiras. A ROM é experimental e o Editor segue bloqueado até aprovação
do usuário, seguida de nova comparação de exportação.
