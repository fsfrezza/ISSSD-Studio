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

O nome curto dispõe de 32 pixels; o grande, 80 pixels. Não há truncamento automático. As sugestões fornecem abreviações explícitas para nomes longos, mantendo a forma completa no campo de identificação. Acentos são preservados no projeto e removidos apenas na representação gráfica. Os nomes grandes dividem 128 tiles e até 411 sprites de dados OAM; todos os limites são validados antes de qualquer escrita.

A fase **Seleção de equipes** grava o conjunto inteiro, incluindo os nomes consumidos durante o jogo. Desmarcá-la preserva os nomes da ROM-base. Não altera grupos, elencos, uniformes, bandeiras nem habilita novas equipes. Sobrescritas binárias antigas dos mesmos endereços são descartadas quando há nomes semânticos.

Nomes de lugares dos estádios e os textos narrativos fixos dos cenários continuam nos respectivos editores de textos; não são identificadores dinâmicos de equipe.

## Validação

- Testes de todos os 56 IDs, Q, nomes curtos, limites, ponteiros, fonte, OAM, atomicidade, fase desmarcada e salvamento/reabertura dos campos.
- Build cumulativo do projeto canônico: zero textos pendentes e zero intervalos sem classificação nas sete fases de texto/equipes/jogadores/formações.
- Execução com Snes9x 2005: seleção com BRASIL, ARGENTINA, COLÔMBIA e IRLANDA NORTE; apresentação com BRASIL/INGLATERRA; partida com nomes em português no placar. Não foi realizado teste visual automatizado do navegador.
