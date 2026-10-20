// Installed inside the legacy lexical scope, replacing the obsolete fixed image preview.
let nativeAppearanceIdentity=null,nativeAppearanceFrame=0;
const nativeAppearanceCore=window.ISSSDPlayerAppearanceCore;
function nativeAppearanceSupported(){return !!rom&&activeRomProfile?.id==='iss-deluxe-plus';}
function nativeAppearanceNote(message,error=false){const n=$('appearanceNativeStatus');if(n){n.textContent=message;n.className='note '+(error?'error':'info');}}
function nativeAppearanceCanvas(canvas,hair,frame,palette){
 const pixels=nativeAppearanceCore.decodeNativeHairTile(rom,hair,frame);canvas.width=8;canvas.height=8;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,8,8);
 if(!pixels)return;
 const img=ctx.createImageData(8,8);
 for(let i=0;i<64;i++){if(!pixels[i])continue;const color=palette[pixels[i]];if(color===undefined)throw Error('Cor do quadro fora da paleta.');const hex=nativeAppearanceCore.appearanceBgrHex(color);for(let p=0;p<3;p++)img.data[i*4+p]=parseInt(hex.slice(1+p*2,3+p*2),16);img.data[i*4+3]=255;}
 ctx.putImageData(img,0,0);
}
function nativeAppearanceSwatches(colors){return '<span class="native-swatches">'+colors.map(c=>`<span style="background:${c}" title="${c.toUpperCase()}"></span>`).join('')+'</span>';}
function renderHairGallery(){
 const g=$('hairGallery');if(!g)return;
 g.innerHTML=Array.from({length:14},(_,hair)=>`<button type="button" class="native-hair-option" data-hair-index="${hair}" aria-pressed="${hair===appearanceTempHair}" title="${hair===0?'Cabeça original do sprite, sem sobreposição':'Sobreposição nativa '+hair}">${hair===0?'<span class="native-default-head">Original<br>do sprite</span>':'<canvas aria-label="Cabelo '+hair+'"></canvas>'}<span>${hair===0?'0 · Padrão':'Tipo '+hair}</span></button>`).join('');
 const palettes=nativeAppearanceCore.readNativeAppearancePalettes(rom,currentTeam),palette=palettes.palettes[appearanceTempPalette];
 g.querySelectorAll('[data-hair-index]').forEach(button=>{const hair=Number(button.dataset.hairIndex);if(hair)nativeAppearanceCanvas(button.querySelector('canvas'),hair,nativeAppearanceFrame,palette);button.onclick=()=>{appearanceTempHair=hair;renderAppearancePreview();};});
}
function appearancePaletteCounts(){const ps=teams[currentTeam].players;return [ps.filter(p=>p.palette===0).length,ps.filter(p=>p.palette===1).length];}
function renderAppearanceSharedColors(){} // Palette artwork is shown directly by the new native palette cards.
function renderAppearancePreview(){
 appearanceTempHair=clamp(appearanceTempHair,0,13);appearanceTempPalette=clamp(appearanceTempPalette,0,1);
 $('appearanceHairRange').value=appearanceTempHair;$('appearanceHairValue').value=appearanceTempHair;$('appearancePalette').value=appearanceTempPalette;
 $('appearanceSelectedSummary').textContent=`Seleção: cabelo ${appearanceTempHair} · paleta ${appearanceTempPalette}`;
 for(const id of ['applyAppearanceBtn','applyAppearanceNextBtn','appearanceRestoreNativeBtn'])$(id).disabled=!nativeAppearanceSupported();
 if(!nativeAppearanceSupported()){nativeAppearanceNote('Abra um projeto Deluxe Plus para editar a aparência.',true);return;}
 try{
  const data=nativeAppearanceCore.readNativeAppearancePalettes(rom,currentTeam),cards=$('appearanceNativePalettes');
  cards.innerHTML=data.colors.map((colors,i)=>`<button type="button" class="native-palette-option" data-native-palette="${i}" aria-pressed="${appearanceTempPalette===i}">${appearanceTempHair?'<canvas aria-label="Prévia da paleta '+i+'"></canvas>':''}<strong>Paleta ${i} · ${i?'alternativa':'principal'}</strong><div>Pele · sombras e luzes</div>${nativeAppearanceSwatches(colors.slice(2,6))}<div>Cabelo ${nativeAppearanceSwatches([colors[1]])}</div></button>`).join('');
  cards.querySelectorAll('[data-native-palette]').forEach(button=>{const i=Number(button.dataset.nativePalette);if(appearanceTempHair)nativeAppearanceCanvas(button.querySelector('canvas'),appearanceTempHair,nativeAppearanceFrame,data.palettes[i]);button.onclick=()=>{appearanceTempPalette=i;renderAppearancePreview();};});
  const p=teams[currentTeam].players[currentPlayer],gk=p.position===1||['GO','GK'].includes(String(p.position));
  $('appearanceNativePaletteInfo').textContent=(data.identical?'Nesta equipe, as duas paletas de jogadores de linha possuem as mesmas cores. ':'As duas paletas podem mudar pele, cabelo e calçado em conjunto. ')+(gk?'Goleiro: estas são referências da equipe; a cor do goleiro em campo vem da paleta própria de goleiro.':'A escolha pertence ao jogador; as cores de cada conjunto são compartilhadas pela equipe.');
  const counts=appearancePaletteCounts();$('palette0Count').textContent=counts[0];$('palette1Count').textContent=counts[1];
  renderHairGallery();const frames=$('appearanceNativeFrames');
  frames.innerHTML=appearanceTempHair?Array.from({length:24},(_,i)=>`<canvas title="Quadro ${i+1}" aria-label="Quadro nativo ${i+1}"></canvas>`).join(''):'<p class="subtle">Tipo 0: o jogo usa a cabeça já desenhada no sprite do corpo. Não há sobreposição de cabelo para exibir.</p>';
  frames.querySelectorAll('canvas').forEach((canvas,i)=>nativeAppearanceCanvas(canvas,appearanceTempHair,i,data.palettes[appearanceTempPalette]));
  $('appearanceNativeSkinCatalog').innerHTML=data.presets.map(p=>`<div><strong>${p.label}</strong>${nativeAppearanceSwatches(p.colors.slice(0,4))}</div>`).join('');
  nativeAppearanceNote('Escolha as opções e use Aplicar ao jogador. Salve o projeto para guardar a escolha; Salvar ROM grava a aparência na fase Jogadores.');
 }catch(e){nativeAppearanceNote('Não foi possível ler a prévia nativa: '+e.message,true);}
}
function loadAppearancePlayer(index){
 currentPlayer=(index+20)%20;const p=teams[currentTeam].players[currentPlayer];
 const resolved=studioTeamsV3ReadFull()?.teams?.[String(currentTeam)]?.players?.find(q=>q.playerId===p.playerId&&Number(q.baseSlot)===Number(p.baseSlot))||studioTeamsV3ReadFull()?.teams?.[String(currentTeam)]?.players?.[currentPlayer];
 const value=nativeAppearanceCore.validatePlayerAppearance({hair:Number(resolved?.appearance?.hair??p.appearance?.hair??p.hair),palette:Number(resolved?.appearance?.palette??p.appearance?.palette??p.palette)});
 appearanceTempHair=value.hair;appearanceTempPalette=value.palette;
 $('appearanceCurrentSummary').textContent=`Aplicado ao jogador: cabelo ${value.hair} · paleta ${value.palette}`;
 nativeAppearanceIdentity={team:currentTeam,playerId:p.playerId,baseSlot:p.baseSlot};
 $('appearancePlayerLabel').textContent=`${p.name||'(sem nome)'} · ${TEAM_NAMES[currentTeam]}`;
 $('appearanceSlotBadge').textContent=`Jogador ${currentPlayer+1}/20`;
 renderAppearancePreview();
 renderAppearanceTransferPlayers();
}
function openAppearanceDialog(){
 const frame=$('appearanceNativeFrame');frame.innerHTML=Array.from({length:24},(_,i)=>`<option value="${i}">Quadro ${i+1}</option>`).join('');frame.value=nativeAppearanceFrame;
 frame.onchange=()=>{nativeAppearanceFrame=Number(frame.value);renderAppearancePreview();};
 $('appearanceRestoreNativeBtn').onclick=()=>{try{const id=nativeAppearanceIdentity,p=studioTeamsV3OriginalPlayer(id.team,id.baseSlot);appearanceTempHair=p.appearance.hair;appearanceTempPalette=p.appearance.palette;renderAppearancePreview();nativeAppearanceNote('Aparência original selecionada. Use Aplicar ao jogador para confirmar.');}catch(e){nativeAppearanceNote(e.message,true);}};
 setupAppearanceTransfer();loadAppearancePlayer(currentPlayer);$('appearanceDialog').showModal();
}
function closeAppearanceDialog(){$('appearanceDialog').close();}
function commitAppearance(closeAfter=true){
 try{
  if(!nativeAppearanceSupported())throw Error('Abra um projeto Deluxe Plus.');
  const identity=nativeAppearanceIdentity;if(identity?.team!==currentTeam)throw Error('A equipe mudou. Reabra a aparência do jogador.');
  if(typeof window.__ISSSD_TEAMS_SET_PLAYER_APPEARANCE_V1__!=='function')throw Error('Editor semântico de aparência indisponível.');
  window.__ISSSD_TEAMS_SET_PLAYER_APPEARANCE_V1__(currentTeam,identity,{hair:appearanceTempHair,palette:appearanceTempPalette});
  if(typeof studioUpdateBadge==='function')studioUpdateBadge();
  if(closeAfter){$('appearanceDialog').close();renderEverything();}else{const next=(currentPlayer+1)%20;renderEverything();loadAppearancePlayer(next);}
 }catch(e){nativeAppearanceNote('Aparência não aplicada: '+e.message,true);}
}
function applyAppearance(){commitAppearance(true);}
function applyAppearanceNext(){commitAppearance(false);}

function nativeAppearanceTransferRoster(team){return studioTeamsV3ReadFull()?.teams?.[String(team)]?.players||[];}
function nativeAppearanceTransferRef(){
 const team=Number($('appearanceTransferTeam').value),players=nativeAppearanceTransferRoster(team);
 const p=players[Number($('appearanceTransferPlayer').value)];
 if(!p)throw Error('Selecione outro jogador.');
 return {team,identity:{playerId:p.playerId,baseSlot:p.baseSlot}};
}
function renderAppearanceTransferSummary(){
 try{
  const ref=nativeAppearanceTransferRef(),p=nativeAppearanceTransferRoster(ref.team).find(p=>p.playerId===ref.identity.playerId&&Number(p.baseSlot)===Number(ref.identity.baseSlot));
  $('appearanceTransferSummary').textContent=`${p.name||'(sem nome)'} · cabelo ${p.appearance.hair} · paleta ${p.appearance.palette}. `+(ref.team!==currentTeam?'Equipe diferente: copiar o índice da paleta não copia suas cores.':'A equipe compartilha as mesmas cores.');
  const same=ref.team===currentTeam&&ref.identity.playerId===nativeAppearanceIdentity?.playerId&&Number(ref.identity.baseSlot)===Number(nativeAppearanceIdentity?.baseSlot);
  for(const id of ['appearanceCopyToBtn','appearanceCopyFromBtn','appearanceSwapBtn'])$(id).disabled=same||!nativeAppearanceSupported();
 }catch(e){$('appearanceTransferSummary').textContent=e.message;for(const id of ['appearanceCopyToBtn','appearanceCopyFromBtn','appearanceSwapBtn'])$(id).disabled=true;}
}
function renderAppearanceTransferPlayers(){
 const select=$('appearanceTransferPlayer'),old=select.value;select.innerHTML='';
 nativeAppearanceTransferRoster(Number($('appearanceTransferTeam').value)).forEach((p,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=`${p.slot}. ${p.name||'(sem nome)'}`;select.appendChild(option);});
 select.value=old||'0';if(!select.value)select.value='0';renderAppearanceTransferSummary();
}
function setupAppearanceTransfer(){
 const select=$('appearanceTransferTeam'),old=select.value;select.innerHTML='';
 const state=studioTeamsV3ReadFull();
 for(const key of Object.keys(state?.teams||{}).sort((a,b)=>Number(a)-Number(b))){const option=document.createElement('option');option.value=key;option.textContent=String(state.teams[key].teamName||TEAM_NAMES[Number(key)]||('Equipe '+key));select.appendChild(option);}
 select.value=old||String(currentTeam);if(!select.value)select.value=String(currentTeam);
 select.onchange=renderAppearanceTransferPlayers;$('appearanceTransferPlayer').onchange=renderAppearanceTransferSummary;
 $('appearanceCopyToBtn').onclick=()=>transferAppearance('to');$('appearanceCopyFromBtn').onclick=()=>transferAppearance('from');$('appearanceSwapBtn').onclick=()=>transferAppearance('swap');
}
function transferAppearance(direction){
 try{
  if(!nativeAppearanceSupported()||nativeAppearanceIdentity?.team!==currentTeam)throw Error('Reabra a aparência do jogador no projeto Plus.');
  const current={team:currentTeam,identity:nativeAppearanceIdentity},other=nativeAppearanceTransferRef();
  const source=direction==='from'?other:current,target=direction==='from'?current:other;
  const apply=window.__ISSSD_TEAMS_TRANSFER_PLAYER_APPEARANCE_V1__;if(typeof apply!=='function')throw Error('Transferência de aparência indisponível.');
  if(!apply(source,target,direction==='swap'?'swap':'copy'))throw Error('Não foi possível atualizar os jogadores.');
  if(typeof studioUpdateBadge==='function')studioUpdateBadge();renderEverything();loadAppearancePlayer(currentPlayer);
  nativeAppearanceNote((direction==='swap'?'Atributos de aparência trocados.':'Atributos de aparência copiados.')+' Salve o projeto para guardar e Salvar ROM para exportar. As cores continuam vinculadas às paletas de cada equipe.');
 }catch(e){nativeAppearanceNote('Operação não aplicada: '+e.message,true);}
}
