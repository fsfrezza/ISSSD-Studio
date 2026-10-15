# Exportação provisória de ROMs cumulativas por área

No perfil Plus, **Salvar ROM** baixa `ISSSD-Plus-ROMs-cumulativas.zip`, sem executar
writers físicos legados do navegador. A ROM-base permanece imutável.

## Ordem

1. `01-infraestrutura.sfc`: expansão obrigatória para 4 MiB e individualização
   tática, mesmo quando o projeto não contém overrides táticos.
2. `02-tela-inicial.sfc`: conjunto completo das alterações binárias da tela inicial.
3. `03-menu-principal.sfc`: conjunto completo das alterações binárias do menu principal.
4. Seleção e grupos de equipes, se houver alterações efetivamente materializadas.
5. Uniformes e paletas de goleiro, se houver mudanças.
6. Jogadores, todos juntos: nomes, camisas, posições, skills e aparência.
7. Tela de preparação da partida, se houver mudanças.
8. Formações, táticas e estratégias, todas juntas.
9. Outras alterações legadas sem área confirmada, reunidas numa única etapa.
10. Metadados internos da ROM.

As três primeiras posições são fixas. As demais áreas sem mudanças são omitidas.
Não há uma ROM por jogador, patch ou campo. Cada arquivo contém as áreas anteriores
mais o conjunto completo da área atual. Checksum e mirrors são recalculados em
cada saída. `indice.json` lista áreas, intervalos aplicados e status; título/menu
sem mudança binária têm status `sem-alteracao-binaria`.

O pipeline resolve o estado final uma vez, com preparação obrigatória. Seus writes
efetivos são agrupados por áreas verificadas, inclusive separando intervalos que
atravessam fronteiras. Snapshots recebem cada conjunto de forma atômica. A última
ROM precisa ser byte-idêntica ao build canônico configurado com
`forceTacticalInfrastructure: true`; divergência cancela o ZIP.

Os limites nativos da tela inicial vêm de TITLE_GROUPS, TITLE_PALETTES e campos
textuais do legado. Menu principal usa as regiões do renderer verificado. Nomes
usam os ponteiros vivos do ROM final; táticas usam os registros resolvidos. Bytes
sem associação confirmada ficam em `outros-legados`, em vez de receberem uma tela
por suposição. Espelhos de integridade e checksum são derivados, não áreas novas.

O agrupamento não implementa writers semânticos ausentes: tela inicial/menu só
incluem mudanças efetivamente materializadas pelos writers/patches disponíveis.
Snapshots sem mudança não afirmam ter renderizado composições apenas semânticas.
O ZIP é comprimido por arquivo em disco temporário, com limite ZIP32 de 4 GiB.

## Limpeza preservada

A revisão anterior removeu a documentação do painel de diagnóstico já excluído
e o fallback OLD/ANTIGO/Preview que podia descartar `.editor-vendor`. Backups,
projetos, ROMs e pastas de recuperação continuam protegidos.
