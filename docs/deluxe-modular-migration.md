# Deluxe modular: migração incremental

## Recursos atualmente disponíveis

Além das oito estratégias, a entrada Deluxe agora permite editar:

- Paletas de 16 cores dos oito estádios, usando o reader/writer do Plus.
- 20 textos nativos independentes. Cinco outros labels auditados fazem parte dos
  blocos de ajuda do Cursor e são editados somente dentro desses blocos.
- 14 blocos de ajuda textual do Cursor, com o codec e descritores do Plus.
- 133 textos adicionais de menus, opções, competições, treino, desafios,
  recordes, passwords, cenários e créditos, organizados em 20 seções.
  Foram excluídos seis campos que exigem relocation ou ajustes de layout.
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
(MP3/WAV e outros conforme suporte local), além de BRR. Presets de áudio de
outras ROMs não foram incorporados nesta etapa. Uma importação BRR com dados depois do bloco final é rejeitada.

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
