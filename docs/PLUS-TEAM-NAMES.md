# Nomes das equipes na Plus

O domínio `state.semantic.teamNamesV1` mantém os IDs 0–55, sem depender da ordem dos grupos. Cada entrada contém `full` (identificação no Editor), `big` (painel/apresentações) e `short` (grade, placar e listas). O projeto canônico contém as sugestões em português. As ações de idioma preenchem os campos; salvar o projeto preserva os três valores. Abrir o projeto não modifica a ROM-base.

## Caminhos nativos confirmados

| Representação | Endereços PC da Plus | Integração |
| --- | --- | --- |
| Nomes pequenos na seleção e listas | `17CA6`, 56 registros de 6 bytes | Reponta todos os streams dentro do bloco original `DEA6D..DF6CE`. |
| Nomes no placar | `FEB0`, 56 ponteiros de 16 bits; descritor inicial `E6B4` | Atualiza os ponteiros junto com os nomes da seleção, mantendo o banco 9B. |
| Nomes grandes do painel e apresentações | `17BC4`, 56 ponteiros OAM; stream `13E4B6` | Reconstrói contagens, quatro planos e ponteiros, dentro do bloco comprimido original. |
| Alfabeto dos nomes grandes | `EE13C`, 128 tiles 4bpp | Gera letras e pares, incluindo Q, dentro do bloco original. Não realoca fonte nem OAM. |

O disassembly original descreve os consumidores de `DATA_81E6C1` (nomes pequenos), `DATA_82F59A` (nomes grandes) e `GFX_Sprite_8x16Font`. A Plus tem tabelas e ordenação próprias; endereços da ROM original não são aplicados por suposição.

A tabela de seis bytes carrega os mesmos nomes que a grade usa sob as bandeiras. A descrição antiga “somente nome superior” era incorreta: o nome grande no painel é OAM. O codec dos pequenos precisa respeitar o indicador de transformação de planos dos streams originais. O escritor converte os dados para a representação SNES antes de recomprimir.

## Limites e exportação

O nome curto dispõe de 32 pixels; o grande, 80 pixels. Não há truncamento automático. As sugestões fornecem abreviações explícitas para nomes longos, mantendo a forma completa no campo de identificação. Acentos são preservados no projeto e removidos apenas na representação gráfica. Os nomes grandes dividem 128 tiles e até 763 registros de dados OAM em reservas por contexto; todos os limites são validados antes de qualquer escrita.

A fase **Seleção de equipes** grava o conjunto inteiro, incluindo os nomes consumidos durante o jogo. Desmarcá-la preserva os nomes da ROM-base. Não altera grupos, elencos, uniformes, bandeiras nem habilita novas equipes. Sobrescritas binárias antigas dos mesmos endereços são descartadas quando há nomes semânticos.

Nomes de lugares dos estádios e os textos narrativos fixos dos cenários continuam nos respectivos editores de textos; não são identificadores dinâmicos de equipe.

## Validação

- Testes de todos os 56 IDs, Q, nomes curtos, limites, ponteiros, fonte, OAM, atomicidade, fase desmarcada e salvamento/reabertura dos campos.
- Build cumulativo do projeto canônico: zero textos pendentes e zero intervalos sem classificação nas sete fases de texto/equipes/jogadores/formações.
- Execução com Snes9x 2005: seleção com BRASIL, ARGENTINA, COLÔMBIA e IRLANDA NORTE; apresentação com BRASIL/INGLATERRA; partida com nomes em português no placar. Não foi realizado teste visual automatizado do navegador.

## Correção da apresentação e da fonte (2026-10-18)

Os nomes usam células OBJ de 8×8 e alfabeto de oito pixels de altura e letras de até cinco pixels de largura. O bit P inferior do descritor nativo seleciona o tamanho; não é um bit de prioridade comum. Isso reduz a fonte em todas as telas e evita exceder os 34 segmentos de oito pixels por linha do SNES quando dois nomes aparecem com as bandeiras e VS. Brasil × Inglaterra reproduzia o desaparecimento de letras na implementação com células de 16×16; E.U.A. × Inglaterra podia escapar por ter menos células.

Os tiles EC..EF e FC..FF são compartilhados com números do campo e VS e ficam fora do atlas reconstruído. Os testes verificam sua preservação e o orçamento de sprites para todas as combinações dos 56 times. A apresentação de Brasil × Inglaterra foi conferida no Snes9x 2005 depois da correção.

## Ampliação do pré-jogo

Na revisão anterior, o corpo das letras normais passou de 5 para 6 pixels de largura (20%); a altura permanecia em 8 pixels para manter uma célula OBJ pequena por token. O avanço horizontal foi ajustado para que nomes longos continuem dentro dos 80 pixels. O ponto e o I conservam suas larguras menores. Não se alterou o texto do placar durante a partida. Nessa revisão, o limite era de 411 registros; a ampliação de altura descrita abaixo substitui essa reserva. O orçamento de 34 slivers por linha continua obrigatório para qualquer par de equipes.

## Altura de 12 pixels e reservas por contexto

Os nomes grandes passam a usar corpo 6×12, com duas células OBJ pequenas, em linhas adjacentes, por token. O atlas mantém 4096 bytes e preserva EC..EF/FC..FF (números e VS). Cada linha de cada time continua limitada a 12 objetos; qualquer par, bandeiras e VS fica dentro dos 34 slivers por scanline.

A conversão nativa organiza quatro planos de dados OAM separados por 2000h. A reserva original em 4F02 permite somente 411 registros e é insuficiente para duas linhas. Os menus e a formação usam 5280..5876; a seleção de equipe e o estádio usam 5A00..5FF6, evitando seus objetos em 5600..57D2. O limite comum é de 763 registros. Os 56 ponteiros armazenam offsets, e as 21 leituras nativas acrescentam a base efetiva.

Os wrappers dos conversores em PC 3B00/3B59 escolhem a reserva antes de carregar objetos em 5876 ou 5600. O inicializador PC 2A756 reconhece também os retornos AC3E/AC2F da seleção e 9E8A do estádio: esses inicializadores podem rodar depois de um carregamento em cache. Os demais contextos voltam para 5280. Os quatro planos de 05F6 bytes são restaurados do cache imutável em PC 3E5500 antes da atualização de 7E5FF8; a base desejada fica em 7E5FFA. Não se reutiliza uma cópia de WRAM potencialmente sobrescrita. A/P/X/Y e o reset original de 1466/859E82 são preservados conforme o contrato do chamador.

A reserva em 5A00 sobrepõe parte do dataset compartilhado de cursores em 5876..5EB2. Ao retornar aos menus, os quatro planos desse dataset são recompostos na posição nativa a partir de uma cópia derivada da ROM-base, em PC 3E3C00..3E54F0. A conversão dos 798 registros, extraídos de 98B0B9, foi comparada com a execução de CODE_80947E: os quatro planos são idênticos. A restauração evita depender de um novo carregamento do dataset ao cancelar uma seleção. Não se aloca um novo buffer persistente em WRAM.

A fonte mantém 4096 bytes e reserva os últimos 32 tiles nativos (60..7F), incluindo números e VS. Os pontos de E.U.A. e o I têm margens próprias: o corpo do I usa um pixel e há uma coluna separando os corpos das letras. Todos os pares de equipes continuam dentro do orçamento de 34 slivers por linha.

Foram conferidos em execução nativa no Snes9x 2005: a foto e o nome do Brasil na seleção, o país do estádio, a formação com alteração de tática, o seletor de treino e a volta para esse seletor após cancelar o estádio. Os testes executam os bytes dos hooks em um interpretador de instruções 65816 para verificar os desvios, cópias e preservação dos registradores, inclusive quando o carregador nativo reaproveita o cache.

Os nomes grandes agora separam os corpos das letras por uma coluna, mantendo
os corpos de seis pixels e a altura anterior. I usa um traço de um pixel,
permitindo pares com espaçamento dentro de uma célula OBJ de oito pixels.
Espaços entre palavras têm dois pixels. Todos os 56 nomes continuam dentro
dos limites de largura, atlas, objetos por linha e cache; a arte reservada de
treinamento permanece intacta.

Os objetos originais do estádio (61 quadros, 233 sprites, fonte PC C2817)
também são restaurados ao voltar à seleção. Seus quatro planos de 01D2 bytes
ficam em PC 3E6D00; a rotina em PC 3E7500 os recompõe em 5600/7600/9600/B600.
Isso preserva país, campo e setas mesmo após passar por dois ou mais menus
que usaram as reservas sobrepostas. Não há uma lista crescente de exceções
para cada menu intermediário.

### Bola corrompida na cobrança de pênalti dentro da partida

O carregador `$8296AF` converte primeiro os 29 quadros nativos da bola em `$7E557A..$7E55D8`, com quatro planos separados por `$2000`. Depois converte os nomes das equipes, com cursor X=`$96B8` e destino original Y=`$4F02`. Ao chegar do campo, o cache de nomes permanecia em `$5280`; os nomes ampliados invadiam os quadros da bola já carregados. A colisão alterava contagem de objetos, coordenadas e propriedades, produzindo retângulos em alguns quadros do chute alto. Não depende do aviso de gol nem do replay.

Os dois invólucros dos conversores OAM agora selecionam `$5A00` especificamente nessa conversão dos nomes do pênalti. O helper em PC `$3E30C0` mantém os registradores, flags e a pilha, e usa a restauração existente do cache. Os demais carregadores conservam seu destino anterior.

Validação: teste executa ambos os invólucros emitidos e verifica os quatro planos da bola após a escrita dos nomes. No núcleo SNES, a transição controlada campo → cobrança, com o projeto canônico, tinha divergências de 38/63/53/93 bytes nos quatro planos; após a correção todos os 376 bytes ficaram idênticos à conversão dos objetos originais. Essa comparação valida a integridade das animações; não substitui a confirmação visual da cobrança específica no emulador do usuário.


## Substituições: objetos fora dos nomes ampliados

Os datasets `$98B332` e `$98B348` ocupavam `$57D2..$5846`, dentro dos nomes ampliados em `$5280..$5876`. Os quatorze ponteiros de quadros e os dois destinos de conversão passam para `$5EB2..$5F26`, após os objetos compartilhados, sem tocar `$5FF8/$5FFA`. Os quatro planos originais ficam em cache imutável em PC `$3E7600`; a restauração de menu em `$3E7800` recompõe ambos os conjuntos em cada retorno, inclusive com carregamento nativo em cache. Os gráficos, cores e coordenadas dos objetos não são redesenhados.


## Rótulo do estádio

O campo `stadium-native/data_87cad3` aceita até oito células e fica antes do país quando traduzido. O padrão português é `ESTÁDIO:`. A string é relocalizada em PC `$3FBB0`, sem sobrescrever `GAME START`; a posição do rótulo passa de `$0131` para `$0128`, e a do país faz o caminho inverso. O inglês original mantém a ordem nativa. A mudança pertence à fase Pré-partida e é salva no projeto como os demais textos.
