# Uniformes individuais dos goleiros — Plus

A aba Goleiros substitui visualmente o painel legado sem remover os seus IDs.
Mostra uma seleção de equipe e dos dois jogadores com posição natural GO/GK.
Quando a identidade ainda não está disponível na UI, usa como referência os
registros originais 1 e 12. Os nomes e as escolhas pertencem à identidade, não
à posição atual do jogador no elenco.

## Projeto

`state.semantic.goalkeeperPalettesV1` usa o esquema
`isssd-goalkeeper-palettes-v1`, versão 1. O mapa `players` é indexado por
`team:baseSlot`; cada entrada contém 11 palavras BGR555 em `colors`.
O finalizador salva a seção no projeto e na requisição de exportação da ROM.
A abertura valida e restaura a seção; importação inválida mantém a sessão
anterior. A seção participa da seleção de categorias ao abrir/salvar projetos.

Todas as onze cores são editáveis, incluindo pele e cabelo, quatro tons da
camisa e dois tons compartilhados de calção/calçado. O tipo de cabelo pode ser
escolhido nesta aba, usando a mesma identidade da aba Aparência. O seletor de cor principal
gera os quatro tons de camisa; cada tom também pode ser ajustado separadamente.
Não há alteração de layout dos sprites nesta etapa.

O padrão para Brasil (teamId 30) é camisa verde escuro para os dois goleiros.
Restaurar padrão recupera esse verde; usar cores originais da ROM permite
escolher explicitamente a antiga camisa vermelha. Outras equipes preservam
as cores originais. Não é necessário aplicar um botão intermediário: a edição
já fica no projeto em memória; Salvar projeto grava o arquivo.

## ROM

O bloco nativo correto possui **11 cores**, e não 12: a tabela do leitor
8BD06E aponta para 828358; cada registro no banco 89 começa com tamanho 21
(22 bytes de cores). Os destinos nativos são C1/D1 da paleta de sprites.
Cabeçalhos e paletas originais permanecem. Para entradas individuais explícitas,
a rotina posterior de pele/cabelo é executada integralmente e depois as cores
individuais são reaplicadas. O wrapper conserva os efeitos nativos em A/X/Y/DB/P
e no scratch da página direta. Entradas sem edição mantêm o resultado nativo.

Cada jogador recebe uma cópia de 22 bytes na expansão. A seleção do goleiro em
campo consulta o primeiro registro da escalação corrente (7E3F90/7E3FA4),
incluindo substituições. Skills consulta o registro 34 do contexto original,
como o leitor nativo, preservando a identidade selecionada. A troca da ordem
do elenco é resolvida no build por baseSlot/playerId e gravada no slot atual.

PC 2A0000: 56 × 20 × 22 bytes de cores. Helpers em 2A7000/7200/7400.
Hooks de chamada: 05D076, 05D090 e 0C78FD. A cópia MVN mantém o destino CGRAM
espelhado nativo e restaura X/Y/DB. Os flags de retorno seguem o caminho nativo
(C/D/V limpos); A termina em FFFF após a cópia de 22 bytes.
Não há uso de scratch WRAM do jogo. A área e os hooks pertencem à fase
Jogadores. Fase desmarcada preserva o comportamento original.

Testes cobrem dois uniformes diferentes, troca entre titular/reserva,
persistência e reabertura reais da UI, os bytes 65816 dos três caminhos,
limites da cópia, colisão de armazenamento e imutabilidade da ROM-base.
O projeto anexado pelo usuário também foi usado na geração cumulativa real.
Ainda é necessária a conferência visual no emulador.

Flags por jogador: PC 2A6200, 56 × 20 palavras. Helpers em 2A7600/7800/7A00;
hooks nativos 05D081/05D09B/0C790C (JSL 8BD110). O wrapper chama primeiro
o leitor nativo, preservando suas alterações em registradores e DP scratch.
Depois reaplica a paleta explícita usando os argumentos originais do chamador
e restaura exatamente o contexto pós-nativo. A compactação do frame temporário
usa somente stack-relative, sem alocar WRAM. Reserva total termina em 2A7C00.
A cópia inicial também reproduz o P=00 carregado pelo PEA/PLB/PLP nativo,
incluindo I limpo; não restaura flags incompatíveis com o leitor original.

O botão de referências do Brasil aplica pele clara, cabelo loiro com entradas
(tipo 13) ao Taffarel, pele mais morena e cabelo curto (tipo 12) ao Gilmar.
Ambos usam a mesma camisa verde e tons escuros de calção/calçado. São
aproximações com os tipos nativos disponíveis; não desenha novos rostos.

## Regressão visual reportada

Os prints de 22/10/2026 mostraram sprites corrompidos nas prévias de ambos os
goleiros e uma faixa de cabeças em campo. Testes apenas de conteúdo/destino
não comprovavam o contrato do chamador. O wrapper anterior pulava 8BD110 para
paletas explícitas; esse leitor também muda X/Y/A/P e scratch DP. Agora esses
efeitos são mantidos e os testes exigem igualdade do contexto pós-nativo,
incluindo caminhos com índice zero, ambos os lados e prévia. Trata-se de
validação de ABI com fixture de efeitos nativos, não de uma execução Mesen.
A confirmação visual da correção continua necessária no emulador.
