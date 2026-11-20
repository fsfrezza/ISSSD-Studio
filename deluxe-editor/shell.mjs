// UI preferences only; never modify the project or ROM.
export const DISPLAY_MODES = ['complete', 'compact', 'focus'];
const labels = {complete:'Completo', compact:'Compacto', focus:'Foco'};
const key = 'isssd.deluxe.displayMode';

export function nextDisplayMode(mode){
  return DISPLAY_MODES[(DISPLAY_MODES.indexOf(mode)+1)%DISPLAY_MODES.length];
}

export function initShell(doc, storage){
  const toggle=doc.getElementById('sidebarToggle');
  const sidebar=doc.getElementById('editorSidebar');
  const label=doc.getElementById('sidebarMode');
  if(!toggle||!sidebar||!label)return;
  let mode='complete';
  try{const saved=storage?.getItem(key);if(DISPLAY_MODES.includes(saved))mode=saved;}catch{}
  for(const button of sidebar.querySelectorAll('[data-page]')){
    const name=button.textContent.trim().replace(/^\S+\s+/, '');
    button.title=name;button.setAttribute('aria-label',name);
  }
  function render(){
    doc.body.dataset.displayMode=mode;
    label.textContent=labels[mode];
    toggle.setAttribute('aria-expanded',String(mode!=='focus'));
    toggle.setAttribute('aria-label',`Modo ${labels[mode]}. Alternar visualização`);
    sidebar.hidden=mode==='focus';
  }
  toggle.addEventListener('click',()=>{
    mode=nextDisplayMode(mode);render();
    try{storage?.setItem(key,mode);}catch{}
  });
  doc.addEventListener('deluxe:editor-ready',event=>{
    for(const group of sidebar.querySelectorAll('.nav-group-label'))group.hidden=!event.detail;
  });
  render();
}

if(typeof document!=='undefined'){
  let storage;try{storage=globalThis.localStorage;}catch{}
  initShell(document,storage);
}
