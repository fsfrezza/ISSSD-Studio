import test from 'node:test';
import assert from 'node:assert/strict';
import {studioTextRecordsEqual as equal} from '../editor-src/text-records-equal.mjs';

test('text import accepts reordered graphical fields and nested profile records',()=>{
 assert.ok(equal({a:'ATAQUE',b:'DEFESA'},{b:'DEFESA',a:'ATAQUE'}));
 assert.ok(equal({plus:{a:'A',b:'B'}},{plus:{b:'B',a:'A'}}));
});
test('text import still rejects missing, extra or modified values',()=>{
 for(const actual of [{a:'ATAQUE'},{a:'ATAQUE',b:'OUTRO'},{a:'ATAQUE',b:'DEFESA',c:''}])
  assert.equal(equal(actual,{a:'ATAQUE',b:'DEFESA'}),false);
 assert.equal(equal({a:1},{a:'1'}),false);
});
