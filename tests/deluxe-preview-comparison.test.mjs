import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installPreviewComparison} from '../deluxe-editor/preview-comparison.mjs';

test('preview comparison retains its mode across redraws and disables unavailable previews',()=>{
 const doc={createElement:()=>element()};
 function element(){return {ownerDocument:doc,children:[],attributes:{},classList:{add(){},toggle(){}},
  append(...items){this.children.push(...items);for(const item of items)item.parentElement=this;},
  setAttribute(key,value){this.attributes[key]=value;}};}
 const host=element(),preview=element(),original=element();host.append(preview);
 const comparison=installPreviewComparison(preview,original);
 const [toolbar,grid]=host.children.slice(-2),[before,after]=grid.children;
 assert.equal(after.hidden,true);
 assert.equal(toolbar.children[2].disabled,true);
 comparison.setAvailable(true);
 assert.equal(before.hidden,true);
 toolbar.children[2].onclick();
 assert.equal(before.hidden,false);assert.equal(after.hidden,false);
 comparison.setAvailable(true);
 assert.equal(toolbar.children[2].attributes['aria-pressed'],'true');
 comparison.setAvailable(false);
 assert.equal(after.hidden,true);
 assert.equal(toolbar.children[0].attributes['aria-pressed'],'true');
 comparison.setAvailable(true);
 assert.equal(after.hidden,false);
 assert.equal(toolbar.children[2].attributes['aria-pressed'],'true');
});
