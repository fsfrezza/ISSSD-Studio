// Native BRR replacements are semantic and travel inside the .issdproj.
(()=>{
 const clone=v=>JSON.parse(JSON.stringify(v)),schema='isssd-sounds-v1',rate=10300;
 let saved={schema,values:{}},context=null,playing=null,installed=false;
 const node=id=>document.getElementById(id),engine=()=>window.ISSSDSounds,host=()=>window.__ISSSD_PREKICK_HOST__;
 const selected=()=>SOUND_SLOTS[Number(node('sndSelect')?.value)||0];
 const labels={galvao:'Galvão',fb96:'FB96',original:'Original',custom:'Arquivo importado'};
 const ready=()=>window.activeRomProfile?.id==='iss-deluxe-plus'&&!!host()?.rom?.();
 function status(text,error=false){const n=node('sndStatus');if(n){n.className='note '+(error?'error':'ok');n.textContent=text;}}
 function unpack(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
 function pack(bytes){let s='';for(let p=0;p<bytes.length;p+=8192)s+=String.fromCharCode(...bytes.subarray(p,p+8192));return btoa(s);}
 function terminated(bytes,slot){
  if(!bytes?.length||bytes.length>slot.capacity)throw Error('Amostra não cabe no slot '+slot.id);
  for(let i=0;i+9<=bytes.length;i+=9){if(bytes[i]>>4>12)throw Error('Cabeçalho BRR inválido: '+slot.id);if(bytes[i]&1)return bytes.slice(0,i+9);}
  throw Error('Bloco final BRR ausente: '+slot.id);
 }
 function reference(source,slot){
  if(source==='fb96'){const data=FB96_SOUND_REFERENCES.samples[slot.id];if(!data)throw Error('FB96 sem referência para '+slot.id);return terminated(unpack(data),slot);}
  const bank=engine()?.references?.()[source==='galvao'?'galvao':'english'];if(!bank)throw Error('Referências de áudio indisponíveis.');const offset=slot.pc-0x180000;return terminated(bank.slice(offset,offset+slot.capacity),slot);
 }
 function current(slot){const entry=saved.values[slot.id];if(entry)return terminated(unpack(entry.brrBase64),slot);const rom=host()?.rom?.();if(!rom)throw Error('Abra um projeto Plus.');const p=(host()?.header?.()||0)+slot.pc;return terminated(rom.slice(p,p+slot.capacity),slot);}
 function apply(source,all=false){
  if(!ready())throw Error('Abra um projeto Deluxe Plus antes de substituir os sons.');if(!['galvao','fb96','original'].includes(source))throw Error('Referência sonora desconhecida.');
  const slots=all?SOUND_SLOTS:[selected()],next={...saved.values};
  for(const slot of slots)next[slot.id]={source,brrBase64:pack(reference(source,slot))};
  saved={schema,values:next};render();status(`${all?slots.length+' sons catalogados':'Som selecionado'} substituído${all?'s':''} por ${labels[source]}. Salve o projeto ou salve a ROM com a fase Sons marcada.`);
 }
 function stop(){try{playing?.stop();}catch{}playing=null;}
 async function play(source){
  stop();const slot=selected(),bytes=source==='current'?current(slot):reference(source,slot),AC=window.AudioContext||window.webkitAudioContext;
  if(!AC)throw Error('Web Audio indisponível neste navegador.');context||=new AC();if(context.state==='suspended')await context.resume();
  const pcm=engine().decodeBRR(bytes),buffer=context.createBuffer(1,pcm.length,rate);buffer.copyToChannel(pcm,0);const voice=context.createBufferSource(),gain=context.createGain();gain.gain.value=0.9;voice.buffer=buffer;voice.connect(gain);gain.connect(context.destination);playing=voice;voice.start();status(`Reproduzindo ${source==='current'?'som atual do projeto':labels[source]} · ${(pcm.length/rate).toFixed(2)} s.`);
  voice.onended=()=>{if(playing===voice){playing=null;status('Reprodução concluída.');}};
 }
 async function importAudio(file){
  if(!ready())throw Error('Abra um projeto Deluxe Plus.');const slot=selected(),AC=window.AudioContext||window.webkitAudioContext;context||=new AC();const audio=await context.decodeAudioData(await file.arrayBuffer()),mono=new Float32Array(audio.length);
  for(let c=0;c<audio.numberOfChannels;c++){const channel=audio.getChannelData(c);for(let i=0;i<mono.length;i++)mono[i]+=channel[i]/audio.numberOfChannels;}
  const samples=engine().normalizePcm(engine().trimSilence(mono)),count=Math.max(16,Math.floor(samples.length*rate/audio.sampleRate)),resampled=new Float32Array(count);
  for(let i=0;i<count;i++){const t=i*audio.sampleRate/rate,a=Math.floor(t),f=t-a;resampled[i]=(samples[a]||0)*(1-f)+(samples[Math.min(a+1,samples.length-1)]||0)*f;}
  const encoded=engine().encodeBRR(resampled,slot.capacity),bytes=terminated(encoded.bytes,slot);saved.values[slot.id]={source:'custom',brrBase64:pack(bytes)};render();status('Áudio importado no projeto. Use Salvar Projeto ou Salvar ROM.');const info=node('sndConvertInfo');if(info)info.textContent=`${file.name} · ${audio.duration.toFixed(2)} s → BRR ${bytes.length}/${slot.capacity} bytes · sem acelerar a fala.`;
 }
 function render(){
  const slot=selected(),state=node('sndProjectSource'),entry=saved.values[slot.id],n=Object.keys(saved.values).length;
  if(state){const text=`Este som: ${entry?labels[entry.source]:'ROM atual'} · ${n}/${SOUND_SLOTS.length} substituições no projeto.`;if(state.textContent!==text)state.textContent=text;}
  for(const id of ['sndUseGalvao','sndUseFb96','sndAllGalvao','sndAllFb96','sndAllOriginal','sndRestore'])if(node(id))node(id).disabled=!ready();
 }
 function finalize(project){if(!project?.state)return project;project.state.semantic||={};if(Object.keys(saved.values).length)project.state.semantic.soundsV1=clone(saved);else delete project.state.semantic.soundsV1;return project;}
 function hydrate(project){stop();const next=project?.state?.semantic?.soundsV1;if(next&&next.schema!==schema)throw Error('Formato de sons do projeto desconhecido.');if(next&&(!next.values||typeof next.values!=='object'||Array.isArray(next.values)))throw Error('Seção de sons inválida.');const values=next?.values||{};for(const [id,entry]of Object.entries(values)){const slot=SOUND_SLOTS.find(s=>s.id===id);if(!slot||!labels[entry?.source])throw Error('Registro de som inválido: '+id);terminated(unpack(entry.brrBase64),slot);}saved=next?clone(next):{schema,values:{}};render();}
 const guarded=fn=>(...args)=>Promise.resolve().then(()=>fn(...args)).catch(e=>status(e.message||String(e),true));
 function replaceHandler(id,fn){const old=node(id);if(!old)return;const button=old.cloneNode(true);old.replaceWith(button);button.addEventListener('click',guarded(fn));}
 function install(){
  const page=node('page-sounds'),select=node('sndSelect');if(installed||!page||!select||!engine())return;installed=true;
  const intro=page.querySelector('.pagehead p');if(intro)intro.textContent='Compare os sons originais, Galvão e FB96. Substitua um som ou aplique um conjunto completo ao projeto.';const card=page.querySelector('.card'),panel=document.createElement('div');panel.id='sndPresets';panel.style.cssText='margin-top:16px;display:grid;gap:10px';
  const note=document.createElement('p');note.textContent=`Substitua individualmente ou aplique os ${SOUND_SLOTS.length} sons catalogados. Galvão e FB96 são referências diferentes. Música e dados fora destas amostras são preservados.`;panel.append(note);
  const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap';panel.append(actions);
  for(const [id,label,action]of [['sndPlayFb96','▶ FB96',()=>play('fb96')],['sndStop','■ Parar',stop],['sndUseGalvao','Usar Galvão neste som',()=>apply('galvao')],['sndUseFb96','Usar FB96 neste som',()=>apply('fb96')],['sndAllGalvao','Substituir todos por Galvão',()=>apply('galvao',true)],['sndAllFb96','Substituir todos por FB96',()=>apply('fb96',true)],['sndAllOriginal','Restaurar todos os originais',()=>apply('original',true)]]){const b=document.createElement('button');b.type='button';b.id=id;b.className='btn';b.textContent=label;b.addEventListener('click',guarded(action));actions.append(b);}
  const state=document.createElement('div');state.id='sndProjectSource';state.className='note info';panel.append(state);card.append(panel);
  replaceHandler('sndPlayEnglish',()=>play('original'));replaceHandler('sndPlayGalvao',()=>play('galvao'));replaceHandler('sndPlayCurrent',()=>play('current'));replaceHandler('sndRestore',()=>apply('original'));
  const input=node('sndFile');if(input){const replacement=input.cloneNode(true);input.replaceWith(replacement);replacement.addEventListener('change',guarded(async e=>{try{if(e.target.files?.[0])await importAudio(e.target.files[0]);}finally{e.target.value='';}}));}
  select.addEventListener('change',render);render();
 }
 const priorFinalize=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(project){priorFinalize?.(project);return finalize(project);};
 const priorApply=window.studioApplyProjectWithBase;if(typeof priorApply==='function')window.studioApplyProjectWithBase=async function(project,...args){const previous=clone(saved);hydrate(project);try{const result=await priorApply.call(this,project,...args);render();return result;}catch(error){saved=previous;render();throw error;}};
 window.__ISSSD_SOUNDS_EDITOR__={apply,play,stop,hydrate,finalize,install,snapshot:()=>clone(saved)};
 function boot(){install();let timer;if(document.body)new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{install();render();},100);}).observe(document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
