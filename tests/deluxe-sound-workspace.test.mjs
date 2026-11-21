import {test} from 'node:test';
import assert from 'node:assert/strict';
import {filterSounds,waveformEnvelope} from '../deluxe-editor/sound-workspace.mjs';
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
