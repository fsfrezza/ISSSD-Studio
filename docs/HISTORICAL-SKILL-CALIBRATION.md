# Calibração individual dos skills históricos

O projeto passa a ter os nove atributos completos para os 1.080 jogadores das 54 seleções nacionais.

- 1.020 jogadores das 51 seleções novas receberam avaliações individuais em lugar dos quatro vetores genéricos.
- Os 20 brasileiros receberam preenchimento dos campos ausentes. Cada nota já salva pelo usuário tem prioridade, inclusive quando difere da sugestão editorial.
- Os 40 jogadores de Alemanha e Argentina conservam integralmente as notas recuperadas e revisadas.
- Authors e All Stars (54/55) conservam todos os dados originais.

Não foram alterados nomes, identidade, camisa, aparência, paletas, uniformes, posição natural, formação, coordenadas táticas, grupos, textos nem sons.

## O que as notas representam

São avaliações editoriais para jogabilidade, na escala **1–10** do Studio, considerando o jogador em uma fase representativa de sua seleção principal. Não são estatísticas medidas nem ratings oficiais FIFA. Não se convertem títulos, gols ou partidas em um bônus geral para todas as habilidades. Os títulos e a relevância na seleção continuam orientando a escolha dos elencos.

Cada registro em `project-data/historical-skill-calibration.json` possui identidade estável `team/baseSlot`, nome, perfil específico, nível editorial, ajustes de características, dados internacionais arquivados quando disponíveis e os nove valores finais sugeridos. A ausência de estatísticas individuais é explícita; nesse caso o perfil editorial é conservador. Os 297 jogadores das 51 seleções com ajustes explícitos adicionais incluem tanto destaques conhecidos quanto limitações de velocidade, força ou jogo aéreo. Os demais também possuem uma atribuição individual de perfil e nível, sem alegar pesquisa técnica aprofundada de cada jogador.

Os vinte perfis distinguem, por exemplo, líbero de zagueiro de imposição; lateral de apoio de lateral equilibrado; volante de proteção de recuperador; organizador de meia criador; ponta veloz de ponta de drible; finalizador de centroavante de referência. Eles não alteram a posição ou a formação salva.

| Campo | Editor | Critério editorial |
|---|---|---|
| acceleration | Arranque | explosão curta |
| speed | Rapidez | velocidade de deslocamento |
| shot | Chute (potência) | capacidade de chute/finalização como aproximação do único atributo de chute disponível |
| curve | Efeito | curva e bola parada; não é um atributo separado de passe |
| balance | Firmeza | estabilidade e imposição física |
| intelligence | Inteligência | leitura, posicionamento e decisão |
| dribbling | Drible | condução, domínio e desequilíbrio |
| jump | Pulo | impulsão e capacidade aérea |
| energy | Resistência | sustentação do esforço |

Os goleiros usam os mesmos campos que o jogo oferece. Não foram inventados atributos de reflexo ou defesa inexistentes no formato. O perfil numérico não substitui o nível/configuração nativa de goleiro.

O nível editorial (1–5) afeta somente as dimensões principais de cada perfil. Cem jogos pela seleção podem acrescentar um ponto de regularidade em resistência, até 9: é uma convenção de balanceamento, não prova de condicionamento. Para atacantes, média internacional de pelo menos 0,45 gol/jogo, em amostra mínima de 30 jogos, pode acrescentar um ponto ao chute, até 9. Notas 10 exigem ajuste individual explícito. Ajustes também podem reduzir valores, como velocidade de Pirlo, Kane, Koller ou Berbatov.

Não há sorteio, hash do nome, bônus por nacionalidade ou alteração artificial para obrigar os vinte vetores a serem diferentes. Jogadores com avaliações equivalentes podem ter notas iguais.

## Exemplos aplicados

- Pirlo: inteligência e efeito 10, rapidez 5.
- Robben: arranque e rapidez 10, firmeza 5.
- Koller: firmeza e pulo 10, arranque e rapidez 4.
- Beckham: efeito 10, rapidez 6.
- Cannavaro: inteligência e pulo 10, sem transformar todas as habilidades em 10.

Fontes qualitativas de apoio e contexto (não fornecem as notas numéricas):

- [FIFA — entrevista de Andrea Pirlo](https://www.fifa.com/en/tournaments/mens/club-world-cup/usa-2025/articles/andrea-pirlo-interview-italy)
- [FIFA — Robben contra a Espanha](https://www.fifa.com/en/tournaments/mens/worldcup/articles/arjen-robben-performance-spain-netherlands)
- [FIFA — Keylor Navas](https://www.fifa.com/en/articles/players-in-focus-keylor-navas-costa-rica)
- RSSSF: URLs por seleção e registros arquivados em `historical-national-squads.json`.

## Reprodução e segurança

`node scripts/apply-historical-skill-calibration.mjs` aplica o catálogo ao projeto padrão; `--project caminho.issdproj` permite outro arquivo. Antes de gravar, verifica identidades, nomes e nove inteiros de 1–10. A operação trabalha numa cópia e só grava após validar todas as linhas. No Brasil, o modo é preencher ausentes; nas 51 seleções novas, substituir pelos valores calibrados.

O gerador `apply-historical-national-squads.mjs` reaplica este catálogo após montar os elencos, evitando regressão aos presets genéricos. Reexecutar explicitamente a calibração sobrescreve edições posteriores de skills nas 51 seleções novas; o Editor normal permite editar e salvar livremente sem executar esses scripts.

A gravação nativa usa valores 0–9 nos nibbles e os apresenta como 1–10. Os testes verificam os 1.080 registros, as demais partes do byte da posição e os bytes de camisa/aparência, além da prioridade das notas brasileiras e da preservação de Alemanha/Argentina.
