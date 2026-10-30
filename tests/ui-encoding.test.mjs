import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {repairUiEncoding} from '../src/ui/repair-ui-encoding.mjs';
const broken=(s,mode=0)=>{const b=Buffer.from(s);return mode?new TextDecoder('windows-1252').decode(b):b.toString('latin1');};
test('navigation repairs historic glyphs independently of the local baseline',()=>{
 const html='<button data-page="expansion"><span class="navico">old broken</span><span>Expansão</span></button><button data-page="players"><span class="navico">&#65533;</span><span>Jogadores</span></button>';
 const out=repairUiEncoding(html);assert.match(out,/>⇑<\/span>/);assert.match(out,/>●<\/span>/);assert.match(out,/Expansão/);assert.equal(repairUiEncoding(out),out);
});
test('status and dynamically generated symbols survive single and double misdecoding',()=>{
 for(const mode of [0,1])for(const symbol of ['●','✓','⚠','⇑','▶','★']){
  for(const damaged of [broken(symbol,mode),broken(broken(symbol,mode),mode)]){
   const source=`value.dirty=${JSON.stringify(damaged+' há seções alteradas ainda não implementadas')};`;
   const context={value:{}};vm.runInNewContext(repairUiEncoding(source),context);assert.equal(context.value.dirty,symbol+' há seções alteradas ainda não implementadas');
  }
 }
});
test('correct Portuguese, Unicode, escapes and embedded assets remain intact',()=>{
 const text='Expansão · Jogadores · Opções · África · âncora · ç · 日本語 <script>const asset="QUMwMDhBKysv";const newline="\\n";</script>';
 assert.equal(repairUiEncoding(text),text);
 const normalizer=fs.readFileSync(new URL('../scripts/normalize-generated-html.mjs',import.meta.url),'utf8');assert.match(normalizer,/repairUiEncoding\(fs.readFileSync/);
});
