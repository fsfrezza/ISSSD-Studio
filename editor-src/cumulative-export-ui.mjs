(()=>{
 const PHASES=__CUMULATIVE_PHASES__;
 window.__ISSSD_PICK_CUMULATIVE_AREAS__=()=>new Promise(resolve=>{
  const dialog=document.createElement('dialog'),form=document.createElement('form');
  form.method='dialog';dialog.style.cssText='max-width:520px;width:90%;background:#152131;color:#eef4ff;border:1px solid #5a7999;border-radius:12px;padding:20px';
  const heading=document.createElement('h3');heading.textContent='Salvar ROMs cumulativas';form.append(heading);
  const text=document.createElement('p');text.textContent='Marque as áreas que deseja incluir. Cada ROM acumula somente as fases marcadas anteriores.';form.append(text);
  const inputs=[];
  for(const phase of PHASES.filter(p=>p.id!=='infraestrutura')){const row=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=true;input.value=phase.id;row.style.cssText='display:flex;gap:10px;margin:10px 0';row.append(input,document.createTextNode(String(phase.number).padStart(2,'0')+' — '+phase.label));form.append(row);inputs.push(input);}
  const note=document.createElement('p');note.style.fontSize='12px';note.textContent='01 — Infraestrutura automática: expansão para 4 MB e individualização das táticas aplicadas antes das demais fases.';form.append(note);
  const cancel=document.createElement('button'),save=document.createElement('button');cancel.type='button';cancel.textContent='Cancelar';save.type='submit';save.textContent='Gerar ZIP';cancel.style.marginRight='12px';
  let done=false;const finish=value=>{if(done)return;done=true;dialog.close();dialog.remove();resolve(value)};
  cancel.onclick=()=>finish(null);dialog.addEventListener('cancel',e=>{e.preventDefault();finish(null)});
  form.onsubmit=e=>{e.preventDefault();const ids=['infraestrutura',...inputs.filter(i=>i.checked).map(i=>i.value)];finish(ids)};
  form.append(cancel,save);dialog.append(form);document.body.append(dialog);dialog.showModal();
 });
 window.__ISSSD_PREPARE_TITLE_GRAPHICS__=async project=>{
  const composer=project?.state?.titleComposerV2;
  const custom=(composer?.state?.elements||[]).filter(e=>e.visible!==false&&['ball','title','photo1','photo2','photo3','photo4','photo5'].includes(e.role||e.id)&&(e.assetDefinition==='customizada'||e.titleTextEnabled));
  if(!custom.length)return null;
  if(typeof studioEnsureTitleGraphicsPreviewForSave!=='function'||typeof studioFinalizeExperimentalGraphics!=='function')throw new Error('Conversor nativo da Tela Inicial indisponível.');
  // Preparation operates on transient native group copies; materialization receives
  // a clean base COPY. Neither project opening nor this conversion writes to ROM.
  await studioEnsureTitleGraphicsPreviewForSave();
  const preview=studioExplicitTitleGraphicsPreview(),snap=studioCore().snapshot(),before=snap.base.slice();
  const output=studioFinalizeExperimentalGraphics(new Uint8Array(snap.base),snap,preview);
  if(!before.every((b,i)=>b===snap.base[i]))throw new Error('Conversão gráfica alterou a ROM-base');
  for(const layer of custom){const role=layer.role||layer.id,id=role.startsWith('photo')?'fotos':role==='title'?'letreiro':'fundo';if(!preview.changed.includes(id))throw new Error('A camada '+role+' não foi convertida para a ROM.');}
  const groups=preview.changed.map(id=>{const info=window.titleReadGroupInfo(output,id),h=Number(snap.headerSize)||0;return {id,pc:info.pc,bytes:Array.from(output.slice(h+info.pc,h+info.pc+info.compressedSize)),expectedRaw:Array.from(preview.groups[id])}});
  return {groups};
 };
})();
