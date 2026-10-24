import vm from'node:vm';import fs from'node:fs';
import{independentTeamsRuntime}from'../scripts/patch-independent-teams.mjs';
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.value='';this.className='';this._text='';this.style={};this.classList={add(){},remove(){},toggle(){},contains(){return false;}};}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 set innerHTML(v){this.children=[];this._text='';}get innerHTML(){return this._text;}
 append(...nodes){this.children.push(...nodes);}appendChild(n){this.append(n);return n;}replaceChildren(...nodes){this.children=nodes;}setAttribute(k,v){this[k]=String(v);}
 get options(){return this.tagName==='select'?this.children:[];}
 querySelectorAll(selector){const match=n=>selector.split(',').some(s=>s[0]==='.'?n.className.split(' ').includes(s.slice(1)):n.tagName===s);return this.children.flatMap(n=>[...(match(n)?[n]:[]),...n.querySelectorAll(selector)]);}
 querySelector(s){return this.querySelectorAll(s)[0]??null;}
}
export function independentEditorFixture(){
 const body=new Element('body'),head=new Element('head'),nodes={},pages={};
 for(const id of ['teams','groups','players','uniforms','flags']){const p=new Element('section');p.id='page-'+id;p.className='page';body.append(p);pages[p.id]=p;nodes[p.id]=p;}
 for(const id of ['teamList','playerTeamSelect','bulkTeamSelect','flagTeamSelect','flagDestTeamSelect','flagCompareTeamSelect','uniformTeamSelect','uniformDestTeamSelect','gkTeamSelect','playerSelect']){const n=new Element('select');n.id=id;nodes[id]=n;pages['page-players'].append(n);}
 for(const id of ['plusGroupCards','plusGroupOrganizerBox','plusGroupWarnings','playerNameOffset','playerAttrOffset','playerRaw','playerDirtyBadge','teamTitle','teamIdBadge','teamReferenceName','teamFlagColors','teamFlagOffsetBadge','teamFlagRaw','pName','pNumber','pPosition','pSpeed']){const n=new Element('div');n.id=id;nodes[id]=n;body.append(n);}
 const document={body,head,readyState:'complete',createElement:t=>new Element(t),querySelectorAll:s=>body.querySelectorAll(s),getElementById:id=>nodes[id]??null};
 const context={document,structuredClone,console,Uint8Array,setTimeout,clearTimeout,URL,Blob,TextEncoder,TextDecoder};context.window=context;context.globalThis=context;vm.createContext(context);
 vm.runInContext(`
 var TEAM_NAMES=Array.from({length:56},(_,i)=>'Native '+i),TEAM_COUNT=56,activeRomProfile={id:'iss-deluxe-plus',teamCount:56},teams=[],currentTeam=0,currentPlayer=0,rom=new Uint8Array(0x400000),original=rom.slice(),applied=null,physicalWrites=0;
 var UNIFORM_SLOT_LABELS=Array.from({length:15},(_,i)=>'Cor '+i);
 var $=id=>document.getElementById(id),hx=n=>String(n),rgbHex=()=> '#000000',bgrToRgb=()=>({r:0,g:0,b:0}),rgbToBgr=()=>0,hexRgb=()=>({r:0,g:0,b:0});
 function bulkReadRow(){}function bulkRosterRow(){return '';}function saveBulkRoster(){}function studioRestoreSkills(){}function plusTacSwapSelectedPlayers(){}function plusTacSelectedArray(){return[0,1];}
 function playerTransferObject(t,p){return{player:{}};}function teamTransferObject(t){return{team:{}};}async function importCurrentTeamFile(){}
 function buildTeams(){teams=TEAM_NAMES.slice(0,TEAM_COUNT).map(name=>({name,players:Array.from({length:20},(_,i)=>({name:'Original '+i,number:i+1,position:i===0||i===11?1:2,speed:5,skills:{speed:5},appearance:{hair:1,palette:0},hair:1,palette:0,baseSlot:i+1,playerId:'0:'+(i+1)}))}));}buildTeams();
 function refreshPlusTeamFromRom(){} function readPlayerRecordFromRom(){return{fixed:'Original',attrs:{}};}
 function playerNameFileOffset(){return 0;}function plusPlayerAttrOffset(){return 0;}
 function populateTeamControls(){for(const id of ['teamList','playerTeamSelect','bulkTeamSelect','flagTeamSelect','flagDestTeamSelect','flagCompareTeamSelect','uniformTeamSelect','uniformDestTeamSelect','gkTeamSelect']){const n=$(id);n.innerHTML='';TEAM_NAMES.forEach((name,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=name;n.append(o);});n.value=String(currentTeam);}}
 function renderPlayerList(){$('playerSelect').replaceChildren();teams[currentTeam].players.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=p.name;$('playerSelect').append(o);});}
 function renderPlayer(){const p=teams[currentTeam].players[currentPlayer];$('pName').value=p.name;$('pNumber').value=p.number;$('pPosition').value=p.position;$('pSpeed').value=p.speed;}
 function renderTeam(){} function renderPlusTeamTactics(){}function renderColors(){}function renderFlagColorEditor(){}function renderFlagPreviewInto(){}function renderVerifiedFlagBlock(){}function renderFlagDecompressedPreview(){}function renderFlagGraphicsDiagnostic(){}function renderPreparedIdentityCount(){}function drawFlagPart24x8(){}function drawFlagFull(){}function renderKitPreview(){}function decodeSnes4bppTile(){}
 function renderEverything(){populateTeamControls();renderPlayerList();renderPlayer();renderPlusGroupOrganizer();}
 function plusTacticalRecordForTeam(){return null;}function plusTacticalSharingForTeam(){return[];}
 function recordAction(){physicalWrites++;return true;}function savePlayerName(){physicalWrites++;}function savePlayerAttrs(){physicalWrites++;}function savePlusJerseyPermutation(){physicalWrites++;}function restorePlayer(){physicalWrites++;}
 function studioTeamsV3ReadFull(){return{schema:'isssd-teams-v1',version:3,teams:Object.fromEntries(Array.from({length:56},(_,i)=>[i,{teamId:i,teamName:TEAM_NAMES[i],players:teams[i]?.players||[]}]))};}
 function studioTeamsV3Snapshot(){return studioTeamsV3ReadFull();}function studioTeamsV3OriginalPlayer(){return{};}
 function uniformRecordOffset(){return 0;}function uniformInfo(){return{};}function flagInfo(){return{};}function bestFlagDecomp(){return{};}function setFlagColor(){}function setFlagColorBgr(){}function copyFlagPalette(){}function restoreFlagPalette(){}function applyFlagPreset(){}function flagPaletteBytes(){return new Uint8Array(8);}function renderSelectionAssetLab(){}function renderPlusGroupOrganizer(){}function plusGroupsObject(){return{};}function writePlusGroups(){}
 var __ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=p=>p,studioProjectObject=async()=>({state:{semantic:{teamsV1:studioTeamsV3Snapshot()}}}),studioApplyProjectWithBase=async p=>{if(p.fail)throw Error('Importação falhou');applied=p;return true;},studioUpdateBadge=()=>{};
 `,context);
 vm.runInContext(fs.readFileSync(new URL('../editor-src/independent-teams-core.mjs',import.meta.url),'utf8'),context);
 vm.runInContext(independentTeamsRuntime(),context);
 return{window:context,document,pages,nodes,applied:()=>context.applied};
}
