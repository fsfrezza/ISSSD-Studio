import test from 'node:test';
import assert from 'node:assert/strict';
test('abas preservam painéis e expandir/recolher afeta somente a aba ativa',async()=>{
 class Element{
  constructor(id){this.dataset={};this.id=id;this.attrs={};this.handlers={};this.hidden=false;this.children=[];}
  setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}
  addEventListener(k,f){this.handlers[k]=f;}querySelectorAll(){return this.children;}
 }
 const ids=['overview','menu','texts','cursor','stadiums','improvements','title-screen'];
 const panels=ids.map(id=>{const e=new Element(id);e.dataset.panel=id;e.children=[{open:false},{open:false}];return e;});
 const buttons=ids.map(id=>{const e=new Element(id);e.dataset.page=id;return e;});
 const controls=Object.fromEntries(['pageTitle','pageDescription','expandAll','collapseAll'].map(id=>[id,new Element(id)]));
 const previous=globalThis.document;
 globalThis.document={querySelectorAll:s=>s==='[data-panel]'?panels:buttons,getElementById:id=>controls[id]};
 try{
  await import('../deluxe-editor/layout.mjs?test');
  assert.equal(panels[0].hidden,false);assert.equal(panels[1].hidden,true);
  buttons[2].handlers.click();assert.equal(panels[2].hidden,false);assert.equal(panels[0].hidden,true);assert.equal(buttons[2].attrs['aria-current'],'page');
  controls.expandAll.handlers.click();assert.ok(panels[2].children.every(e=>e.open));assert.ok(panels[0].children.every(e=>!e.open));
  buttons[1].handlers.click();buttons[2].handlers.click();assert.ok(panels[2].children.every(e=>e.open));
  controls.collapseAll.handlers.click();assert.ok(panels[2].children.every(e=>!e.open));
  buttons[6].handlers.click();assert.equal(panels[6].hidden,false);assert.equal(controls.pageTitle.textContent,'Tela de título');assert.ok(panels.filter(p=>p!==panels[6]).every(p=>p.hidden));
  buttons[5].handlers.click();assert.equal(controls.expandAll.disabled,false);controls.expandAll.handlers.click();assert.ok(panels[5].children.every(e=>e.open));
 }finally{globalThis.document=previous;}
});

test('title navigation points to its own populated HTML panel',async()=>{const fs=await import('node:fs/promises');const html=await fs.readFile(new URL('../deluxe-editor/index.html',import.meta.url),'utf8');assert.match(html,/data-page="title-screen"/);const panel=html.match(/<section id="titleScreenPanel" data-panel="title-screen"[^>]*>([\s\S]*?)<\/section>/)?.[1];assert.ok(panel);for(const id of ['titleComposerElements','titleComposerCanvas','titleTexts','titlePalettes'])assert.ok(panel.includes('id="'+id+'"'),id);});
