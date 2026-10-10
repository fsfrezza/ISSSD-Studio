const V11='git-project-import-v14-title-menu-controls';
let currentProject=null;
let anyUserEdit=false;
let screenTextsBaseline={schema:'isssd-screen-texts-v1',values:{}};
const touched={direct:new Set(),pre:new Set(),menu:new Set(),gfx:new Set(),screen:new Set(),internalTitle:false,titleScreen:false};
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const sem=p=>p?.state?.semantic||{};
const sections=p=>sem(p).textWorkspaceV2?.sections||{};
const esc=v=>window.CSS?.escape?CSS.escape(String(v)):String(v).replace(/[^A-Za-z0-9_-]/g,'\\$&');
const setValue=(selector,value)=>{const next=String(value??'');for(const n of document.querySelectorAll(selector)){if('value'in n&&n.value!==next)n.value=next}};
const setId=(id,value)=>{const n=document.getElementById(id),next=String(value??'');if(n&&'value'in n&&n.value!==next)n.value=next;return n};
const setText=(n,value)=>{if(!n)return;const next=String(value??'');if(n.textContent!==next)n.textContent=next};
function directProfile(p){const by=sections(p).direct?.byProfile||{};return by['iss-deluxe-plus']||Object.values(by)[0]||{}}
function normalizeMainMenuColorUi(){
 const grid=document.getElementById('mmColorGrid');if(!grid)return;
 const card=grid.closest('.card');if(!card)return;
 setText(card.querySelector('.sectionbar h3'),'Cores do Menu Principal');
 setText(card.querySelector('.sectionbar .subtle'),'Edite as paletas 1P e 2P, visualize o resultado e aplique as cores à ROM Plus. Estes valores também são preservados no projeto.');
 const old=document.querySelector('#page-main-menu .mainmenu-appearance, #page-texts .mainmenu-appearance');if(old&&old.style.display!=='none')old.style.display='none';
}

function blankScreenTexts(){return {schema:'isssd-screen-texts-v1',values:{}}}
function screenKey(owner,field){return `${owner}.${field}`}
function putScreen(state,owner,field,value){if(!owner||!field)return;state.values[owner]||(state.values[owner]={});state.values[owner][field]=String(value??'')}
function getScreen(state,owner,field){return state?.values?.[owner]?.[field]}
function readScreenNode(node){
 if(!node||!('value'in node))return null;
 if(node.matches?.('[data-screen-text-owner][data-screen-text-field]'))return {owner:node.dataset.screenTextOwner,field:node.dataset.screenTextField,value:node.value};
 if(node.id?.startsWith('gm610_')&&!node.id.startsWith('gm610c_'))return {owner:'game-modes',field:node.id.slice(6),value:node.value};
 if(node.matches?.('[data-pk-id]'))return {owner:'match-options',field:node.dataset.pkId,value:node.value};
 if(node.matches?.('[data-mm-real]'))return {owner:'main-menu',field:node.dataset.mmReal,value:node.value};
 if(node.id?.startsWith('st612_'))return {owner:'strategies',field:node.id.slice(6),value:node.value};
 if(node.id?.startsWith('tx621_'))return {owner:'controls',field:node.id.slice(6),value:node.value};
 if(node.id==='romMetaTitle'||node.id==='romMetaTitleDesired')return {owner:'title-screen',field:'rom-internal-title',value:node.value};
 return null;
}
function captureScreenTexts(base=screenTextsBaseline){
 const out=clone(base)||blankScreenTexts();out.schema='isssd-screen-texts-v1';out.values=out.values||{};
 document.querySelectorAll('[data-screen-text-owner][data-screen-text-field],[id^="gm610_"],[data-pk-id],[data-mm-real],[id^="st612_"],[id^="tx621_"],#romMetaTitle,#romMetaTitleDesired').forEach(node=>{
  if(node.id?.startsWith('gm610c_'))return;const x=readScreenNode(node);if(x)putScreen(out,x.owner,x.field,x.value);
 });
 return out;
}
function legacyScreenTexts(p){
 const out=blankScreenTexts(),sec=sections(p),direct=directProfile(p),pre=sec.preKickoff?.values||{},menu=sec.mainMenu?.values||{},gfx=sec.graphicIntents?.values||{};
 for(const [k,v] of Object.entries(direct))putScreen(out,'game-modes',k,v);
 for(const [k,v] of Object.entries(pre))putScreen(out,'match-options',k,v);
 for(const [k,v] of Object.entries(menu))putScreen(out,'main-menu',k,v);
 for(const [k,v] of Object.entries(gfx)){
  if(k.startsWith('strategy.screen.v614.'))putScreen(out,'strategies',k.slice('strategy.screen.v614.'.length),v);
  if(k.startsWith('controller.'))putScreen(out,'controls',k.slice('controller.'.length),v);
 }
 const title=String(sem(p).romInternalTitle||sem(p).romInternalTitleDesired||'');if(title)putScreen(out,'title-screen','rom-internal-title',title);
 return out;
}
function projectScreenTexts(p){const x=sem(p).screenTextsV1;return x?.schema==='isssd-screen-texts-v1'?clone(x):legacyScreenTexts(p)}
function hydrateScreenTexts(p){
 const state=projectScreenTexts(p);
 for(const [owner,fields] of Object.entries(state.values||{}))for(const [field,value] of Object.entries(fields||{})){
  if(touched.screen.has(screenKey(owner,field)))continue;
  setValue(`[data-screen-text-owner="${esc(owner)}"][data-screen-text-field="${esc(field)}"]`,value);
  if(owner==='game-modes')setId('gm610_'+field,value);
  else if(owner==='match-options')setValue(`[data-pk-id="${esc(field)}"]`,value);
  else if(owner==='main-menu')setValue(`[data-mm-real="${esc(field)}"]`,value);
  else if(owner==='strategies')setId('st612_'+field,value);
  else if(owner==='controls')setId('tx621_'+field,value);
  else if(owner==='title-screen'&&field==='rom-internal-title'){setId('romMetaTitle',value);setId('romMetaTitleDesired',value)}
 }
}

function activatePage(pageId,button){document.querySelectorAll('section.page').forEach(p=>p.classList.toggle('active',p.id===pageId));document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active',b===button))}
function makeNavButton(id,page,label,icon){let b=document.getElementById(id);if(b)return b;b=document.createElement('button');b.className='navbtn';b.type='button';b.id=id;b.dataset.page=page;b.innerHTML=`<span class="navico">${icon}</span><span>${label}</span><i class="navdot"></i>`;b.addEventListener('click',()=>activatePage('page-'+page,b));return b}
function ensureScreenPage(id,title,description){
 let page=document.getElementById('page-'+id);if(page)return page;
 const content=document.querySelector('.content');if(!content)return null;
 page=document.createElement('section');page.className='page';page.id='page-'+id;
 page.innerHTML=`<div class="pagehead"><div><h2>${title}</h2><p>${description}</p></div></div><div class="rom-content"><div id="${id}ScreenHost"></div></div>`;
 const before=document.getElementById('page-texts')||document.getElementById('page-main-menu');content.insertBefore(page,before||null);return page;
}

const CONTROL_TERM_GROUPS=[
 {id:'highball',label:'Bola alta',parts:['high','ball'],original:'HIGH BALL'},
 {id:'pass',label:'Passe',parts:['pass'],original:'PASS'},
 {id:'shoot',label:'Chute',parts:['shoot'],original:'SHOOT'},
 {id:'dash',label:'Corrida',parts:['dash'],original:'DASH'},
 {id:'keeper',label:'Goleiro',parts:['keeper'],original:'KEEPER'},
 {id:'semiauto',label:'Semi automático',parts:['semiauto'],original:'SEMI AUTO'},
 {id:'auto',label:'Automático',parts:['auto'],original:'AUTO'},
 {id:'manual',label:'Manual',parts:['manual'],original:'MANUAL'}
];
function normalizeControlTerm(v){return String(v??'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9 -]/g,'').replace(/\s+/g,' ').trim()}
function hiddenControlValue(id){return String(document.getElementById('tx621_'+id)?.value||'')}
function wholeControlValue(g){
 const saved=getScreen(screenTextsBaseline,'controls',g.id);if(saved!=null&&String(saved).trim())return String(saved);
 return g.parts.map(hiddenControlValue).filter(Boolean).join(' ')||g.original;
}
function splitControlTerm(g,value){
 const q=normalizeControlTerm(value);
 if(g.parts.length===1)return [q];
 const words=q?q.split(' '):[];
 if(words.length<2)throw new Error(`${g.label}: use pelo menos duas palavras; a divisão interna só ocorre nos espaços.`);
 let best=null;
 for(let i=1;i<words.length;i++){
  const left=words.slice(0,i).join(' '),right=words.slice(i).join(' '),score=Math.abs(left.length-right.length);
  if(left&&right&&(!best||score<best.score))best={left,right,score};
 }
 if(!best)throw new Error(`${g.label}: não foi possível dividir o termo.`);
 return [best.left,best.right];
}
function syncWholeControl(g,input,{dispatch=true}={}){
 const parts=splitControlTerm(g,input.value);input.value=normalizeControlTerm(input.value);
 g.parts.forEach((id,i)=>{const node=document.getElementById('tx621_'+id);if(node&&node.value!==parts[i]){node.value=parts[i];if(dispatch)node.dispatchEvent(new Event('input',{bubbles:true}))}});
 const k=screenKey('controls',g.id);touched.screen.add(k);screenTextsBaseline.values.controls||(screenTextsBaseline.values.controls={});screenTextsBaseline.values.controls[g.id]=input.value;
 return parts;
}
function installGroupedControlsUi(){
 const host=document.getElementById('controlsScreenHost');if(!host)return;
 const pane=document.querySelector('[data-pane="controller"]');
 if(pane&&pane.parentElement!==host){pane.classList.add('active');pane.style.display='block';host.appendChild(pane)}
 const realGrid=pane?.querySelector('.tx621-grid');if(!realGrid)return;
 realGrid.style.display='none';const oldActions=pane.querySelector('.tx621-actions');if(oldActions)oldActions.style.display='none';
 let card=document.getElementById('gitControlsWholeTerms');
 if(!card){
  card=document.createElement('div');card.id='gitControlsWholeTerms';card.className='card operational-first';
  card.innerHTML=`<div class="sectionbar"><div><h3>Termos completos dos Controles</h3><div class="subtle">Como em Estratégias, cada inscrição é editada como um termo completo. Quando a ROM usa mais de uma faixa física, o Studio divide internamente somente nos espaços.</div></div><span class="badge ok">writer real</span></div><div id="gitControlsTermGrid"></div><div class="st612-actions" style="margin-top:12px"><button class="btn" id="gitControlsRestore" type="button">Restaurar originais</button><button class="btn primary" id="gitControlsCommit" type="button">Implementar no projeto</button><button class="btn success" id="gitControlsApply" type="button">Aplicar à ROM</button></div><div class="note info" id="gitControlsStatus" style="margin-top:10px">Projeto e ROM continuam independentes.</div>`;
  host.insertBefore(card,pane||host.firstChild);
  const grid=card.querySelector('#gitControlsTermGrid');
  grid.style.cssText='display:grid;grid-template-columns:repeat(4,minmax(180px,1fr));gap:12px;align-items:start';
  for(const g of CONTROL_TERM_GROUPS){
   const box=document.createElement('div');box.className='st612-item';box.style.cssText='min-width:0;padding:10px;border:1px solid #36516b;border-radius:8px;background:#0a1420';
   box.innerHTML=`<label style="display:grid;gap:6px"><strong>${g.label}</strong><input style="width:100%;box-sizing:border-box" id="ctrlterm_${g.id}" data-screen-text-owner="controls" data-screen-text-field="${g.id}" autocomplete="off"></label>`;
   grid.appendChild(box);
   const inp=box.querySelector('input');inp.value=wholeControlValue(g);inp.addEventListener('input',()=>{try{syncWholeControl(g,inp);setText(card.querySelector('#gitControlsStatus'),'rascunho alterado · implemente no projeto e/ou aplique à ROM');inp.style.borderColor='#6c92ab'}catch(e){setText(card.querySelector('#gitControlsStatus'),e.message);inp.style.borderColor='#e17272'}});
  }
  const mq=window.matchMedia?.('(max-width:1100px)');const adapt=()=>{grid.style.gridTemplateColumns=mq?.matches?'repeat(2,minmax(180px,1fr))':'repeat(4,minmax(180px,1fr))'};adapt();mq?.addEventListener?.('change',adapt);
  card.querySelector('#gitControlsRestore').onclick=()=>{for(const g of CONTROL_TERM_GROUPS){const inp=document.getElementById('ctrlterm_'+g.id);inp.value=g.original;syncWholeControl(g,inp)}setText(card.querySelector('#gitControlsStatus'),'Originais restaurados no rascunho.')};
  card.querySelector('#gitControlsCommit').onclick=()=>{try{for(const g of CONTROL_TERM_GROUPS)syncWholeControl(g,document.getElementById('ctrlterm_'+g.id));document.getElementById('tx621Commit')?.click();setText(card.querySelector('#gitControlsStatus'),'Termos completos implementados no projeto. Use Salvar Projeto para gerar o .issdproj.')}catch(e){alert('Revise os Controles: '+e.message)}};
  card.querySelector('#gitControlsApply').onclick=()=>{try{for(const g of CONTROL_TERM_GROUPS)syncWholeControl(g,document.getElementById('ctrlterm_'+g.id));document.getElementById('tx621Apply')?.click();setText(card.querySelector('#gitControlsStatus'),'Writer dos Controles acionado. Use Salvar ROM para exportar.')}catch(e){alert('Não foi possível aplicar os Controles: '+e.message)}};
 }
 for(const g of CONTROL_TERM_GROUPS){const inp=document.getElementById('ctrlterm_'+g.id);if(inp&&document.activeElement!==inp){const saved=getScreen(screenTextsBaseline,'controls',g.id);inp.value=saved!=null?String(saved):wholeControlValue(g);try{syncWholeControl(g,inp,{dispatch:false})}catch(_){}}}
}

function ensureMatchOptionsContent(){
 const host=document.getElementById('match-optionsScreenHost');if(!host)return;
 let pk=document.getElementById('preKickoffTextPanel');
 if(!pk&&typeof window.renderPreKickoffTextEditor==='function'){try{window.renderPreKickoffTextEditor()}catch(e){console.warn('V14 pré-kickoff render',e)}pk=document.getElementById('preKickoffTextPanel')}
 if(pk&&pk.parentElement!==host)host.appendChild(pk);
 if(!pk&&!host.querySelector('.screen-owned-loading')){const n=document.createElement('div');n.className='note info screen-owned-loading';n.textContent='Inicializando os campos de Opções da partida…';host.appendChild(n)}
 if(pk)host.querySelector('.screen-owned-loading')?.remove();
}
function installScreenOwnedUi(){
 const navTexts=document.getElementById('nav-texts');
 if(navTexts){
  const group=navTexts.parentElement,match=makeNavButton('nav-match-options','match-options','Opções da partida','▦'),controls=makeNavButton('nav-controls','controls','Controles','⌨');
  if(group){if(!match.parentElement)group.insertBefore(match,navTexts);if(!controls.parentElement)group.insertBefore(controls,navTexts)}
  if(navTexts.style.display!=='none')navTexts.style.display='none';
 }
 ensureScreenPage('match-options','Opções da partida','Formação, substituições, estratégia, marcação, dados e início da partida. Textos e gráficos desta tela ficam somente aqui.');
 ensureScreenPage('controls','Controles','Configuração dos botões e inscrições gráficas da tela de controles.');
 ensureMatchOptionsContent();
 const ctrl=document.querySelector('[data-pane="controller"]'),ctrlHost=document.getElementById('controlsScreenHost');if(ctrl&&ctrlHost&&ctrl.parentElement!==ctrlHost){ctrl.classList.add('active');ctrl.style.display='block';ctrlHost.appendChild(ctrl)}
 installGroupedControlsUi();
}

const MAIN_MENU_VISUAL_IDS=['openGame','scenario','championship','penalty','cup','training','password','options'];
function canonicalMainMenuValues(p){
 const state=projectScreenTexts(p),fromScreen=state.values?.['main-menu']||{},fromWs=sections(p).mainMenu?.values||{},fromLegacy=sem(p).mainMenuDraft||{};
 return Object.fromEntries(MAIN_MENU_VISUAL_IDS.map(id=>[id,String(fromScreen[id]??fromWs[id]??fromLegacy[id]??'')]));
}
function syncMainMenuVisualEditor(p){
 const vals=canonicalMainMenuValues(p);if(!Object.values(vals).some(v=>v.trim()))return;
 for(const id of MAIN_MENU_VISUAL_IDS){const node=document.getElementById('mm601_'+id),value=vals[id];if(node&&value&&document.activeElement!==node&&node.value!==value)node.value=value}
 try{window.ISSSDMainMenuText602?.renderPreview?.()}catch(_){}
 try{
  const key='mainMenuGraphicTextsV600',raw=window.ISSSDTextIntentions?.getDraft?.(key);let payload={schema:'isssd-main-menu-text-v5',version:5,texts:MAIN_MENU_VISUAL_IDS.map(id=>vals[id])};
  if(typeof raw==='string'&&raw){try{const old=JSON.parse(raw);if(old&&typeof old==='object'&&!Array.isArray(old)){payload={...old,...payload,texts:payload.texts};if(old.style)payload.style=old.style}}catch(_){}}
  window.ISSSDTextIntentions?.setDraft?.(key,JSON.stringify(payload));
  window.ISSSDTextIntentions?.commitAll?.();
 }catch(e){console.warn('V14 sincronização do Menu Principal visual',e)}
}

let titleAnyCharInstalled=false;
function installTitleAnyCharacterSupport(){
 if(titleAnyCharInstalled)return;
 try{
  if(typeof TITLE_INV==='undefined'||typeof TITLE_GLYPHS==='undefined'||typeof titleValidateText!=='function'||typeof titleEnsureExtendedGlyphsForTexts!=='function'||typeof titleEncode4!=='function')return;
  titleAnyCharInstalled=true;
  const stockInv={...TITLE_INV},stockKeys=new Set(Object.keys(stockInv)),dynamicChars=new Set(),allIds=Array.from({length:31},(_,i)=>0xE0+i);
  function rasterGlyph(ch){
   const c=document.createElement('canvas');c.width=32;c.height=32;const g=c.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,32,32);g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';g.font='bold 24px sans-serif';g.fillText(ch,16,16);
   const src=g.getImageData(0,0,32,32).data,px=new Uint8Array(64);
   for(let y=0;y<8;y++)for(let x=0;x<8;x++){let sum=0,n=0;for(let yy=y*4;yy<y*4+4;yy++)for(let xx=x*4;xx<x*4+4;xx++){sum+=src[(yy*32+xx)*4+3];n++}if(sum/n>48)px[y*8+x]=15}
   return titleEncode4(px);
  }
  function prepareMap(){
   for(const ch of dynamicChars)if(!stockKeys.has(ch))delete TITLE_INV[ch];dynamicChars.clear();
   for(const [ch,id] of Object.entries(stockInv))TITLE_INV[ch]=id;
   const texts=[String(titleScreenState?.texts?.copyright||''),String(titleScreenState?.texts?.license||'')].map(x=>x.normalize('NFC').toUpperCase());
   const needed=[...new Set(texts.flatMap(x=>[...x]).filter(ch=>ch!==' '))];
   const used=new Set(needed.map(ch=>stockInv[ch]).filter(v=>v!=null)),free=allIds.filter(id=>!used.has(id));
   const unsupported=needed.filter(ch=>stockInv[ch]==null);
   if(unsupported.length>free.length)throw new Error(`A fonte da Tela Inicial possui 31 slots físicos. Este texto precisa de ${unsupported.length} glifo(s) novo(s), mas há apenas ${free.length} slot(s) livre(s) com os demais caracteres usados.`);
   unsupported.forEach((ch,i)=>{TITLE_INV[ch]=free[i];dynamicChars.add(ch)});
   return {unsupported};
  }
  const oldEnsure=titleEnsureExtendedGlyphsForTexts;
  titleEnsureExtendedGlyphsForTexts=function(){
   const {unsupported}=prepareMap();
   oldEnsure();
   if(!titleScreenState?.groups?.fonte)return;
   const font=titleScreenState.groups.fonte;let changed=false;
   for(const ch of unsupported){const id=TITLE_INV[ch],off=(id-0xE0)*32,tile=rasterGlyph(ch);if(off<0||off+32>font.length)throw new Error('Fonte da Tela Inicial não possui slot físico para '+ch);for(let i=0;i<32;i++)if(font[off+i]!==tile[i]){changed=true;break}font.set(tile,off)}
   if(changed)titleScreenState.dirtyGroups.add('fonte');
  };
  titleValidateText=function(txt,n){
   const chars=[...String(txt??'').normalize('NFC').toUpperCase()],vis=chars.filter(c=>c!==' ');
   if(vis.length>n)throw new Error(`${vis.length} caracteres visíveis para ${n} posições.`);
   prepareMap();
   return chars;
  };
 }catch(e){console.warn('V14 fonte livre da Tela Inicial',e)}
}
function normalizeTitleTextUi(){
 installTitleAnyCharacterSupport();
 const a=document.getElementById('titleTextCopyright'),b=document.getElementById('titleTextLicense');if(!a&&!b)return;
 const card=a?.closest('.card')||b?.closest('.card')||a?.parentElement?.parentElement;
 if(card){
  const notes=[...card.querySelectorAll('.note.info')];
  const glyphNote=notes.find(n=>/Caracteres seguros|glifos originais/i.test(n.textContent||''));
  if(glyphNote)glyphNote.innerHTML='<strong>Caracteres livres:</strong> o Studio gera automaticamente os glifos necessários na fonte da Tela Inicial. Letras, números, acentos, símbolos e outros caracteres podem ser digitados diretamente. Permanecem apenas os limites físicos de 29 e 18 posições visíveis.';
 }
}

function hydrateDom(p){
 if(!p)return;
 const s=sem(p),sec=sections(p),direct=directProfile(p),pre=sec.preKickoff?.values||{},menu=sec.mainMenu?.values||{},gfx=sec.graphicIntents?.values||{};
 for(const [k,v] of Object.entries(direct))if(!touched.direct.has(k)){setValue(`[data-profile-text="${esc(k)}"]`,v);const n=setId('gm610_'+k,v),c=document.getElementById('gm610c_'+k);if(n&&c)setText(c,String(v??'').length+'/'+(n.maxLength||String(v??'').length))}
 for(const [k,v] of Object.entries(pre))if(!touched.pre.has(k)){setValue(`[data-pk-id="${esc(k)}"]`,v);const n=setId('pk_'+k,v),c=document.getElementById('pkc_'+k);if(n&&c)setText(c,String(v??'').length+'/'+(n.maxLength||String(v??'').length))}
 for(const [k,v] of Object.entries(menu))if(!touched.menu.has(k)){setValue(`[data-mm-real="${esc(k)}"]`,v);setValue(`[data-mainmenu-fb96="${esc(k)}"]`,v)}
 for(const [k,v] of Object.entries(gfx))if(!touched.gfx.has(k)){setValue(`[data-gfx-intent="${esc(k)}"]`,v);if(k.startsWith('strategy.screen.v614.'))setId('st612_'+k.slice('strategy.screen.v614.'.length),v);if(k.startsWith('__pk590.native.'))setId('pk590_'+k.slice('__pk590.native.'.length),v)}
 if(!touched.internalTitle){const title=String(s.romInternalTitle||s.romInternalTitleDesired||'').replace(/[^\x20-\x7E]/g,' ').slice(0,21);if(title){setId('romMetaTitle',title);setId('romMetaTitleDesired',String(s.romInternalTitleDesired||title));setText(document.getElementById('romMetaTitleCount'),String(title.length));const st=document.getElementById('romMetaTitleImplementStatus');if(st){setText(st,'Implementado');st.className='badge ok'}}}
 hydrateScreenTexts(p);installScreenOwnedUi();syncMainMenuVisualEditor(p);normalizeTitleTextUi();
}
function applyFull(p){if(!p)return;try{window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__?.(p)}catch(e){console.error('V14 reapply',e)}hydrateDom(p);try{window.__ISSSD_TEAM_STATE_API__?.refresh?.()}catch(_){}}
let hydrateTimer=0,uiTimer=0;
function scheduleHydration(){if(!currentProject)return;clearTimeout(hydrateTimer);hydrateTimer=setTimeout(()=>hydrateDom(currentProject),20)}
function scheduleUi(){clearTimeout(uiTimer);uiTimer=setTimeout(()=>{installScreenOwnedUi();normalizeTitleTextUi();if(currentProject)syncMainMenuVisualEditor(currentProject)},30)}
function markTouched(t){
 if(!t)return;let k;const sx=readScreenNode(t);if(sx)touched.screen.add(screenKey(sx.owner,sx.field));
 if(t.matches?.('[data-profile-text]')){k=t.dataset.profileText;if(k)touched.direct.add(k)}
 if(t.id?.startsWith('gm610_')&&!t.id.startsWith('gm610c_')){k=t.id.slice(6);if(k)touched.direct.add(k)}
 if(t.matches?.('[data-pk-id]')){k=t.dataset.pkId;if(k)touched.pre.add(k)}
 if(t.id?.startsWith('pk_')&&!t.id.startsWith('pkc_')){k=t.id.slice(3);if(k)touched.pre.add(k)}
 if(t.matches?.('[data-mm-real]')){k=t.dataset.mmReal;if(k)touched.menu.add(k)}
 if(t.matches?.('[data-mainmenu-fb96]')){k=t.dataset.mainmenuFb96;if(k)touched.menu.add(k)}
 if(t.matches?.('[data-gfx-intent]')){k=t.dataset.gfxIntent;if(k)touched.gfx.add(k)}
 if(t.id?.startsWith('st612_'))touched.gfx.add('strategy.screen.v614.'+t.id.slice(6));
 if(t.id?.startsWith('pk590_'))touched.gfx.add('__pk590.native.'+t.id.slice(6));
 if(t.id==='romMetaTitle'||t.id==='romMetaTitleDesired')touched.internalTitle=true;
 if(t.closest?.('#page-title-screen'))touched.titleScreen=true;anyUserEdit=true;
}

const priorFinalize=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;
window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(obj){
 try{priorFinalize?.(obj)}catch(e){console.warn('V14 previous project finalizer',e)}
 if(!obj?.state)return obj;obj.state.semantic||(obj.state.semantic={});
 const baseline=currentProject?projectScreenTexts(currentProject):screenTextsBaseline,captured=captureScreenTexts(baseline);obj.state.semantic.screenTextsV1=captured;screenTextsBaseline=clone(captured);
 window.ISSSDLog?.add?.('Projetos','info','Textos por tela anexados ao projeto',{screens:Object.keys(captured.values||{}).length,fields:Object.values(captured.values||{}).reduce((n,x)=>n+Object.keys(x||{}).length,0)});return obj;
};
const previousAfterOpen=window.__ISSSD_GIT_AFTER_PROJECT_OPEN__;
window.__ISSSD_GIT_AFTER_PROJECT_OPEN__=async function(file){
 try{await previousAfterOpen?.(file)}catch(e){console.warn('V14 previous import hook',e)}
 try{currentProject=JSON.parse(await file.text())}catch(e){console.error('V14 project parse',e);return}
 screenTextsBaseline=projectScreenTexts(currentProject);anyUserEdit=false;for(const s of [touched.direct,touched.pre,touched.menu,touched.gfx,touched.screen])s.clear();touched.internalTitle=false;touched.titleScreen=false;
 applyFull(currentProject);normalizeMainMenuColorUi();installScreenOwnedUi();normalizeTitleTextUi();syncMainMenuVisualEditor(currentProject);
 for(const ms of [80,220,560,1100])setTimeout(()=>{if(!anyUserEdit)applyFull(currentProject);else hydrateDom(currentProject)},ms);
 window.ISSSDLog?.add?.('Projetos','info','V14: projeto reaplicado com textos por tela, Menu Principal e fonte livre sincronizados',{build:V11,screens:Object.keys(screenTextsBaseline.values||{}).length});
};
document.addEventListener('input',e=>markTouched(e.target),true);
document.addEventListener('change',e=>{if(e.target?.id!=='projectFile')markTouched(e.target)},true);
document.addEventListener('click',e=>{if(e.target?.closest?.('.navbtn[data-page], [data-page]'))setTimeout(()=>{scheduleHydration();scheduleUi();normalizeMainMenuColorUi()},0)},true);
const mo=new MutationObserver(()=>{scheduleHydration();scheduleUi()});if(document.documentElement)mo.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{normalizeMainMenuColorUi();installScreenOwnedUi();normalizeTitleTextUi()},{once:true});else{normalizeMainMenuColorUi();installScreenOwnedUi();normalizeTitleTextUi()}
setTimeout(()=>{normalizeMainMenuColorUi();installScreenOwnedUi();normalizeTitleTextUi()},250);setTimeout(()=>{normalizeMainMenuColorUi();installScreenOwnedUi();normalizeTitleTextUi()},900);setTimeout(()=>{installScreenOwnedUi();normalizeTitleTextUi()},1600);
const badge=document.getElementById('isssdGitBridgeBadge');if(badge){badge.textContent='Git Visual Bridge v14';badge.title='Textos por tela + menu sincronizado + controles compactos + fonte livre na Tela Inicial.'}
window.__ISSSD_SCREEN_TEXTS_V1__={schema:'isssd-screen-texts-v1',capture:()=>captureScreenTexts(),hydrate:()=>currentProject&&hydrateScreenTexts(currentProject),get:()=>clone(screenTextsBaseline),installScreenOwnedUi};
window.__ISSSD_GIT_PROJECT_IMPORT_V11__={build:V11,getProject:()=>clone(currentProject),hydrate:()=>currentProject&&hydrateDom(currentProject),normalizeMainMenuColorUi,installScreenOwnedUi,installGroupedControlsUi,syncMainMenuVisualEditor,normalizeTitleTextUi};