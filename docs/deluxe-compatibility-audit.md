# Auditoria: reaproveitamento do Editor Plus no Deluxe

## Referências e alcance

- Deluxe original USA anexado, normalizado removendo somente o cabeçalho de copiador.
- Plus anexa, idêntica ao baseline do Editor: SHA-256 `ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a`.
- Código da main: `d1d13b64fa5b222a7bb2c3c7487edbaa9419ac0c`.
- Código mais recente examinado: branch `fix/goalkeeper-backpass-investigation`, commit fixado no JSON adjacente (bcd70db).
- 18 conjuntos examinados: comparação de regiões e execução de validadores de leitura disponíveis.

O resultado é uma prioridade de reaproveitamento, não a declaração de que toda a
interface Plus funciona no Deluxe. Nenhum novo recurso foi habilitado no Editor
por esta auditoria. Não foram executados testes em emulador.
A existência de um módulo na referência não comprova o funcionamento de todas as
suas opções na interface. Assets e tabelas iguais são evidência de compatibilidade
local; dependências externas e caminhos de execução ainda devem ser validados.

## Reutilização direta ou forte candidata

| Recurso | Evidência nas duas ROMs | Decisão |
|---|---|---|
| Textos das oito estratégias | 160/160 bytes iguais | Já migrado; codec existente e edição restrita testados |
| Metadados: título interno | Campo SNES no mesmo endereço, conteúdo naturalmente diferente | Codec reaproveitável; backend Deluxe já suporta o campo, ainda sem controle visual |
| Cores dos oito estádios | 16/16 regiões de loaders e paletas iguais; `readStadiums` aceita as duas ROMs e lê oito estádios | Candidato prioritário à migração direta do leitor e writer de cores |
| Menu principal: assets e ponteiros | 5/5 regiões declaradas pelo renderer iguais | Reaproveitar renderer como candidato; validar gravação, tamanho e navegação |
| Textos nativos pré-partida/estratégias/clima/tipos | 25/25 campos declarados iguais | Candidato a reutilizar descritores e codec; conferir cada escrita |
| Textos nativos adicionais de menus | 139/139 campos correspondem aos bytes originais que o encoder do writer espera, nas duas ROMs | Candidato; campos com relocation e ajustes de posição precisam de conferência adicional |
| Ajuda textual de controles/Cursor | 14/14 passam por conteúdo, ponteiro e terminador esperados nas duas ROMs | Candidato a reaproveitar ajuda textual; não inclui automaticamente os labels gráficos TYPE/AREA etc. |
| Sons e vozes | 74/74 alocações idênticas; amostras BRR terminadas reconhecidas nos 74 slots das duas bases | Reaproveitar codecs e slots como candidatos; conferir associação do evento, capacidade e reprodução |
| Textos/avisos do treino | 14/14 regiões declaradas pelo writer iguais | Candidato; reserva e referências precisam de preflight completo por edição |
| Estatísticas pós-jogo | 9/9 regiões declaradas pelo writer iguais | Candidato ao mesmo planejamento de escrita; requer testar hooks e exibição |

Os números representam campos/regiões/slots, não porcentagem de conclusão do Editor.
Não devem ser somados como número de funcionalidades independentes.

## Reutilização parcial: ferramenta sim, integração ainda não

| Recurso | Evidência | O que adaptar |
|---|---|---|
| Nomes dos jogadores | A tabela de ponteiros examinada coincide; banco usado pelo leitor Plus não coincide | Resolver o banco original e a quantidade de equipes antes de liberar leitor/writer; preservar codec quando confirmado |
| Uniformes | `uniformMapping` aceita Plus e rejeita Deluxe; nenhuma das cinco regiões examinadas é totalmente igual | Resolver tabelas e contagens originais; o cálculo da reserva usa stride de 57 equipes da Plus |
| Fotos das equipes | Três regiões nativas de hooks coincidem; o armazenamento atual é fora dos 2 MB | Reutilizar ferramentas de imagem/quantização; adaptar armazenamento e provar necessidade de expansão |
| Aparência no close-up | Duas regiões de hooks coincidem; duas reservas ficam fora dos 2 MB | Separar edição nativa da infraestrutura expandida de paletas/estilos |
| Textos da pausa | Quatro regiões nativas coincidem; duas reservas ficam fora dos 2 MB | Adaptar reservas e loaders; igualdade dos hooks não elimina dependência de expansão |
| Avisos de partida, como GOL e cartões | Onze regiões coincidem; duas reservas estão fora dos 2 MB | Reaproveitar renderização; adaptar armazenamento e hooks antes de liberar |

O resultado não afirma que a reserva fora de 2 MB é inevitável: ele descreve o
writer atual. Uma implementação no espaço livre nativo exige investigação própria.

## Mapeamentos Plus que não podem ser aplicados diretamente

| Recurso | Resultado | Decisão |
|---|---|---|
| Atributos dos jogadores | 54 de 7840 bytes iguais no banco Plus 0x150000 | Não usar esse endereço nem aplicar espelhos de integridade Plus ao Deluxe |
| Grupos | Apenas 4 de 64 bytes iguais na região Plus 0xE7F2 | Mapear estrutura e limites originais; não transplantar a tabela Plus |
| Ponteiros de táticas | 0 de 114 bytes iguais; Deluxe contém preenchimento na região examinada | Localizar a tabela original; não executar preparação/individualização Plus |

Diferença de bytes, isoladamente, não prova formato diferente nem impede reutilizar
um codec. Ela impede considerar o endereço seguro sem investigar seu significado.

## Ainda sem conclusão por recurso

- Bandeiras: módulo atual depende de captura, ponteiros e infraestrutura de equipes independentes. Exige separar leitor nativo e gravação expandida.
- Modelos de uniformes, oito direções, cabelo e goleiros: codecs gráficos podem ser reutilizáveis, mas cada loader, paleta e compartilhamento requer auditoria própria.
- Nomes gráficos de equipes e de grupos: renderizadores podem ser reaproveitados; contagens, índices, ponteiros e reservas ainda não foram validados para o Deluxe.
- Tela inicial, compositor, demais gráficos pré-partida: exigem inventário próprio dos assets e referências; não foram abrangidos pelo teste do menu principal.
- Regras especiais, goleiro batedor, punição por recuo e recursos funcionais nativos da Plus: precisam de análise das rotinas completas e testes isolados. Esta comparação de dados não os valida.
- Exportação/importação de equipes e jogadores: UI e serialização podem ser comuns, mas identificação das equipes, esquema semântico e escrita dependem dos perfis das bases.
- Projetos Plus existentes: não copiar patches persistidos ou base embutida para um projeto Deluxe. A conversão deverá ser semântica e explícita.

## Sequência resultante da auditoria

1. Migrar leitores/editores com maior evidência de coincidência: cores de estádios, textos nativos e ajudas do Cursor.
2. Trazer a interface e recursos comuns sem preparações automáticas da Plus.
3. Verificar renderer do menu, áudio, treino e estatísticas com escritas controladas e emulador.
4. Localizar endereços Deluxe para nomes, atributos, grupos, uniformes e táticas; reutilizar codecs e controles onde o formato coincidir.
5. Separar capacidade de equipes/grupos, reservas expandidas e melhorias de gameplay em dependências explícitas.

## Reproduzir

```sh
node scripts/audit-deluxe-compatibility.mjs caminho/Deluxe.smc caminho/Plus.sfc origin/fix/goalkeeper-backpass-investigation
```

O script usa uma cópia temporária do código do ref Git, verifica os hashes das
ROMs e remove o diretório temporário ao terminar. O JSON contém somente hashes,
endereços, contagens e resultados de validação: não inclui ROMs, amostras ou assets.
A saída detalhada desta execução está em `deluxe-compatibility-audit.json`.


## Implementação posterior à auditoria

Foram migrados o editor de cores dos oito estádios, 20 textos nativos independentes,
14 blocos de ajuda do Cursor e o controle de título interno. Os cinco labels nativos
restantes se sobrepõem aos blocos de ajuda: a edição fica exclusivamente no bloco
completo, evitando escritores concorrentes na mesma região.
Também foram migrados 133 dos 139 campos adicionais de menus, preservando os
segmentos nativos. Seis campos com relocation ou efeitos de layout foram excluídos.
Também foi migrada a edição dos oito nomes e tamanho global do menu principal,
reutilizando o renderer Plus dentro dos cinco blocos nativos. A prévia é de
tipografia com cores e seleção ilustrativas; navegação e exibição no emulador
continuam pendentes. A aba de sons/vozes também foi migrada: 74 slots BRR, substituição restrita,
exportação e prévia aproximada. Reprodução no emulador permanece pendente.
Também foram migrados os oito avisos de treino e os dez rótulos de estatísticas/
histórico, passando pelos preflights completos dos writers Plus na ROM Deluxe.
A validação no emulador desses fluxos continua pendente.
Os demais candidatos desta auditoria continuam pendentes.
