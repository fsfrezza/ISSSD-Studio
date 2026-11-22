# Sequência de funções do Editor Deluxe

Estado desta integração:

1. Goleiro como batedor de escanteios: disponível, separado das faltas.
2. Escolha do horário: disponível no terceiro campo da seleção de estádio
   (automático, 13h, 16h e 21h); usa a escolha na partida.
3. Táticas individualizadas: já disponíveis, com dados próprios das 60 equipes.
4. Fotos de seleção: importação preservada; bandeira e foto em formação agora
   aparecem sob a identificação da equipe, com cores resolvidas do projeto.
5. Uniformes/bandeiras por pixels: editores na aba Equipes, usando o motor
   IndexedPixelEditor do Plus e adaptadores próprios do Deluxe.
6. Pele/cabelo: prévias nativas em Dados do jogador, 16 tipos de cabelo,
   dois conjuntos por equipe de linha e paletas individuais dos goleiros.
7. Progresso por bateria: disponível como opção. Password nativo gravado na
   SRAM, validado e preenchido ao abrir a tela de password após desligar.
8. Campo tático: arte e interface do Plus adaptadas, com seleção múltipla,
   arraste/setas, funções, Atacar e trocas de ordem ou de posição.
9. Retratos/cenas: aparência individual no telão integrada; sete diretórios
   de paletas ampliados para evitar acesso fora das tabelas nativas com GG.
   Importação de fotos individuais e edição das demais cenas ainda pendentes.

A defesa indevida durante o replay de pênalti permanece em investigação.
Não confundir com o patch já disponível de interferência na cobrança.

Referência da investigação do replay: `docs/deluxe/pb9t-replay-investigation.md`.

## Segundo toque em reinícios

Escopo: faltas, laterais e escanteios. A punição deve ocorrer somente se o
cobrador voltar a tocar na bola antes de qualquer outro jogador, com falta
para o adversário no ponto da infração. O estado deve ser armado na liberação
da bola, não na preparação; deve ser limpo no toque de outro jogador e em
qualquer interrupção ou novo reinício. Rebatimento na trave sem toque de
outro jogador não encerra a restrição.

Homologação necessária em ambos os lados: segundo toque direto, toque de
companheiro, toque de adversário, goleiro como cobrador, rebote na trave,
interrupção e replay. Não registrar a opção como disponível sem confirmar
os hooks nativos de liberação, contato e reinício no emulador.
