let playerSpriteSession=null,playerSpriteClipboard=null,playerSpriteAnimation=null;
function stopPlayerSpriteAnimation(){if(playerSpriteAnimation!==null){clearInterval(playerSpriteAnimation);playerSpriteAnimation=null;}}
function setupPlayerSpriteEditor(){
 stopPlayerSpriteAnimation();
 const engine=window.ISSSDPlayerSpriteCore,by=id=>document.getElementById(id);if(!engine||!by('spriteOpen'))return;
 const session={drafts:new Map(),undo:[],redo:[],ref:null,frame:null,color:3,drag:false,sequence:[],tick:0};playerSpriteSession=session;
 by('spriteOpen').disabled=!nativeAppearanceSupported();by('spriteWorkspace').hidden=true;by('spriteStyle').innerHTML=Array.from({length:15},(_,i)=>`<option value="${i+1}">${nativeAppearanceCore.hairStyleLabel(i+1)}</option>`).join('');by('spriteFrame').innerHTML=Array.from({length:24},(_,i)=>`<option value="${i}">${i+1} · ${engine.PLAYER_HAIR_POSE_LABELS?.[i]||'Quadro'}</option>`).join('');
 by('spriteStyle').value=String(appearanceTempHair||1);by('spriteFrame').value=String(nativeAppearanceFrame);by('spriteKind').value=appearanceTempHair?'hair':'body';
 const edits=()=>window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__?.spriteEdits;
 const ref=()=>by('spriteKind').value==='hair'?{kind:'hair',style:Number(by('spriteStyle').value),frame:Number(by('spriteFrame').value)}:{kind:'body',id:by('spriteBody').value};
 const key=r=>r.kind+':'+engine.spriteFrameKey(r);
 const stash=()=>{if(session.ref&&session.frame)session.drafts.set(key(session.ref),{ref:{...session.ref},pixels:session.frame.pixels.slice()});};
 const status=text=>by('spriteStatus').textContent=text;
 function previewEdits(){const value=edits()||{},next={...value,version:1,hair:{...value.hair},body:{...value.body}};for(const entry of session.drafts.values())next[entry.ref.kind][engine.spriteFrameKey(entry.ref)]=entry.pixels;if(session.ref&&session.frame)next[session.ref.kind][engine.spriteFrameKey(session.ref)]=session.frame.pixels;return next;}
 function drawReference(pose){
  if(!session.ref)return;
  try{const view=engine.renderPlayerReference(rom,session.ref,previewEdits(),pose?{pose}:{}),c=by('spriteReference');
   if(!view){c.width=1;c.height=1;by('spriteReferenceInfo').textContent='Montagem desta pose ainda não mapeada.';by('spritePlay').disabled=true;return;}
   c.width=view.width;c.height=view.height;c.style.width=view.width*8+'px';c.style.height=view.height*8+'px';const ctx=c.getContext('2d'),palette=nativeAppearanceCore.readNativeAppearancePalettes(rom,currentTeam).colors[appearanceTempPalette];ctx.clearRect(0,0,c.width,c.height);view.pixels.forEach((v,i)=>{if(v){ctx.fillStyle=palette[v];ctx.fillRect(i%view.width,Math.floor(i/view.width),1,1);}});
   by('spriteReferenceInfo').textContent=view.name+' · cabelo '+(view.pose.frame+1)+' de 24'+(playerSpriteAnimation!==null?' · animando':'');
   by('spritePlay').disabled=session.sequence.length<2;
  }catch(e){by('spriteReference').width=1;by('spriteReference').height=1;by('spriteReferenceInfo').textContent='Referência indisponível: '+e.message;}
 }
 function draw(){
  const {width,height,pixels}=session.frame,c=by('spriteCanvas');c.width=width;c.height=height;const zoom=width<=16?20:8;c.style.width=width*zoom+'px';c.style.height=height*zoom+'px';const ctx=c.getContext('2d');ctx.clearRect(0,0,width,height);const palette=nativeAppearanceCore.readNativeAppearancePalettes(rom,currentTeam).colors[appearanceTempPalette];
  pixels.forEach((v,i)=>{if(v){ctx.fillStyle=palette[v];ctx.fillRect(i%width,Math.floor(i/width),1,1);}});
  by('spriteColors').innerHTML='';palette.forEach((color,i)=>{const b=document.createElement('button');b.type='button';b.style.background=i?color:'transparent';b.textContent=i;b.title=i?'Índice '+i:'Transparente';b.setAttribute('aria-pressed',session.color===i);b.onclick=()=>{session.color=i;draw();};by('spriteColors').append(b);});
  drawReference();
 }
 function load(){try{stopPlayerSpriteAnimation();by('spritePlay').textContent='Animar movimento';stash();session.ref=ref();const pending=session.drafts.get(key(session.ref));session.frame=engine.readPlayerSprite(rom,session.ref,pending?engine.setPlayerSprite(edits(),session.ref,pending.pixels):edits(),{baldBase:true});session.undo=[];session.redo=[];session.sequence=engine.playerReferenceSequence(engine.playerReferencePose(session.ref));session.tick=0;
 const body=session.ref.kind==='body';by('spriteStyle').disabled=body;by('spriteFrame').disabled=body;by('spriteBody').disabled=!body;by('spriteSearch').disabled=!body;
 by('spriteDescription').textContent=body?session.frame.record.name+' · '+(session.frame.record.mounted?'Corpo montado':'Tiles em ordem nativa')+' · '+session.frame.width+' × '+session.frame.height:'Cabelo '+session.ref.style+' · quadro '+(session.ref.frame+1)+' de 24';draw();status('As alterações pendentes são mantidas ao trocar de quadro. Aplique antes de fechar esta janela.');}catch(e){status(e.message);}}
 function filter(){const previous=by('spriteBody').value,q=by('spriteSearch').value.toLowerCase();by('spriteBody').innerHTML='';for(const r of engine.PLAYER_BODY_CATALOG)if((r.name+' '+r.id).toLowerCase().includes(q)){const o=document.createElement('option');o.value=r.id;o.textContent=r.name+' · '+r.id+(r.mounted?' · montado':'');by('spriteBody').append(o);}if([...by('spriteBody').options].some(o=>o.value===previous))by('spriteBody').value=previous;}
 filter();by('spriteSearch').oninput=()=>{stash();filter();if(by('spriteBody').value)load();};for(const id of ['spriteKind','spriteStyle','spriteFrame','spriteBody'])by(id).onchange=load;
 by('spritePlay').onclick=()=>{if(playerSpriteAnimation!==null){stopPlayerSpriteAnimation();by('spritePlay').textContent='Animar movimento';drawReference();return;}if(session.sequence.length<2)return;by('spritePlay').textContent='Parar animação';playerSpriteAnimation=setInterval(()=>{if(!by('appearanceDialog').open||by('spriteWorkspace').hidden){stopPlayerSpriteAnimation();by('spritePlay').textContent='Animar movimento';return;}session.tick=(session.tick+1)%session.sequence.length;drawReference(session.sequence[session.tick]);},140);};
 by('spriteOpen').onclick=()=>{by('spriteWorkspace').hidden=!by('spriteWorkspace').hidden;if(!by('spriteWorkspace').hidden)load();else stopPlayerSpriteAnimation();};
 const remember=()=>{session.undo.push(session.frame.pixels.slice());if(session.undo.length>100)session.undo.shift();session.redo=[];};
 function paint(e){if(!session.frame)return;const c=by('spriteCanvas'),r=c.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/r.width*c.width),y=Math.floor((e.clientY-r.top)/r.height*c.height);if(x<0||x>=c.width||y<0||y>=c.height)return;const at=y*c.width+x,a=session.frame.pixels,tool=by('spriteTool').value;
 if(session.frame.record&&!session.frame.record.mounted&&Math.floor(y/8)*8+Math.floor(x/8)>=session.frame.tiles)return;
 if(tool==='pick'){session.color=a[at];draw();return;}const v=tool==='erase'?0:session.color;
 if(tool==='fill'){const old=a[at];if(old===v)return;const todo=[at],seen=new Set();while(todo.length){const i=todo.pop();if(seen.has(i)||a[i]!==old)continue;seen.add(i);const tx=i%c.width,ty=Math.floor(i/c.width);if(session.frame.record&&!session.frame.record.mounted&&Math.floor(ty/8)*8+Math.floor(tx/8)>=session.frame.tiles)continue;a[i]=v;if(tx)todo.push(i-1);if(tx<c.width-1)todo.push(i+1);if(ty)todo.push(i-c.width);if(ty<c.height-1)todo.push(i+c.width);}}
 else a[at]=v;stash();draw();status('Desenho alterado. Use Aplicar desenhos ao projeto.');}
 by('spriteCanvas').onpointerdown=e=>{if(!session.frame)return;remember();session.drag=true;by('spriteCanvas').setPointerCapture(e.pointerId);paint(e);};by('spriteCanvas').onpointermove=e=>{if(session.drag&&['pencil','erase'].includes(by('spriteTool').value))paint(e);};by('spriteCanvas').onpointerup=by('spriteCanvas').onpointercancel=()=>session.drag=false;
 by('spriteUndo').onclick=()=>{if(session.undo.length){session.redo.push(session.frame.pixels.slice());session.frame.pixels=session.undo.pop();stash();draw();}};by('spriteRedo').onclick=()=>{if(session.redo.length){session.undo.push(session.frame.pixels.slice());session.frame.pixels=session.redo.pop();stash();draw();}};
 by('spriteFlip').onclick=()=>{if(!session.frame)return;const f=session.frame,a=f.pixels.slice();for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++)a[y*f.width+x]=f.pixels[y*f.width+f.width-1-x];try{engine.validateSpritePixels(session.ref,a);remember();f.pixels=a;stash();draw();}catch(e){status(e.message);}};
 by('spriteCopy').onclick=()=>{playerSpriteClipboard={width:session.frame.width,height:session.frame.height,pixels:session.frame.pixels.slice()};status('Quadro copiado.');};by('spritePaste').onclick=()=>{try{if(!playerSpriteClipboard||playerSpriteClipboard.width!==session.frame.width||playerSpriteClipboard.height!==session.frame.height)throw Error('Copie um quadro com as mesmas dimensões.');engine.validateSpritePixels(session.ref,playerSpriteClipboard.pixels);remember();session.frame.pixels=playerSpriteClipboard.pixels.slice();stash();draw();}catch(e){status(e.message);}};
 by('spriteApply').onclick=()=>{try{stash();const state=JSON.parse(JSON.stringify(window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__||studioTeamsV3Snapshot()));for(const entry of session.drafts.values())engine.validateSpritePixels(entry.ref,entry.pixels);state.spriteEdits=JSON.parse(JSON.stringify(previewEdits()));if(!window.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__(state))throw Error('Projeto não aceitou os desenhos.');if(typeof studioUpdateBadge==='function')studioUpdateBadge();status('Desenhos aplicados. Salve o projeto para guardar no arquivo; Salvar ROM grava na fase Jogadores.');renderHairGallery();}catch(e){status(e.message);}};
 by('spriteRestoreCustom').onclick=()=>{try{
  const state=JSON.parse(JSON.stringify(window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__||studioTeamsV3Snapshot()));
  for(const style of [14,15])for(let frame=0;frame<24;frame++){
   const r={kind:'hair',style,frame};state.spriteEdits=engine.restorePlayerSprite(state.spriteEdits,r);session.drafts.delete(key(r));
  }
  if(!window.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__(state))throw Error('Não foi possível restaurar.');
  session.frame=null;load();if(typeof studioUpdateBadge==='function')studioUpdateBadge();renderHairGallery();
  status('Os 24 quadros de Original e Cascão foram restaurados para os PNGs atuais. Salve o projeto e gere novamente a ROM.');
 }catch(e){status(e.message);}};
 by('spriteRestore').onclick=()=>{try{const state=JSON.parse(JSON.stringify(window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__||studioTeamsV3Snapshot()));state.spriteEdits=engine.restorePlayerSprite(state.spriteEdits,session.ref);if(!window.__ISSSD_TEAMS_SEMANTIC_HYDRATE_V1__(state))throw Error('Não foi possível restaurar.');session.drafts.delete(key(session.ref));session.frame=null;load();if(typeof studioUpdateBadge==='function')studioUpdateBadge();status('Quadro restaurado no projeto. Salve para guardar.');renderHairGallery();}catch(e){status(e.message);}};
}
