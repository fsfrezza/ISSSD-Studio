// Inventory grounded in the Plus editor's special-rules catalog and Deluxe writers.
// Presence in the Plus ROM is distinct from a patch implemented for original Deluxe.
const item=(id,label,description,extra={})=>Object.freeze({id,label,description,status:'pending-mapping',...extra});
export const IMPROVEMENT_SECTIONS=Object.freeze([
 {id:'plus-rom',title:'Melhorias já presentes na ROM Plus',description:'Estas sete melhorias constavam como incluídas na base do Editor Plus. As opções disponíveis podem ser ativadas separadamente no Deluxe.',items:[
  item('low-goal-kick','Tiro de meta rasteiro com B','Permite uma reposição rasteira usando B.',{plusKey:'shortGoalKickB',status:'available',capability:'gameplay'}),
  item('final-attack','Aguardar o último ataque','Preserva o ataque dentro da área adversária antes de encerrar o tempo.',{plusKey:'lastAttackProtection',status:'available',capability:'gameplay'}),
  item('match-hour','Escolha do horário da partida','Libera a escolha do horário da partida.',{plusKey:'matchTimeSelection',status:'available',capability:'gameplay'}),
  item('one-minute','Partida de 1 minuto','Acrescenta a duração de um minuto às opções de tempo.',{plusKey:'oneMinuteMatch',status:'available',capability:'gameplay'}),
  item('penalty-interference','Corrigir interferência na cobrança de pênalti','Correção de entrada dos controles na cobrança; é distinta da correção do replay.',{plusKey:'penaltyInputFix',status:'available',capability:'gameplay'}),
  item('password-save','Salvar progresso por bateria','Grava o password de progresso na bateria e o preenche ao voltar à tela de password, inclusive após desligar.',{plusKey:'batterySave',status:'available',capability:'gameplay'}),
  item('controller-one-codes','Códigos secretos pelo controle 1 ou 2','Adaptar o uso pelo controle 1, mantendo o controle 2. São códigos diferentes: árbitro cachorro — ↑ ↑ ↓ ↓ ← → ← → B A; equipes secretas — R ↑ ↓ L X B ← A → Y.',{plusKey:'playerOneSecretCodes',status:'available',capability:'gameplay'}),
 ]},
 {id:'plus-options',title:'Opções adicionais do Editor Plus',description:'As três opções existiam no Editor Plus. As disponíveis têm adaptação própria para o Deluxe; as demais aguardam validação.',items:[
  item('backpass','Punição por recuo ao goleiro','Ao agarrar com as mãos um recuo proibido, aplica pênalti após a breve animação. O domínio com os pés continua permitido.',{plusKey:'goalkeeperBackpassNoHands',status:'available',capability:'gameplay'}),
  item('goalkeeper-free-kick','Goleiro como batedor de faltas','Permite escolher o goleiro como batedor oficial na tela de Substituições.',{plusKey:'goalkeeperFreeKickTaker'}),
  item('goalkeeper-corner','Goleiro como batedor de escanteios','Permite escolher o goleiro como batedor oficial de escanteios, independentemente das faltas.',{plusKey:'goalkeeperCornerKickTaker',status:'available',capability:'gameplay'}),
 ]},
 {id:'structure',title:'Diferenças de estrutura: Deluxe, Plus e versão GG',description:'O Deluxe inicia com 36 equipes regulares. A Plus possui 54 regulares em nove grupos de seis, mais All Star e Autores. Na versão GG são 60: 54 regulares e seis GG no grupo secreto.',items:[
  item('deluxe-base','ROM Deluxe original como base','Abre a Deluxe original e gera uma cópia com as alterações do projeto.',{status:'available',capability:'always'}),
  item('plus-groups','Nove grupos regulares de seis equipes','A estrutura ampliada suporta os nove grupos regulares. A organização e os nomes salvos no projeto são preservados.',{status:'available',capability:'groups'}),
  item('gg-secret','Seis equipes GG no grupo secreto','Adiposos, Bugigangas, Encefalicos, Macucos, Teluricos e Vaporosos ocupam o grupo secreto; não são um décimo grupo regular nem seis equipes somadas aos dois All Stars.',{status:'available',capability:'gg'}),
  item('team-visuals','Bandeiras, uniformes e aparência próprios por equipe','O projeto de referência guarda os recursos das 60 equipes por identidade. Fotografias de seleção e retratos têm adaptação separada.',{status:'available',capability:'visuals'}),
  item('expansion','Expansão automática para 4 MB quando necessária','A exportação amplia a ROM quando a estrutura, os recursos visuais ou as mídias de abertura exigem espaço.',{status:'available',capability:'expansion'}),
  item('individual-tactics','Táticas individualizadas por equipe','Edite esquema base, posições, funções DF/MF/FW e Atacar. Cada equipe possui seu próprio registro tático.',{status:'available',capability:'tactics'}),
 ]},
 {id:'editor',title:'Recursos de edição do Plus no Editor Deluxe',description:'O estado indica recursos disponíveis no editor ou dados presentes no projeto aberto. Estar disponível não significa alterar a ROM automaticamente.',items:[
  item('opening-media','Substituir as três telas de abertura por imagem ou vídeo','Imagem e vídeo convertido em quadros SNES, com fades. Vídeo experimental, sem áudio importado e limitado pelo espaço da ROM.',{status:'available',capability:'opening'}),
  item('team-photos','Fotos próprias na seleção de equipes','Importa poses, rostos, acessórios e cinco paletas por equipe; exibe a formação na aba Equipes.',{status:'available',capability:'photos'}),
  item('player-closeups','Aparência individual no telão','Adapta pele e cabelo aos retratos do telão e preserva as paletas de cenas das 60 equipes. Importação de fotografias individuais e edição das demais cenas ainda não estão disponíveis.',{status:'available',capability:'appearance'}),
  item('group-editing','Trocar equipes e grupos e editar nomes de grupos','Disponível na aba Grupos, incluindo os dados do grupo secreto quando o projeto os contém.',{status:'available',capability:'always'}),
  item('player-editing','Editar os jogadores das equipes habilitadas','Nomes, números, posições e atributos das equipes contidas no projeto, incluindo os 1.200 jogadores na versão de 60 equipes.',{status:'available',capability:'always'}),
  item('title-menu-editing','Editar tela de título e menu principal','Camadas, imagens, textos e cores nos recursos já adaptados ao Deluxe.',{status:'available',capability:'always'}),
  item('text-editing','Editar textos e aplicar português','Textos organizados por tela, com restauração e validação do espaço disponível.',{status:'available',capability:'always'}),
  item('audio-editing','Editar sons e vozes','Substituição e restauração de amostras, com os catálogos de áudio disponíveis na aba Sons e vozes.',{status:'available',capability:'always'}),
  item('stadium-editing','Editar cores dos estádios','Paletas dos oito estádios originais na aba Estádios.',{status:'available',capability:'always'}),
  item('uniform-flag-pixels','Editar uniformes e bandeiras por pixels','Edite o desenho e as cores próprios da equipe, com lápis, preenchimento, conta-gotas, desfazer/refazer e importação de imagem.',{status:'available',capability:'visuals'}),
  item('player-appearance-editing','Editar pele e cabelo por jogador','Prévias nativas de frente, costas e perfil, 16 tipos de cabelo, dois conjuntos de pele/cabelo e cores independentes dos goleiros.',{status:'available',capability:'appearance'}),
 ]},
 {id:'planned',title:'Planejadas e experimentais',description:'Itens ainda indisponíveis. Nenhum deles é aplicado à ROM por aparecer nesta lista.',items:[
  item('penalty-replay','Impedir defesa da bola durante o replay do pênalti','Referência PB9T recebida e comparada. A correção específica ainda precisa ser isolada e validada; não confundir com a interferência na cobrança.'),
  item('backpass-direct-free-kick','Recuo punido com tiro livre dentro da área','Alternativa experimental à punição por pênalti, com posicionamento de barreira e goleiro ainda em revisão.'),
  item('second-touch','Punir segundo toque em faltas e escanteios','Experimento de jogabilidade ainda sem opção integrada e validada para o Editor Deluxe.'),
  item('goalkeeper-stability','Corrigir travamentos nas rotinas do goleiro','Revisar seleção de batedor, preparação da bola e substituições antes de disponibilizar os patches de goleiro no Deluxe.'),
 ]},
].map(section=>Object.freeze({...section,items:Object.freeze(section.items)})));
export const IMPROVEMENTS=Object.freeze(IMPROVEMENT_SECTIONS.flatMap(s=>s.items));
export function deluxeImprovementState(item,project){
 if(item.status!=='available')return {kind:'pending',label:'Aguardando adaptação / validação'};
 const s=project?.changes?.structure,visuals=project?.changes?.teamVisuals,opening=Object.keys(project?.changes?.openingMedia??{}).length>0;
 if(item.capability==='gameplay')return project?.changes?.improvements?.includes(item.id)?{kind:'active',label:'Aplicar ao gerar a ROM'}:{kind:'inactive',label:'Desativada'};
 if(item.capability==='always')return {kind:'available',label:'Disponível no Editor Deluxe'};
 if(!project)return {kind:'available',label:'Abra um projeto para conferir'};
 const active={appearance:Object.values(project?.changes?.players??{}).some(p=>p.appearance),groups:s?.groups?.length===9,gg:s?.teams?.length===60&&s.groups?.length===9&&s.secret?.length===6&&new Set(s.secret.map(slot=>s.teams[slot]?.plusId??slot)).size===6&&s.secret.every(slot=>(s.teams[slot]?.plusId??slot)>=54&&(s.teams[slot]?.plusId??slot)<60)&&s.groups.every(row=>row.every(slot=>!s.secret.includes(slot))),visuals:!!visuals,photos:!!project?.changes?.teamPhotos,tactics:!!project?.changes?.tactics,opening,expansion:Object.values(project?.changes?.players??{}).some(p=>p.appearance)||project?.changes?.improvements?.includes('goalkeeper-corner')||project?.changes?.improvements?.includes('backpass')||s?.teams?.length===60||!!visuals||opening||!!project?.changes?.teamPhotos||!!project?.changes?.tactics}[item.capability];
 return active?{kind:'active',label:item.capability==='expansion'?'Automática ao gerar a ROM':'Presente no projeto'}:{kind:'inactive',label:'Não aplicado neste projeto'};
}
export function deluxeStructureSummary(project){
 const s=project?.changes?.structure;if(!s)return project?'Projeto com a estrutura original Deluxe.':'Abra a ROM ou um projeto para conferir sua estrutura.';
 const gg=deluxeImprovementState(IMPROVEMENTS.find(i=>i.id==='gg-secret'),project).kind==='active';
 return s.teams.length+' equipes · '+s.groups.length+' grupos regulares'+(s.secret?' · '+s.secret.length+' equipes secretas':'')+(gg?' · GG secreto preservado':'')+'.';
}
