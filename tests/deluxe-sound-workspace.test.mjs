import {test} from 'node:test';
import assert from 'node:assert/strict';
import {filterSounds,waveformEnvelope,installSoundWorkspace} from '../deluxe-editor/sound-workspace.mjs';
const slots=[{id:'HeShoots1',kind:'voice'},{id:'Whistle',kind:'effect'},{id:'Goal',kind:'voice'}];
const changes={HeShoots1:{source:'galvao'},Whistle:{source:'custom'}};
test('sound list combines text, type and source without changing catalog or project',()=>{
 assert.deepEqual(filterSounds(slots,changes,'he shoots','voice','galvao'),[slots[0]]);
 assert.deepEqual(filterSounds(slots,changes,'','all','modified'),slots.slice(0,2));
 assert.deepEqual(filterSounds(slots,changes,'','all','original'),[slots[2]]);
 assert.deepEqual(filterSounds(slots,changes,'','effect','custom'),[slots[1]]);
 assert.equal(slots.length,3);
 assert.equal(Object.keys(changes).length,2);
});
test('waveform envelope preserves peaks and tolerates short or silent samples',()=>{
 assert.deepEqual(waveformEnvelope([-.7,.8,-.2,.4],2),[[-.7,.8],[-.2,.4]]);
 assert.deepEqual(waveformEnvelope([0],4),[[0,0],[0,0],[0,0],[0,0]]);
 assert.deepEqual(waveformEnvelope([],2),[[0,0],[0,0]]);
});
test('sound workspace starts disabled, enables on ROM load and disables navigation on an empty filter',()=>{
 const doc={createElement:()=>({children:[],append(...items){this.children.push(...items);},setAttribute(){}})};
 let root;const select={ownerDocument:doc,parentElement:{after(value){root=value;}}};
 const workspace=installSoundWorkspace(select,()=>{},()=>{});
 const [toolbar,summary,nav,canvas]=root.children;
 assert.ok(toolbar.children.every(e=>e.disabled));
 assert.equal(canvas.hidden,true);
 workspace.update(slots,slots,changes,'HeShoots1',true);
 assert.ok(toolbar.children.every(e=>!e.disabled));
 assert.equal(nav.children[0].disabled,true);
 assert.equal(nav.children[2].disabled,false);
 assert.match(summary.textContent,/2 modificados/);
 workspace.update([],slots,changes,'',true);
 assert.equal(nav.children[2].disabled,true);
 assert.equal(canvas.hidden,true);
});
