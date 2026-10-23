# Elencos históricos por seleção

O projeto enviado em 22/10/2026 é a base desta atualização. Seus textos,
grupos, uniformes, sons, Brasil e as duas equipes especiais foram mantidos.

## Recuperação

Alemanha (8) e Argentina (31) foram recuperadas do commit `05cf6fd`.
Os 20 nomes, números, skills, posições e táticas revisados voltaram ao schema
atual de identidade. O arquivo original recuperado está em
`project-data/recovered-argentina-germany.json`, sem descartar suas informações.

A aparência antiga usa a convenção anterior (0 = cabelo do corpo). Ela é
convertida para 14 no modelo atual; goleiros continuam em 0, pois têm desenhos
próprios. O motor nativo dispõe de três objetos de cabelo sobreposto por equipe.
O arquivo antigo possuía quatro titulares com sobreposição em cada um desses
elencos. As referências posteriormente confirmadas pelo usuário prevalecem:
Maradona usa Redonda (original 0 → modelo 14, paleta 0); Batistut usa Capitale
(tipo 2, paleta 1); Caniggia usa Fuerte (tipo 10, paleta 1); Fernando Redondo usa o Santos da Argentina original (tipo 4, paleta 1). Os dados de origem
estão em `project-data/player-appearance-references.json` e foram conferidos
na ROM-base Plus, não inferidos dos nomes históricos.

Para permitir Batistut, Redondo e Caniggia juntos, inclusive após substituições,
a Argentina mantém somente essas três sobreposições em todo o elenco. As
escolhas genéricas recuperadas de Passarela, Mascherano e Di María usam o
cabelo original integrado (14). Müller permanece no 14 para respeitar o limite
alemão. O arquivo recuperado conserva todas as escolhas anteriores. As
referências copiadas preservam o cabelo e o índice da paleta de origem; nomes,
números, skills, posições e táticas permanecem preservados.

## Demais seleções

Foram preparados 20 atletas para cada uma das outras 51 seleções nacionais,
com dois goleiros e equilíbrio entre defesa, meio e ataque. Brasil permanece
na versão enviada pelo usuário. Autores (54) e Todas as Estrelas (55) não são
seleções nacionais e mantêm seus elencos; nenhuma nacionalidade foi inventada
para preencher essas duas equipes.

Critério editorial: conquistas da seleção com participação relevante;
contribuições em Copas do Mundo e jogos decisivos; gols pela seleção,
considerando a função; jogos internacionais e longevidade. A composição final
respeita as posições: não é uma lista dos vinte maiores artilheiros ou dos
vinte jogadores mais famosos nos clubes. Não foi atribuído um placar numérico
fictício de títulos a cada atleta.

A continuidade histórica considera URSS/Rússia, Tchecoslováquia/República
Tcheca e a seleção iugoslava anterior à dissolução. Um jogador não é incluído
nesses antecedentes apenas por sua nacionalidade: precisa ter defendido a
seleção correspondente. O caso da antiga URSS usa também o arquivo soviético,
separado do registro da Rússia moderna.

Os quatro presets iniciais foram substituídos pela **calibração editorial individual** descrita em `HISTORICAL-SKILL-CALIBRATION.md`. As notas já revisadas de Brasil, Argentina e Alemanha são preservadas; os campos brasileiros ainda ausentes foram completados. Não se trata de conversão exata de estatísticas históricas em skills.
As aparências dos novos atletas conservam os recursos nativos dos respectivos
registros, ainda sem uma revisão visual fotográfica individual dos 1.020 nomes.
A atualização de elenco não afirma que cada sprite já reproduz seu jogador.

As 51 novas equipes têm posições iniciais coerentes em 4–4–2; as táticas
revisadas de Brasil, Alemanha e Argentina foram preservadas. A edição normal
do Studio continua disponível para outros esquemas e ajustes.

## Fontes e dados

`project-data/historical-national-squads.json` contém todos os nomes completos,
as abreviações de oito caracteres usadas no jogo, as funções e a fonte de cada
seleção. O índice é da RSSSF, de Roberto Mamrud, Matthias Arnhold e demais
autores identificados nos documentos:

- https://www.rsssf.org/intlp-countrywise.html
- https://www.rsssf.org/miscellaneous/ussr-recintlp.html
- https://www.rsssf.org/miscellaneous/tsje-recintlp.html
- https://www.rsssf.org/miscellaneous/joeg-recintlp.html

Os registros numéricos extraídos são somente os que puderam ser associados
com segurança a uma linha da fonte. `null` indica ausência de extração, nunca
zero jogos ou gols. As fontes têm datas de atualização diferentes e podem
adotar critérios distintos para partidas olímpicas ou não oficiais. Não se
apresenta essa amostra como uma planilha estatística completa até 2026.

## Reaplicação

`node scripts/apply-historical-national-squads.mjs --project CAMINHO` reaplica
a curadoria e a recuperação a uma cópia de projeto. O comando é explícito:
abrir ou salvar normalmente no Editor não recria elencos e não desfaz edições.
As mudanças estão no projeto canônico do Git; basta abrir e salvar a ROM,
com as fases Jogadores e Formações selecionadas.

## Verificação da aparência enviada

A ROM `11-sons(1).sfc` foi aberta no Snes9x/libretro e avançada até uma partida.
O buffer de jogadores e a escalação em WRAM foram lidos. Em um frame de
Brasil × Inglaterra, os 14 jogadores de linha elegíveis com cabelo 14 tiveram
os seletores de corpo conferidos: todos resolveram para cópias idênticas,
byte a byte, do respectivo corpo original. Isso valida essas seleções; não é
uma afirmação de que cada pose possível ou cada aparência histórica foi
revisada. O cabelo do Taffarel permanece nativo e integrado ao sprite do
goleiro, com as cores do projeto enviado e o uniforme verde preservados.
