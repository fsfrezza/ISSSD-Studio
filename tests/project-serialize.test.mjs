import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalProjectOpen} from '../src/core/project-open.mjs';
import {
  PROJECT_SCHEMA,
  PROJECT_SCHEMA_VERSION,
  canonicalProjectDocument,
  projectDocumentFromCanonical,
} from '../src/core/project-serialize.mjs';

function plainCanonical(value){
  return {
    targetLength:value.targetLength,
    patches:value.patches.map(p=>({off:p.off,data:Array.from(p.data)})),
    semantic:structuredClone(value.semantic),
  };
}

test('canonical project document uses explicit modern schema and JSON-safe patch bytes',()=>{
  const input={
    state:{
      targetLength:0x200000,
      patches:[{off:0x1234,bytes:[1,2,3]}],
      semantic:{playerEdits:[{team:30,player:8,number:10}]},
    },
  };
  const document=canonicalProjectDocument(input);
  assert.equal(document.schema,PROJECT_SCHEMA);
  assert.equal(document.version,PROJECT_SCHEMA_VERSION);
  assert.equal(document.profile,'plus');
  assert.deepEqual(document.state.patches,[{off:0x1234,bytes:[1,2,3]}]);
  assert.deepEqual(document.state.semantic.playerEdits,[{number:10,player:8,team:30}]);
  assert.doesNotThrow(()=>JSON.stringify(document));
});

test('serialization round-trip preserves canonical project meaning',()=>{
  const legacy={
    state:{
      targetLength:0x200000,
      patchesCompact:[
        {off:0x1234,len:4,encoding:'rle-base64',data:'A1ZEiFg='},
      ],
      semantic:{
        playerEdits:[{team:30,player:8,skills:{shot:9}}],
        plusTactics:{schema:'isssd-plus-tactics-v1',version:1,teams:{}},
      },
    },
  };
  const before=canonicalProjectOpen(legacy);
  const document=projectDocumentFromCanonical(before);
  const after=canonicalProjectOpen(document);
  assert.deepEqual(plainCanonical(after),plainCanonical(before));
});

test('serializer rejects non-JSON semantic values instead of silently corrupting project',()=>{
  const canonical={targetLength:0x200000,patches:[],semantic:{bad:()=>{}}};
  assert.throws(()=>projectDocumentFromCanonical(canonical),/JSON-serializable/);
});
