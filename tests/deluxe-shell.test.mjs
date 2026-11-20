import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initShell,nextDisplayMode} from '../deluxe-editor/shell.mjs';

test('shell modes cycle, persist and do not modify panel readiness',()=>{
  const button={textContent:'⚑ Equipes',setAttribute(k,v){this[k]=v;},hidden:true};
  const groups=[{hidden:true}];
  const sidebar={querySelectorAll:s=>s==='[data-page]'?[button]:groups};
  const toggle={setAttribute(k,v){this[k]=v;},addEventListener(k,f){this[k]=f;}};
  const label={};const events={};const body={dataset:{}};
  const doc={body,getElementById:id=>({sidebarToggle:toggle,editorSidebar:sidebar,sidebarMode:label}[id]),addEventListener:(k,f)=>events[k]=f};
  let stored='invalid';const storage={getItem:()=>stored,setItem:(k,v)=>stored=v};
  initShell(doc,storage);
  assert.equal(body.dataset.displayMode,'complete');assert.equal(button['aria-label'],'Equipes');
  toggle.click();assert.equal(stored,'compact');assert.equal(sidebar.hidden,false);
  toggle.click();assert.equal(stored,'focus');assert.equal(sidebar.hidden,true);assert.equal(toggle['aria-expanded'],'false');
  toggle.click();assert.equal(stored,'complete');assert.equal(sidebar.hidden,false);
  events['deluxe:editor-ready']({detail:true});assert.equal(groups[0].hidden,false);assert.equal(button.hidden,true);
  events['deluxe:editor-ready']({detail:false});assert.equal(groups[0].hidden,true);
  assert.equal(nextDisplayMode('focus'),'complete');
});

test('all navigation buttons map one-to-one to existing panels',()=>{
  const html=fs.readFileSync(new URL('../deluxe-editor/index.html',import.meta.url),'utf8');
  const pages=[...html.matchAll(/data-page="([^"]+)"/g)].map(m=>m[1]);
  const panels=[...html.matchAll(/data-panel="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(pages).size,pages.length);assert.deepEqual(pages.sort(),panels.sort());
  for(const id of ['rom','load','openProjectButton','save','export','status','sidebarToggle','sidebarMode'])assert.equal([...html.matchAll(new RegExp(`id="${id}"`,'g'))].length,1,id);
});
