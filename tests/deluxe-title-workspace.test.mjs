import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nudgeTitleLayer,titleWorkspaceHistory} from '../deluxe-editor/title-workspace.mjs';

test('native keyboard nudges honor locking, bounds and shift increments',()=>{
 const layer={x:0,y:0,locked:false};
 assert.equal(nudgeTitleLayer(layer,'ArrowRight'),true);
 assert.equal(nudgeTitleLayer(layer,'ArrowUp',true),true);
 assert.deepEqual(layer,{x:1,y:-8,locked:false});
 layer.x=509;
 nudgeTitleLayer(layer,'ArrowRight',true);
 assert.equal(layer.x,512);
 assert.equal(nudgeTitleLayer(layer,'ArrowRight'),false);
 layer.locked=true;
 assert.equal(nudgeTitleLayer(layer,'ArrowDown'),false);
});

test('draft history is isolated, bounded and clears redo after new edits',()=>{
 const history=titleWorkspaceHistory(2),state={elements:[{x:0}]};
 history.record(state);state.elements[0].x=1;
 history.record(state);state.elements[0].x=2;
 history.record(state);state.elements[0].x=3;
 const previous=history.undo(state);
 assert.equal(previous.elements[0].x,2);
 assert.equal(history.redo(previous).elements[0].x,3);
 assert.equal(history.undo(state).elements[0].x,2);
 assert.equal(history.undo(state).elements[0].x,1);
 assert.equal(history.canUndo,false);
 history.record(state);assert.equal(history.canRedo,false);
 history.clear();assert.equal(history.canUndo,false);
});
