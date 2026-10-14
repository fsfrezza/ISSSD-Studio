import test from 'node:test';
import assert from 'node:assert/strict';
import {runBuildPipeline,BuildStageError} from '../src/core/build-pipeline.mjs';

test('pipeline encadeia cada estágio sobre a ROM produzida pelo anterior',()=>{
  const base=new Uint8Array([1,2,3]);
  const result=runBuildPipeline(base,{state:{value:9},keepCheckpoints:true,stages:[
    {id:'one',kind:'semantic',run:(work,state)=>{work[0]=state.value;return work;}},
    {id:'two',kind:'derived',run:work=>{const out=new Uint8Array(5);out.set(work);out[4]=7;return out;}},
    {id:'three',kind:'semantic',run:work=>{assert.equal(work[0],9);assert.equal(work[4],7);work[1]=8;return work;}},
  ]});
  assert.deepEqual([...result.rom],[9,8,3,0,7]);
  assert.deepEqual([...base],[1,2,3]);
  assert.deepEqual(result.report.map(x=>x.id),['one','two','three']);
  assert.equal(result.checkpoints.length,3);
  assert.deepEqual([...result.checkpoints[0].rom],[9,2,3]);
  assert.deepEqual([...result.checkpoints[1].rom],[9,2,3,0,7]);
});

test('falha identifica estágio e preserva último checkpoint válido',()=>{
  const base=new Uint8Array([0]);
  assert.throws(()=>runBuildPipeline(base,{stages:[
    {id:'ok',run:work=>{work[0]=1;}},
    {id:'bad',run:()=>{throw new Error('boom');}},
    {id:'never',run:()=>{}},
  ]}),error=>{
    assert.ok(error instanceof BuildStageError);
    assert.equal(error.stageId,'bad');
    assert.equal(error.lastSuccessfulStage,'ok');
    assert.equal(error.cause.message,'boom');
    assert.deepEqual(error.report.map(x=>[x.id,x.status]),[['ok','ok'],['bad','failed']]);
    return true;
  });
});

test('stage condicional aparece como skipped sem alterar a ROM',()=>{
  const base=new Uint8Array([4]);
  const result=runBuildPipeline(base,{stages:[{id:'skip',when:false,run:()=>{throw new Error('must not run');}}]});
  assert.equal(result.report[0].status,'skipped');
  assert.deepEqual(result.rom,base);
});
