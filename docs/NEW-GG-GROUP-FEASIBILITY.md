# Grupo GG: equipes independentes

Esta é uma análise da ROM Plus real. A limpeza do recurso antigo já não habilita
nem reserva novas equipes. O grupo GG não foi implementado neste pacote.

## Situação confirmada

- 56 equipes normais, índices lógicos 0–55, com 20 jogadores cada.
- Nove páginas normais com seis posições e uma página secreta com seis posições.
- A página secreta em PC 00E828 contém `6E 6C 70 70 70 70`: índices 55 e 54,
  identificados nativamente como ALL STARS e AUTHORS, e quatro posições vazias.
  A ordem e os nomes do projeto podem ser diferentes dos nomes nativos.
- O código `70` representa posição vazia. Seria também o código `56 × 2` da
  primeira equipe nova; aumentar apenas o contador faz a equipe desaparecer.
- Os seis mapas especiais apontados em PC 127643 são referências a jogadores
  de outras equipes, não seis elencos novos. Copiar esses mapas mantém vínculos.
- PC 00E82E pertence ao descritor seguinte. Não é um contador livre de grupos.

## Duas alternativas

| Alternativa | Equipes realmente novas | Total no jogo | Efeito |
| --- | ---: | ---: | --- |
| Aproveitar Autores e All Stars | 4 | 60 | Os dois espaços secretos passam a integrar GG com mais quatro clones independentes. |
| Preservar todas as equipes atuais | 6 | 62 | GG recebe seis novas identidades; as duas equipes secretas atuais também precisam de lugar na seleção. |

A primeira alternativa altera menos estruturas e é a recomendação inicial,
se for aceitável substituir as duas equipes secretas. Os seis integrantes
podem começar como cópias de quaisquer equipes existentes. A clonagem deve
copiar os dados para destinos próprios, sem manter aliases para as fontes.

## O que precisa ser reestruturado

1. Índices e seleção: novo código de vazio, tratamento dos IDs a partir de 56,
   resolução dos antigos IDs especiais, seis posições acessíveis no grupo GG
   e acesso à página sem depender do desbloqueio secreto.
2. Dados: banco de atributos, nomes dos 20 jogadores, identidade/ordem, formação
   e registros táticos, com ponteiros independentes. Quatro novos elencos usam
   apenas 560 bytes de atributos; espaço de ROM não é o principal problema.
3. Aparência: paletas próprias de pele/cabelo e goleiros; uniformes titular e
   reserva; padrões de camisa clonados em armazenamento próprio. Compartilhar
   o mesmo padrão editável ainda faria uma alteração atingir a equipe fonte.
4. Identidade visual: nome curto, grande e de placar, bandeira/emblema, ícone de
   seleção e estatísticas. Os renderizadores atuais foram dimensionados para
   56 equipes e precisam ser ampliados junto com os seus caches e tabelas.
5. Consumidores: treino, amistoso, campeonatos, pênaltis, substituições, replay,
   telão e tabelas de resultados. Todos devem resolver a identidade nova.
6. Editor/projeto: substituir os limites fixos por um registro de equipes
   extensível e versionado, com migração de projetos antigos. O novo domínio
   deve ser genérico, sem reaproveitar os metadados descartados do recurso antigo.

## Critério para chamar uma equipe de independente

Editar nome, jogador, skill, tática, aparência, uniforme ou bandeira de uma cópia
não pode mudar a fonte, nem outra cópia. Isso deve sobreviver a salvar, reabrir
projeto, exportar a ROM, selecionar adversários e entrar numa partida.

A prova inicial recomendada é uma equipe nova contra sua própria fonte. Depois
validar os quatro ou seis clones, confrontos entre clones e persistência dos
resultados. Só então o grupo GG pode ser apresentado como funcional no Editor.

Auditoria reproduzível, sem modificar a ROM:

```sh
node scripts/audit-new-team-capacity.mjs "roms/International Superstar Soccer Deluxe Plus.sfc"
```
