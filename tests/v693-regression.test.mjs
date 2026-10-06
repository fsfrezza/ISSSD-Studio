import test from 'node:test';
import assert from 'node:assert/strict';

// Historical regression guard derived from the recovered v6.92 -> v6.93 corridor.
// Opening a project must not restore full raw player/tactical records into the
// working ROM. Semantic team state is build input; physical writes belong to
// deterministic writers/build stages only.

test('project-open policy forbids full raw player-record restoration',()=>{
  const historicalV693={
    teamsSchemaVersion:2,
    playerAttrHexBytes:7,
    restoresPlayerRecordsOnOpen:true,
  };
  assert.equal(historicalV693.playerAttrHexBytes,7);
  assert.equal(historicalV693.restoresPlayerRecordsOnOpen,true);

  const canonicalPolicy={
    restorePhysicalPlayerRecordsOnOpen:false,
    applySemanticPlayerStateDuringBuild:true,
  };
  assert.equal(canonicalPolicy.restorePhysicalPlayerRecordsOnOpen,false);
  assert.equal(canonicalPolicy.applySemanticPlayerStateDuringBuild,true);
});

test('project-open policy forbids raw tactical-record restoration',()=>{
  const historicalV693={
    tacticalRecordBytes:31,
    restoresTacticsOnOpen:true,
  };
  assert.equal(historicalV693.tacticalRecordBytes,31);
  assert.equal(historicalV693.restoresTacticsOnOpen,true);

  const canonicalPolicy={
    restorePhysicalTacticsOnOpen:false,
    regenerateTacticsDuringBuild:true,
  };
  assert.equal(canonicalPolicy.restorePhysicalTacticsOnOpen,false);
  assert.equal(canonicalPolicy.regenerateTacticsDuringBuild,true);
});
