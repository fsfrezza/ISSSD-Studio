import test from 'node:test';
import assert from 'node:assert/strict';
import {GAME_AUDIO_RATE,prepareAudio,encodeBrr,pcmToWav} from '../src/core/audio-conversion.mjs';
import {decodeBrrPreview} from '../src/core/deluxe-sounds.mjs';
test('conversão mistura canais, normaliza e mantém duração em 10300 Hz',()=>{
 const sine=Float32Array.from({length:4410},(_,i)=>.3*Math.sin(i*2*Math.PI*440/44100)),result=prepareAudio([sine,sine],44100);
 assert.equal(result.samples.length,1030);assert.equal(result.duration,.1);assert.ok(Math.max(...result.samples)<=.901);
 const bytes=encodeBrr(result.samples,1000),decoded=decodeBrrPreview(bytes);
 assert.equal(bytes.length,Math.ceil(1030/16)*9);assert.ok(bytes.at(-9)&1);assert.ok(decoded.length>=1030&&decoded.length<1046);
 let signal=0,noise=0;for(let i=0;i<1030;i++){signal+=result.samples[i]**2;noise+=(result.samples[i]-decoded[i])**2;}assert.ok(10*Math.log10(signal/noise)>20,'SNR de seno deve exceder 20 dB');
 const wav=pcmToWav(decoded),view=new DataView(wav.buffer);assert.equal(new TextDecoder().decode(wav.slice(0,4)),'RIFF');assert.equal(view.getUint32(24,true),GAME_AUDIO_RATE);assert.equal(view.getUint32(40,true),decoded.length*2);
});
test('silêncio é removido; excesso é recusado sem reduzir duração para caber',()=>{
 const samples=new Float32Array(10300);for(let i=2060;i<4120;i++)samples[i]=.2*Math.sin(i/8);
 const result=prepareAudio([samples],10300);assert.ok(result.duration>.19&&result.duration<.23);
 assert.throws(()=>encodeBrr(result.samples,9),/não será acelerada/);
 assert.throws(()=>prepareAudio([new Float32Array(100)],10300),/silêncio/);
 assert.throws(()=>prepareAudio([Float32Array.of(NaN)],10300),/inválida/);
});
