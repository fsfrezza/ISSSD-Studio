# Deluxe modular: migração incremental

## Recursos atualmente disponíveis

Além das oito estratégias, a entrada Deluxe agora permite editar:

- Paletas de 16 cores dos oito estádios, usando o reader/writer do Plus.
- 20 textos nativos independentes. Cinco outros labels auditados fazem parte dos
  blocos de ajuda do Cursor e são editados somente dentro desses blocos.
- 14 blocos de ajuda textual do Cursor, com o codec e descritores do Plus.
- 139 textos adicionais de menus, opções, competições, treino, desafios,
  recordes, passwords, cenários e créditos, organizados em 20 seções.
  Os seis campos especiais agora usam as realocações e ajustes de layout
  verificados no Plus e preflightados no Deluxe.
- Título interno da ROM.
- Sons e vozes: 74 slots, prévia BRR aproximada, importação/exportação BRR,
  persistência no projeto e restauração da amostra original.
  A substituição é limitada ao comprimento do primeiro fluxo BRR original
  terminado, sem usar possível conteúdo vizinho da alocação.
- Oito nomes do menu principal, tamanho global dos textos e prévia estática
  da tipografia/seleção. O menu é regenerado nos cinco blocos nativos pelo
  renderer existente da Plus. Combinações que excedem espaço são rejeitadas.

Todos possuem restauração dos valores originais. As mudanças são salvas no projeto
e reaplicadas na geração. Projetos Deluxe da etapa anterior continuam aceitos.
Os 133 textos usam os mesmos segmentos e encoder do Plus, com gravação somente
no espaço original. Os defaults não são traduzidos automaticamente: o usuário
escolhe quais textos alterar. Não há expansão nem patches de gameplay novos nesta entrega.

Validação: 44 testes passaram com a ROM anexada, incluindo escritas restritas,
checksum, rejeição de entradas inválidas e fluxo de controles abrir/editar/salvar/
reabrir/exportar/restaurar em um DOM de teste. A imagem de prévia foi inspecionada durante o desenvolvimento; não houve teste
visual em navegador real nem teste de gameplay em emulador nesta etapa.
A prévia usa cores ilustrativas e destaque estático sobre a tipografia BG; não
simula as paletas, os sprites animados nem a navegação do jogo. Antes de editar,
ela mostra a fonte do editor com os nomes originais; exportar sem edições continua
preservando os gráficos e o arquivo original inteiro.
O tamanho inicial de edição é 80, que cabe com os nomes originais. Alguns textos
e tamanhos maiores ultrapassam os blocos nativos: nesses casos o Editor mostra
o erro e não gera a ROM; não expande nem realoca silenciosamente.

## Registro da etapa inicial

O texto abaixo descreve a primeira entrega, antes das migrações acima.

Branch: `feature/deluxe-modular-editor`, baseada integralmente na `main`
`d1d13b6`. O Editor Plus e seus comandos existentes foram preservados.

## Objetivo e estado atual

Objetivo: conseguir gerar, a partir do Deluxe original, os mesmos recursos de uma
ROM criada no Editor Plus, com melhorias opcionais e infraestrutura sob demanda.
Esse objetivo ainda não foi atingido. Esta entrega estabelece uma entrada
independente e migra o primeiro recurso compartilhado: textos de estratégias.

A main remota não contém todos os trabalhos presentes nas branches mais recentes.
A branch `fix/goalkeeper-backpass-investigation` foi identificada em `bcd70db`.
Ela deve ser inventariada antes de integrar seus recursos; não foi mesclada nesta
etapa. O build legado exige um HTML externo ausente neste checkout. A entrada
Deluxe não exige esse arquivo nem modifica o build Plus.

## Executar

```sh
npm run serve:deluxe
```

Abrir http://127.0.0.1:4174 e selecionar Deluxe (USA), com ou sem cabeçalho de
copiador de 512 bytes. SHA-256 do payload aceito:
`d2fe66c1ce66c65ce14e478c94be2e616f9e2cad374b5783a6a64d3c1a99cfa9`.
A ROM permanece no navegador. O projeto contém identidade da base e mudanças;
para reabri-lo é necessário selecionar a ROM original novamente.
Projetos Plus não são importados por esse fluxo.

## Evidência do primeiro mapeamento

Comparação com o baseline Plus `ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a`:

| Região no payload | Tamanho | Bytes iguais | Decisão |
|---|---:|---:|---|
| Estratégias, 0x3C8CE | 160 | 160 | Reutilizar codec e descritores existentes |
| Banco de jogadores Plus, 0x150000 | 7840 | 54 | Não reutilizar endereço no Deluxe |
| Região de grupos Plus, 0xE7F2 | 64 | 4 | Exige novo mapeamento |
| Ponteiros táticos Plus, 0x5FDD0 | 114 | 0 | Exige novo mapeamento |

Bytes diferentes não comprovam formatos diferentes; bytes iguais tampouco provam
que duas rotinas acessam a mesma tabela. O reaproveitamento acima limita-se aos
registros de texto reconhecidos, sem autorização genérica de outras regiões.

Reproduzir o diagnóstico:

```sh
node scripts/audit-deluxe-plus.mjs caminho/Deluxe.smc caminho/Plus.sfc
```

## Contrato implementado

- Base verificada por hash, sem depender de título ou extensão.
- Nenhuma preparação Plus, cópia de patches antigos ou expansão automática.
- Exportação sem edições é idêntica ao arquivo original, incluindo cabeçalho.
- Textos usam o codec existente, somente nos oito registros coincidentes.
- Projeto salva apenas mudanças explícitas. Uma nova geração sempre parte da base.
- Checksum é recalculado somente se houver alterações, considerando a contribuição
  de 0x1FE do quarteto checksum/complemento para ROM de 2 MB.
- Campos desconhecidos e melhorias sem implementação são rejeitados, não ignorados.
- Catálogo de melhorias é exibido desabilitado, sem simular patches inexistentes.

## Próximas migrações necessárias

1. Mapear tabelas originais de grupos, equipes, jogadores e respectivos leitores.
2. Separar codecs compartilhados dos endereços e limites específicos de cada base.
3. Integrar cada edição nativa ao projeto Deluxe e provar alterações restritas.
4. Mapear expansão de equipes/grupos e sua participação nos modos de competição.
5. Individualizar táticas e administrar espaço conforme requisitos comprovados.
6. Portar patches de gameplay individualmente, verificando combinação e dependências.
7. Migrar uniformes, bandeiras, textos restantes, telas e assets do Editor atual.
8. Definir cenários de equivalência entre geração Deluxe e geração Plus.

## Validação desta etapa

17 testes passaram, incluindo a ROM Deluxe anexada: identidade de exportação,
preservação do cabeçalho, escrita restrita, checksum, projeto JSON, remoção de
edições e rejeição de melhorias pendentes. Os testes dos codecs Plus reutilizados
continuam passando. Não houve teste de gameplay em emulador nem validação visual
interativa da interface. Não há equivalência funcional completa com o Editor Plus.

Teste com ROM privada (não versionada):

```sh
# bash
ISSSD_DELUXE_ROM=/caminho/Deluxe.smc npm run test:deluxe
```

```powershell
$env:ISSSD_DELUXE_ROM = 'C:\caminho\Deluxe.smc'
npm run test:deluxe
```


## Etapa de áudio

A aba Sons e vozes reutiliza `SOUND_SLOTS` e o writer BRR da Plus. A camada Deluxe
restringe cada substituição ao comprimento da amostra original, preservando todos
os bytes posteriores. A importação agora aceita os formatos decodificáveis pelo Web Audio do navegador
(MP3/WAV e outros conforme suporte local), além de BRR. O preset Galvão do Editor Plus foi incorporado; o preset FB96 também está disponível. Uma importação BRR com dados depois do bloco final é rejeitada.

A prévia decodifica os filtros BRR e reproduz uma passagem pela amostra, em taxa
selecionável (8/10,3/16/32 kHz; padrão 10,3 kHz). Não simula pitch do driver, interpolação gaussiana,
ADSR, eco ou loops. A taxa de prévia não altera a ROM nem o projeto.
Não houve escuta em navegador real ou reprodução no emulador nesta entrega.

Os 12 testes da suíte Deluxe passaram com a ROM anexada, incluindo todas as 74
amostras: identidade com originais explícitos, alterações restritas e restauração,
decodificação finita, rejeição de BRR inválido e fluxo de importação pelo controle.


### Conversões integradas

O fluxo do `editor-src/sounds-editor.mjs` da Plus (bcd70db) foi analisado:
Web Audio → mono → remoção de silêncio → normalização → 10300 Hz → BRR.
O engine legado `window.ISSSDSounds` referenciado pelo Plus não está versionado
neste checkout. O Deluxe ganhou um codec autocontido, com seleção de filtro e
escala por bloco BRR, em vez de depender desse engine externo.

Importações de áudio passam pelo mesmo fluxo funcional. Não há aceleração para
caber: o encoder recusa quando os blocos necessários excedem o fluxo BRR original.
BRR já convertido é aceito sem reconversão. A saída pode ser exportada em BRR
ou WAV PCM mono a 10300 Hz. A prévia e o WAV não emulam ADSR, eco ou pitch do jogo.

14 testes passaram: conversão estéreo/mono, taxa e duração, silêncio, limite sem
aceleração, SNR acima de 20 dB em seno, cabeçalho WAV, importação pela UI com
Web Audio simulado, persistência e preservação da ROM. A decodificação MP3/WAV
real no navegador e a reprodução no emulador ainda precisam de teste manual.


### Referência Galvão

As 74 amostras foram extraídas sem reconversão do banco `REF_GA` embutido no
Editor Plus ISSSD-Studio(20261024-004651).html fornecido pelo usuário.
Cada fluxo foi limitado pelo END BRR; o banco completo não foi incorporado.
68 amostras diferem da ROM original, seis são idênticas. Todas cabem no
comprimento original dos respectivos fluxos Deluxe.

A aba permite ouvir Galvão, aplicar na amostra selecionada ou aplicar em todos
os 74 slots catalogados (incluindo efeitos). O lote inteiro é validado antes
de atualizar o projeto. As escolhas são embutidas no projeto com source galvao.
Não é necessário carregar ROM doadora. Música e áudio fora do catálogo não são
transplantados. Testes cobrem os dois controles, persistência, carregamento do
JSON pelo servidor e escritas restritas aos fluxos de áudio/checksum.


## Avisos do treino e estatísticas

Migrados 8 campos do HUD de treino/desafio e 10 rótulos de estatísticas/histórico
de gols. Os writers e descritores de bcd70db são reutilizados, com validação
estrita das chaves semânticas no projeto Deluxe. O leitor do alfabeto nativo
usa o mesmo mapa de fontes já incorporado ao catálogo de menus Deluxe.

Os campos ficam na aba Textos, em seções recolhíveis. Manter os valores originais
não aplica patches. Alterações preservam a base e são reaplicadas a cada geração.
O treino usa reserva nativa e ajusta referências; estatísticas usa fonte nativa,
reservas e hooks já implementados no Plus. Todos os preflights passaram no Deluxe
USA anexado; não houve alteração de endereços/hook assembly nesta migração.

16 testes passaram, incluindo os conjuntos portugueses completos, escritas
restritas às regiões declaradas pelos writers, checksum, rejeição de campos ou
textos inválidos e restauração exata. Nenhuma expansão foi necessária.
A exibição no treino, no intervalo, no fim e no histórico ainda precisa ser
conferida em emulador; igualdade de dados não comprova execução de todos os fluxos.


## Seis campos especiais de menus

Liberados STADIUM, FREE, DEFENSE, FREE KICK, KEEPER e MODE nas seções existentes.
As três realocações usam reservas nativas de 8 bytes em 0x3FBA0/0x3FBA8/0x3FBB0,
sem expandir a ROM. Os ponteiros e comprimentos das referências são verificados
antes da escrita. O rótulo do estádio troca as posições previstas e MODO aplica
as quatro posições do seletor; nomes alterados do treino usam o ajuste de
sufixos do writer Plus. Nenhuma rotina assembly nova foi criada.

17 testes da suíte Deluxe passaram. Incluem todos os 139 campos, os seis textos
especiais em português, ponteiros/comprimentos/posições, recusa de reserva ocupada
sem escrita parcial, restauração exata e checksum. A exibição no jogo permanece
pendente de teste em emulador.


## Preset FB96

As referências `project-data/fb96-sound-references.json` da branch Plus bcd70db
foram incorporadas sem alterar seus bytes. O Deluxe oferece prévia, aplicação
individual e aplicação em lote dos 74 sons catalogados, incluindo efeitos.
Todos os fluxos cabem nos comprimentos originais do Deluxe. As escolhas ficam
embutidas no projeto com source fb96, sem precisar de ROM doadora na reabertura.
18 testes passaram, incluindo comparação exata com as referências Plus, lote,
restauração, preservação de bytes vizinhos, controles da UI e entrega pelo HTTP.
A reprodução no emulador ainda precisa de conferência manual.


## Tela inicial — primeira etapa

A aba Tela inicial permite editar quatro paletas de 16 cores (bola, faixa,
letreiro e textos) e os rodapés copyright/licença. Endereços e bytes foram
comparados nas ROMs Deluxe e Plus: quatro paletas idênticas (32 bytes cada)
e os mesmos registros de objetos (116 e 72 bytes). Mapeamento obtido no HTML
Plus fornecido pelo usuário: TITLE_PALETTES, TITLE_GLYPHS e titleWriteMetaText.

Os textos usam somente os glifos já presentes na fonte original e são
centralizados com passo de 8 px quando alterados; slots excedentes são ocultados.
Não são gerados glifos estendidos. Valores originais preservam a ROM exatamente.
Cada controle permite restauração e os dados viajam no projeto Deluxe.
Ainda não foram migrados compositor, upload de imagens, camadas gráficas,
posicionamento livre ou prévia completa da abertura.
19 testes passaram: paletas, rodapés, regiões alteradas, checksum, restauração
e persistência pela UI simulada. Não houve teste de exibição no emulador.


## Gráficos comuns da abertura — letreiro

Comparação dos fluxos descomprimidos das duas ROMs anexas:

| Camada | Deluxe PC | Plus PC | Tamanho bruto | Conteúdo igual |
|---|---|---|---:|---|
| Bola/faixa | 0x150000 | 0x50000 | 5344 | Sim |
| Fotos | 0x12CB7F | 0x12CB7F | 14848 | Sim |
| Letreiro | 0x150F56 | 0x365AB | 3840 | Sim |
| Fonte | 0x13E154 | 0x13E154 | 992 | Sim |

Esta etapa implementa somente o letreiro. O endereço é resolvido pelo descritor
LoROM em 0x1198B; nenhum endereço de assets Plus é aplicado diretamente ao Deluxe.
A prévia recompõe os tiles com o layout de 31 objetos usado no Editor Plus e
a paleta do letreiro lida da ROM (ou alterada no projeto). Não é emulação da
animação e não é a prévia completa da abertura.

PNG/WebP de 176×65 é convertido à paleta existente, respeitando transparência.
Pixels compartilhados conflitantes ou fora da cobertura dos sprites são recusados.
Não se altera a composição/OAM. O PNG exportado sem edições, reimportado, mantém
os tiles exatamente. A gravação recomprime apenas o stream do letreiro, verifica
o roundtrip e recusa se exceder os 2766 bytes nativos, sem expansão automática.

20 testes passaram: leitura do ponteiro Deluxe, identidade, importação por UI
simulada, restauração, regiões restritas e reabertura. A imagem de prévia original
foi inspecionada. A exibição da ROM modificada no emulador permanece pendente.

### Tela inicial: camadas nativas e composição protegida

- Bola e faixa usam os descritores de gráficos e mapas da própria Deluxe; fotos usam seu descritor e o mapa estático da captura já utilizada pelo Plus. O mapa das fotos representa um quadro da abertura, sem simular animação.
- Importação e exportação PNG/WebP de bola, faixa, fotos e letreiro, com quantização para as paletas nativas. Fotos preservam a conversão planar da rotina do jogo. Restauração individual preserva as outras camadas.
- Prévia conjunta estática de 256 × 224 com os quatro elementos gráficos; rodapé e animações não são simulados nesta prévia.
- Compositor com deslocamento em pixels e escala, materializados nos gráficos salvos no projeto e na ROM. Trabalha dentro da área nativa de cada camada, sem modificar mapas, rotinas ou ampliar a ROM. As transformações são cumulativas; restaurar recomeça do original.
- Limitação relevante: vários pixels compartilham tiles. Muitas transformações livres são incompatíveis com esse compartilhamento e são recusadas integralmente, com a edição anterior preservada. Não há alocação de novos tiles nem promessa de posicionamento livre em toda a tela. Liberar essas operações exige uma etapa adicional de reorganização dos mapas e orçamento de tiles.
- Todas as importações/composições passam pela geração completa antes de entrar no projeto: conflito de pixels, saída da área e excesso do bloco comprimido original bloqueiam a aplicação. Nenhuma expansão automática para 4 MB foi introduzida.
- Validação: 23 testes com ROM Deluxe real, incluindo integridade sem alterações, reabertura de projeto, fotos planares, regiões de escrita, proteção de camadas compartilhadas e handlers da interface. Prévia conjunta conferida visualmente a partir dos pixels decodificados. Teste de execução no emulador e inspeção da interface em navegador permanecem pendentes.

### Jogadores: primeira etapa dos elencos Deluxe

- Nova aba Jogadores: 36 equipes regulares × 20 jogadores, com nomes originais, números, posição natural e nove atributos (1–10). Nomes editados são centralizados em oito células. Posição natural não altera coordenadas da formação.
- Formato compartilhado com a Plus: registros de sete bytes e codec TallMenuText. Endereços diferentes: atributos Deluxe em PC 0x50000 (Plus 0x150000); nomes Deluxe em 0x30000 + ponteiro da tabela 0x38138 (Plus 0x170000 + ponteiro). Não usar o writer Plus diretamente: seus espelhos de integridade são específicos da Plus.
- Ao trocar número, a interface troca também o número do jogador que já o usava. A geração exige uma permutação de 1–20 por equipe. Restauração por jogador preserva a unicidade dos números; restauração por equipe remove apenas as edições desse elenco.
- Projeto v1 ganha `changes.players`, objeto com chaves `equipe:jogador` (índices iniciando em zero). Apenas `name`, `jersey`, `naturalPosition` e `skills` são aceitos. Escrita validada integralmente antes de aplicar alterações; aparência permanece preservada. Projetos anteriores continuam válidos.
- Registros especiais posteriores aos 36 elencos regulares, novos times, táticas, aparência e transferência de elencos Plus permanecem pendentes. Os 2 MB são mantidos.
- Validação: 26 testes passaram com ROM Deluxe USA real; leitura dos 720 nomes/atributos, escrita restrita, números, rejeições, restauração exata e handlers da interface. O projeto convertido também gerou ROM antes/depois de uma edição de jogador, preservando todas as demais regiões. Execução no emulador e inspeção no navegador ainda pendentes.

### Fundação dos grupos e correspondência Deluxe → Plus

- A edição dos grupos passou a usar um writer comum ao projeto e à interface: `changes.groups` guarda os seis grupos nativos, com seis seleções por grupo. Trocas de vagas preservam a permutação das 36 seleções. Tabela em PC 0xDA3F; grupo especial e títulos gráficos permanecem intactos.
- Corrigido o catálogo Deluxe: índice 21 é Irlanda do Norte (Plus 53); índice 26 é Turquia (Plus 21). A Arábia Saudita da Plus 26 não tem portador original equivalente. Os outros 34 IDs regulares coincidem. A lista usada anteriormente vinha da Plus e identificava incorretamente esses dois elencos originais.
- `scripts/audit-deluxe-structure.mjs` compara exclusivamente as duas bases por hash e documenta os cinco consumidores confirmados da tabela de grupos. A saída em `docs/deluxe-structure-audit.json` é um inventário estático, não um patch estrutural.
- Limite desta entrega: seis grupos e 36 equipes. A expansão para 54 equipes/nove grupos, navegação, referências de partida e recursos dos novos times continua pendente. Projetos ampliados ainda não são aceitos para geração; o convertido do usuário não recebeu uma expansão parcial.
- Validação: 29 testes passaram com as ROMs reais, incluindo troca/restauração de grupos, preservação de regiões vizinhas, persistência via projeto, interface e correspondência entre seleções. Validação no emulador segue pendente.

### Protótipo estrutural de 42/48/54 equipes (experimental)

- Um preparador comum à geração e à interface amplia os registros em blocos de seis equipes, até nove grupos e 54 equipes normais. A reserva dos seis portadores especiais Deluxe e do Challenge é mantida. Projetos antigos continuam sem preparação estrutural.
- Nesta versão os dados cabem em 2 MB: atributos em PC 0x17BD20, nomes em 0x185000, tabelas em 0x176500 e quatro tabelas A4 na reserva 0x126180. Reservas são verificadas contra preenchimento FF antes de escrever e ficam separadas dos slots de estatísticas/treino existentes. Não foi introduzida expansão obrigatória para 4 MB.
- Foram redirecionados consumidores de atributos, nomes e seus dados paralelos, táticas, recursos de seleção/partida, descritores gráficos e tabelas de uniformes. Limites normal/especial/Challenge e contadores de páginas acompanham o número de equipes. Cinco leituras de grupos usam um helper em reserva nativa.
- Interface: adicionar grupo com seis equipes, escolher a equipe-base dos novos slots, nomear as equipes no projeto/Editor, editar seus 20 jogadores, trocar equipes entre vagas e restaurar a estrutura original. A leitura, persistência e geração usam `changes.structure` (`isssd-deluxe-structure-v1`, `experimental: true`). Grupos completos são exigidos nesta etapa; inclusão unitária com vagas vazias continua pendente.
- Limites visuais: os nomes semânticos no Editor não substituem as imagens dos nomes no jogo. Bandeiras, uniformes e demais recursos visuais dos novos slots são aliases da equipe-base. Os títulos gráficos dos novos grupos também são provisórios. O protótipo NÃO reproduz a apresentação completa da Plus.
- Migração: `scripts/migrate-plus-rosters-to-deluxe.mjs` importa as 54 seleções/1.080 jogadores e nove grupos de um projeto Plus esparso com a base Plus verificada. A correspondência trata Irlanda do Norte/Turquia e preserva os IDs nativos Deluxe. Apenas nomes, números, posições e nove atributos são convertidos; patches de código Plus não são aplicados à Deluxe. Táticas, aparência e os portadores Plus 54/55 ficam fora. A numeração duplicada é reparada preservando a camisa explicitamente solicitada e reportando a atribuição do número ausente ao outro jogador; duas solicitações explícitas conflitantes bloqueiam a migração.
- Validação: 32 testes passaram com ROMs/projetos reais, incluindo 42/48/54 elencos, endereçamento dos loaders nativos, preservação dos sete registros especiais/Challenge, reservas, reabertura, geração, sons já migrados e controles da interface. Execução no emulador e inspeção no navegador NÃO foram realizadas. A estrutura permanece experimental até conferir navegação e partidas, especialmente substituições, uniformes alternativos, grupos adicionais e seleção dos especiais.

### Interface compacta, fotos individuais e presets de texto

- A prévia do menu principal passou a compor o wallpaper e a paleta lidos da ROM, com um quadro estático de rolagem próximo da captura de referência. Os painéis e o motivo de bolas são aproximações em pixels; letras editáveis e a seleção têm cores/sombras semelhantes ao jogo. O seletor de destaque acompanha os nomes editados. Texto inválido mantém a última prévia válida e mostra o erro. Esta é uma prévia de composição, sem emular animação/PPU; os writers da ROM não foram alterados nesta etapa.
- Tela inicial: opções Foto 1–5, com recortes/máscaras do compositor Plus, importação redimensionada para o recorte, exportação e restauração individual. Pixels fisicamente compartilhados permanecem protegidos para preservar as outras fotos. A restauração usa os índices originais, evitando mudanças de bytes quando a paleta tem cores repetidas. A edição do conjunto continua disponível.
- Equipes: um seletor com todas as equipes e apenas um formulário por vez. Identidades nativas sem estrutura ampliada são exibidas como leitura; nomes semânticos e equipe-base seguem as capacidades já existentes do protótipo.
- Grupos: cartões em grade, com vagas em duas colunas e título ocupando a largura do cartão. Jogadores: dados em grade e nove sliders horizontais 1–10 sincronizados aos valores numéricos, sem recriar o slider durante o arraste.
- Textos: botões individuais Original/Português em 209 campos suportados, preservando entrada livre. Botões por seção e por tela de menu; os botões globais da aba Textos abrangem seus 185 campos (estratégias, textos nativos, menus/competições, treino e estatísticas). Menu principal, Cursor e rodapés têm ações próprias. Aplicação em lote valida a geração completa antes de substituir o estado e preserva edições concorrentes/outros domínios.
- Catálogo em português reaproveitado das inscrições Plus e restrito aos campos Deluxe validados. Campos invariáveis como MONO/numeração permanecem iguais. Restauração de todas as seções recupera exatamente a ROM sem edições.
- Validação: 36 testes passaram com ROMs/projetos reais, incluindo presets completos, limites, reversibilidade, preservação das outras quatro fotos e handlers dos controles compactos. A composição do menu foi inspecionada visualmente pelos pixels gerados. A inspeção da interface completa no navegador ficou bloqueada pelo acesso ao servidor local; execução em emulador continua pendente.
