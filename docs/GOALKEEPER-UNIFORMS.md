# Uniformes individuais dos goleiros — Plus

A seção de goleiros fica na aba Uniformes. A antiga aba Goleiros é ocultada sem remover seus IDs legados.
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

As onze cores continuam no mesmo registro do projeto, mas a interface as separa:
- **Jogadores → Aparência:** cor do cabelo e quatro tons de pele (índices 0–4).
- **Uniformes → Goleiros:** quatro tons da camisa e dois de calção/calçado (índices 5–10).

Editar, restaurar ou aplicar referências do uniforme preserva pele e cabelo.
Aplicar ou restaurar a aparência preserva o uniforme. Os goleiros aparecem
normalmente no elenco e na navegação da janela Aparência. A janela apresenta
controles próprios de cores; os tipos de cabelo de linha não são compatíveis
com a montagem nativa dos goleiros. As cores de aparência só são confirmadas
com Aplicar ao jogador; cancelar descarta a seleção em edição.

O seletor de cor principal gera os quatro tons de camisa; cada tom também pode
ser ajustado separadamente. Não há alteração de layout dos sprites nesta etapa.

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

O botão de referências do Brasil aplica pele clara e cabelo loiro ao Taffarel,
pele mais morena e cabelo escuro ao Gilmar, usando o modelo nativo (zero).
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

## Causa confirmada: sobreposição de cabelo em goleiros

Em 22/10/2026 a ROM enviada (`11-sons.sfc`, SHA-256
`d27b7b0f51d785786a62f584e1fc8aba714c812b41c2e7092d83844b6119bd2e`)
foi executada no Snes9x/libretro (upstream fae2fea). A deformação foi reproduzida
na animação de Skills, não apenas inferida de testes de gravação.

A/B: (a) ROM enviada; (b) seis hooks de paleta restaurados aos bytes nativos;
(c) cabelo 14; (d) cabelo zero nos goleiros, mantendo integralmente as cores
individuais. A e B deformam em certas poses; C também, pois 14 continua não
zero no leitor de cabelo da prévia. D anima corretamente em todos os quadros
observados. Assim, a mudança da camisa não é causa suficiente da deformação.

O disassembly confirma: 82CCB9/82CCC8 e os demais descritores de goleiro nessa
sequência têm cinco bytes (`dw spritemap : dl gráficos`), sem os quatro bytes
extras de metadados de cabeça presentes nos descritores de jogadores de linha.
Exemplo de linha: 82A3D7 possui nove bytes. Códigos 12/13 (e qualquer outro
não zero) acionam a interpretação de cabeça separada sobre um formato que não
possui esses dados. O motor interpreta o descritor seguinte como metadados,
produzindo fontes/tiles/partes do corpo repetidos. A prévia de Editar Atletas
usa D=0D00; não deve ser confundida com as prévias 06A0/07A0 de outras telas.

Correção: depois de aplicar posições/aparências, o writer de corpos mantém o
nibble baixo do cabelo em zero para toda posição natural GO (código 1), sem
alterar o nibble alto/paleta, skills ou uniforme. Esses sprites de goleiro já
possuem o cabelo integrado; zero não significa o corpo careca dos atletas de
linha. As opções incompatíveis são retiradas da aba Goleiros e bloqueadas na
edição de aparência. A referência do Brasil mantém cabelo loiro no Taffarel,
escuro no Gilmar e a mesma camisa verde. Desenhos diferentes para goleiros
exigem edição específica desses corpos; não podem reutilizar os tipos de linha.

O teste de execução do loader em Snes9x também confirmou que a gravação das
cores toca somente 22 bytes em 7E2D82/7E2DA2. Os ajustes de ABI anteriores eram
medidas de compatibilidade, mas não corrigiam a causa da deformação visual.

Validação após a correção: geração nova a partir do projeto, inicialização fria
no Snes9x, entrada em Editar Atletas, seleção de Taffarel e depois Gilmar
(Left troca para os reservas), observação de 720 frames de animação em cada
jogador. As poses antes deformadas passam a renderizar normalmente nos dois,
com camisa verde, cabelo loiro no titular e escuro no reserva.

## Cópia e troca de aparência

A operação entre goleiros transfere somente as cinco cores de cabelo e pele (0–4). As seis cores de uniforme (5–10) permanecem com cada goleiro, inclusive na troca. Nenhuma paleta do uniforme de linha é modificada. A seleção oferece somente jogadores do mesmo modelo: goleiro com goleiro, jogador de linha com jogador de linha.

O projeto distribuído restaura o uniforme titular do Brasil: camisa amarela, calção azul e meias brancas; os goleiros mantêm a camisa verde.
