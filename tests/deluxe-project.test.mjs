import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {splitRom,createDeluxeProject,buildDeluxeProject} from '../src/core/deluxe-project.mjs';
import {PLUS_STRATEGY_TEXTS,readPlusStrategyText} from '../src/core/plus-strategy-text.mjs';
test('header de copiador é separado sem modificar entrada',()=>{
 const input=new Uint8Array(0x200200);input[0]=83;input[512]=12;
 const {header,rom}=splitRom(input);assert.equal(header.length,512);assert.equal(header[0],83);assert.equal(rom[0],12);rom[0]=5;assert.equal(input[512],12);
});
test('não aceita arquivo desconhecido como Deluxe',async()=>{
 await assert.rejects(createDeluxeProject(new Uint8Array(0x200000)),/incompatível/);
});
const fixture=process.env.ISSSD_DELUXE_ROM;
test('ROM real: identidade, edições restritas, checksum, roundtrip e rejeição de recursos pendentes',{skip:!fixture},async()=>{
 const input=new Uint8Array(fs.readFileSync(fixture)),original=input.slice();
 const project=await createDeluxeProject(input),empty=await buildDeluxeProject(input,project);
 assert.deepEqual(empty.rom,input);assert.equal(empty.diff.changedBytes,0);
 project.changes.strategyTexts.alloutatk='TODOS ATAQUE';
 const result=await buildDeluxeProject(input,JSON.parse(JSON.stringify(project)));
 assert.equal(result.rom.length,input.length);assert.deepEqual(input,original);
 const splitRomCached=splitRom(input).rom;
 const header=splitRom(input).header.length,{rom}=splitRom(result.rom),item=PLUS_STRATEGY_TEXTS[0];
 assert.deepEqual(result.rom.slice(0,header),input.slice(0,header));
 for(let i=0;i<rom.length;i++)if(rom[i]!==splitRomCached[i])assert.ok((i>=item.pc&&i<item.pc+20)||(i>=0x7fdc&&i<0x7fe0));
 assert.equal(readPlusStrategyText(rom,'alloutatk'),'TODOS ATAQUE');
 const sum=rom.reduce((s,b)=>(s+b)&65535,0);assert.equal(sum,rom[0x7fde]|rom[0x7fdf]<<8);
 delete project.changes.strategyTexts.alloutatk;
 assert.deepEqual((await buildDeluxeProject(input,project)).rom,input);
 project.changes.improvements=['goalkeeper-free-kick'];await assert.rejects(buildDeluxeProject(input,project),/sem patch/);
 project.changes.improvements=[];project.changes.plusPlayers={};await assert.rejects(buildDeluxeProject(input,project),/não suportado/);
});

test('ROM real: estádios, textos e Cursor compartilham codecs e preservam todas as regiões restantes',{skip:!fixture},async()=>{
 const {NATIVE_SCREEN_TEXT_FIELDS,CURSOR_HELP_FIELDS,readStadiums,readNativeField,readCursorHelp,encodeNativeField}=await import('../src/core/deluxe-native-fields.mjs');
 const {encodeCursorText}=await import('../src/core/cursor-text-codec.mjs');
 const {plusNativeScreenTextWriter}=await import('../src/core/plus-native-screen-text.mjs');
 const input=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(input).rom,snapshot=input.slice();
 const project=await createDeluxeProject(input),catalog=readStadiums(base);
 project.changes.nativeTexts=Object.fromEntries(NATIVE_SCREEN_TEXT_FIELDS.map(f=>[f.pc,'A']));
 project.changes.cursorHelp=Object.fromEntries(CURSOR_HELP_FIELDS.map(f=>[f[0],'A']));
 project.changes.stadiums=Object.fromEntries(catalog.map(s=>[s.id,s.colors.map(c=>c^31)]));
 project.changes.internalTitle='DELUXE TEST';
 const copy=JSON.parse(JSON.stringify(project)),result=await buildDeluxeProject(input,copy),out=splitRom(result.rom).rom;
 assert.deepEqual(input,snapshot);assert.equal(result.rom.length,input.length);assert.equal(result.expanded,false);
 assert.deepEqual(splitRom(result.rom).header,splitRom(input).header);
 const reference=plusNativeScreenTextWriter(base.slice(),{textWorkspaceV2:{sections:{graphicIntents:{values:Object.fromEntries(NATIVE_SCREEN_TEXT_FIELDS.map(f=>['__pk590.native.'+f.pc,'A']))}}}});
 for(const f of NATIVE_SCREEN_TEXT_FIELDS){assert.equal(readNativeField(out,f),'A');assert.deepEqual(out.slice(f.pc,f.pc+f.capacity),encodeNativeField('A',f));assert.deepEqual(out.slice(f.pc,f.pc+f.capacity),reference.slice(f.pc,f.pc+f.capacity));}
 for(const f of CURSOR_HELP_FIELDS){const encoded=encodeCursorText(f,'A'),at=f[3].native.pc;assert.deepEqual(out.slice(at,at+encoded.length),encoded);assert.equal(readCursorHelp(out,f).trim(),'A');}
 assert.deepEqual(readStadiums(out).map(s=>s.colors),Object.values(project.changes.stadiums));
 const regions=[[0x7fc0,0x7fc0+21],[0x7fdc,0x7fe0],...NATIVE_SCREEN_TEXT_FIELDS.map(f=>[f.pc,f.pc+f.capacity]),...CURSOR_HELP_FIELDS.map(f=>{const n=f[3].native;return [n.pc,n.pc+n.width*n.rowCount];}),...catalog.map(s=>[s.palette+2,s.palette+34])];
 for(let i=0;i<out.length;i++)if(out[i]!==base[i])assert.ok(regions.some(([a,b])=>i>=a&&i<b),'unexpected write '+i.toString(16));
 assert.equal(out.reduce((s,b)=>(s+b)&65535,0),out[0x7fde]|out[0x7fdf]<<8);
 copy.changes={strategyTexts:{},improvements:[]};assert.deepEqual((await buildDeluxeProject(input,copy)).rom,input);
});

test('ROM real: rejeita campos, glifos, tamanhos e paletas inválidos sem modificar a base',{skip:!fixture},async()=>{
 const {NATIVE_SCREEN_TEXT_FIELDS,CURSOR_HELP_FIELDS}=await import('../src/core/deluxe-native-fields.mjs');
 const input=new Uint8Array(fs.readFileSync(fixture)),snapshot=input.slice();
 const cases=[['nativeTexts',{'1':'A'}],['nativeTexts',{[NATIVE_SCREEN_TEXT_FIELDS[0].pc]:'A'.repeat(200)}],['nativeTexts',{[NATIVE_SCREEN_TEXT_FIELDS[0].pc]:'A!'}],['cursorHelp',{bad:'A'}],['cursorHelp',{[CURSOR_HELP_FIELDS[0][0]]:'A'.repeat(1000)}],['stadiums',{'8':Array(16).fill(0)}],['stadiums',{'0':Array(16).fill(32768)}],['stadiums',{'0':[1]}]];
 for(const [key,value]of cases){const project=await createDeluxeProject(input);project.changes[key]=value;await assert.rejects(buildDeluxeProject(input,project));assert.deepEqual(input,snapshot);}
});

test('ROM real: 139 textos de menus editam somente segmentos nativos e restauram sem resíduos',{skip:!fixture},async()=>{
 const {DELUXE_MENU_SECTIONS,encodeNativeMenuField}=await import('../src/core/deluxe-menu-text.mjs');
 const input=new Uint8Array(fs.readFileSync(fixture)),snapshot=input.slice(),base=splitRom(input).rom;
 const project=await createDeluxeProject(input),regions=[];
 assert.equal(DELUXE_MENU_SECTIONS.reduce((n,s)=>n+s.fields.length,0),145);
 project.changes.menuTexts=Object.fromEntries(DELUXE_MENU_SECTIONS.map(s=>[s.id,Object.fromEntries(s.fields.map(f=>[f[0],'A']))]));
 for(const section of DELUXE_MENU_SECTIONS)for(const f of section.fields){
  const relocation=f[3].pool.relocation;
  if(relocation)regions.push([relocation.pc,relocation.pc+f[3].pool.capacity],[relocation.ref,relocation.ref+2],[relocation.ref+4,relocation.ref+5]);
  const original=encodeNativeMenuField(f,f[1]);
  for(const [i,segment]of f[3].pool.segments.entries()){
   assert.deepEqual(base.slice(segment.pc,segment.pc+segment.original.length),original[i],section.id+'/'+f[0]);
   regions.push([segment.pc,segment.pc+segment.original.length]);
  }
 }
 const reloaded=JSON.parse(JSON.stringify(project)),result=await buildDeluxeProject(input,reloaded),out=splitRom(result.rom).rom;
 for(const s of DELUXE_MENU_SECTIONS)for(const f of s.fields){const bytes=encodeNativeMenuField(f,'A');f[3].pool.segments.forEach((seg,i)=>assert.deepEqual(out.slice(f[3].pool.relocation?.pc??seg.pc,(f[3].pool.relocation?.pc??seg.pc)+bytes[i].length),bytes[i]));}
 assert.equal(result.rom.length,input.length);assert.deepEqual(splitRom(result.rom).header,splitRom(input).header);
 regions.push([0x7fdc,0x7fe0],[0x3B1BE,0x3B1C0],[0x3448F,0x34491],[0x3BE05,0x3BE07]);
 for(let i=0;i<base.length;i++)if(base[i]!==out[i])assert.ok(regions.some(([start,end])=>i>=start&&i<end),'unexpected write '+i.toString(16));
 assert.equal(out.reduce((s,b)=>(s+b)&65535,0),out[0x7fde]|out[0x7fdf]<<8);assert.deepEqual(input,snapshot);
 reloaded.changes.menuTexts=Object.fromEntries(DELUXE_MENU_SECTIONS.map(s=>[s.id,Object.fromEntries(s.fields.map(f=>[f[0],f[1]]))]));
 assert.deepEqual((await buildDeluxeProject(input,reloaded)).rom,input);
 for(const invalid of [{missing:{}},{'stadium-native':{unknown:'TEST'}},{'options-native':[]},{[DELUXE_MENU_SECTIONS[0].id]:{[DELUXE_MENU_SECTIONS[0].fields[0][0]]:'A'.repeat(1000)}}]){
  reloaded.changes.menuTexts=invalid;await assert.rejects(buildDeluxeProject(input,reloaded));assert.deepEqual(input,snapshot);
 }
});

test('ROM real: menu principal preserva o fundo compartilhado, prévia OBJ coincide com exportação e restauração é exata',{skip:!fixture},async()=>{
 const {deluxeMainMenuPreview,planDeluxeMainMenu,PLUS_MAIN_MENU_ORIGINAL}=await import('../src/core/deluxe-main-menu.mjs');
 const {PLUS_MAIN_MENU_REGIONS}=await import('../src/core/plus-main-menu-renderer.mjs');
 const input=new Uint8Array(fs.readFileSync(fixture)),snapshot=input.slice(),base=splitRom(input).rom,p=await createDeluxeProject(input);
 p.changes.mainMenu={texts:{openGame:'AMISTOSO'},scale:80};
 const plan=planDeluxeMainMenu(p.changes.mainMenu);assert.equal(plan.regions.length,3);
 const result=await buildDeluxeProject(input,JSON.parse(JSON.stringify(p))),out=splitRom(result.rom).rom;
 assert.equal(result.rom.length,input.length);assert.deepEqual(input,snapshot);
 for(const id of ['background','tilemap']){const r=PLUS_MAIN_MENU_REGIONS[id];assert.deepEqual(out.slice(r.pc,r.pc+r.capacity),base.slice(r.pc,r.pc+r.capacity));}
 const ranges=plan.regions.map(r=>[r.pc,r.pc+r.bytes.length]);ranges.push([0x7fdc,0x7fe0]);
 for(let i=0;i<base.length;i++)if(base[i]!==out[i])assert.ok(ranges.some(([a,b])=>i>=a&&i<b),'unexpected write '+i.toString(16));
 for(let i=0;i<8;i++){
  const preview=deluxeMainMenuPreview(base,p.changes.mainMenu,i),encoded=deluxeMainMenuPreview(out,undefined,i,true);
  assert.deepEqual(preview.pixels,encoded.pixels);assert.ok(preview.pixels.some(v=>v>=16));
 }
 assert.notDeepEqual(deluxeMainMenuPreview(base,p.changes.mainMenu,0).pixels,deluxeMainMenuPreview(base,p.changes.mainMenu,1).pixels);
 p.changes.mainMenu={texts:{openGame:PLUS_MAIN_MENU_ORIGINAL.openGame},scale:80};assert.deepEqual((await buildDeluxeProject(input,p)).rom,input);
 for(const value of [{texts:{openGame:'AMISTOSO'},scale:115},{texts:{openGame:'!'}},{texts:{bad:'A'}},{texts:{openGame:''}},{texts:{},scale:NaN},{texts:{},composition:{} }]){
  p.changes.mainMenu=value;await assert.rejects(buildDeluxeProject(input,p));assert.deepEqual(input,snapshot);
 }
});

test('BRR: decodificação sem filtro, sinal e tamanho de um bloco',async()=>{
 const {decodeBrrPreview}=await import('../src/core/deluxe-sounds.mjs');
 const block=Uint8Array.of(0x11,...Array(8).fill(0x78)),pcm=decodeBrrPreview(block);
 assert.equal(pcm.length,16);assert.equal(pcm[0],14/32768);assert.equal(pcm[1],-16/32768);
});
test('ROM real: 74 amostras restauram exatamente e substituições preservam o restante',{skip:!fixture},async()=>{
 const {SOUND_SLOTS,originalSound,soundEntry,decodeBrrPreview}=await import('../src/core/deluxe-sounds.mjs');
 const file=new Uint8Array(fs.readFileSync(fixture)),snapshot=file.slice(),base=splitRom(file).rom,p=await createDeluxeProject(file);
 assert.equal(SOUND_SLOTS.length,74);
 p.changes.sounds=Object.fromEntries(SOUND_SLOTS.map(s=>[s.id,soundEntry(base,s.id,originalSound(base,s.id))]));
 assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
 for(const s of SOUND_SLOTS){const bytes=originalSound(base,s.id);assert.ok(decodeBrrPreview(bytes).every(Number.isFinite));bytes[1]^=0x11;p.changes.sounds[s.id]=soundEntry(base,s.id,bytes);}
 const out=splitRom((await buildDeluxeProject(file,JSON.parse(JSON.stringify(p)))).rom).rom,allowed=new Set(SOUND_SLOTS.map(s=>s.pc+1));
 for(let i=0;i<base.length;i++)if(base[i]!==out[i])assert.ok(allowed.has(i)||(i>=0x7fdc&&i<0x7fe0),'unexpected write '+i.toString(16));
 for(const s of SOUND_SLOTS)assert.equal(out[s.pc+1],base[s.pc+1]^0x11);
 assert.deepEqual(file,snapshot);delete p.changes.sounds;assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
 const id=SOUND_SLOTS[0].id;
 assert.throws(()=>soundEntry(base,id,Uint8Array.of(0,0,0)),/final/);
 assert.throws(()=>soundEntry(base,id,Uint8Array.of(0xf1,...Array(8).fill(0))),/cabeçalho/);
 assert.throws(()=>soundEntry(base,id,new Uint8Array(originalSound(base,id).length+9)),/capacidade/);
 p.changes.sounds={unknown:{source:'custom',brrBase64:'AQAAAAAAAAAA'}};await assert.rejects(buildDeluxeProject(file,p),/desconhecido/);
});

test('ROM real: referência Galvão individual e lote cabem e não alteram dados vizinhos',{skip:!fixture},async()=>{
 const {galvaoSoundChoices,SOUND_SLOTS,selectedSound}=await import('../src/core/deluxe-sounds.mjs');
 const reference=JSON.parse(fs.readFileSync(new URL('../deluxe-editor/galvao-samples.json',import.meta.url))),file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file);
 const single=galvaoSoundChoices(base,reference,[SOUND_SLOTS[0].id]);assert.equal(Object.keys(single).length,1);
 p.changes.sounds=galvaoSoundChoices(base,reference);assert.equal(Object.keys(p.changes.sounds).length,74);
 const output=splitRom((await buildDeluxeProject(file,JSON.parse(JSON.stringify(p)))).rom).rom,allowed=[];
 for(const slot of SOUND_SLOTS){const bytes=selectedSound(base,slot.id,p.changes.sounds);assert.deepEqual(output.slice(slot.pc,slot.pc+bytes.length),bytes);allowed.push([slot.pc,slot.pc+bytes.length]);}
 for(let i=0;i<base.length;i++)if(base[i]!==output[i])assert.ok((i>=0x7fdc&&i<0x7fe0)||allowed.some(([a,b])=>i>=a&&i<b));
 const bad=structuredClone(reference);delete bad.samples[SOUND_SLOTS.at(-1).id];assert.throws(()=>galvaoSoundChoices(base,bad),/ausente/);
});

test('ROM real: avisos do treino e estatísticas passam nos preflights Plus e escrevem somente regiões declaradas',{skip:!fixture},async()=>{
 const {TRAINING_HUD_FIELDS,MATCH_STATISTICS_FIELDS}=await import('../src/core/deluxe-match-texts.mjs');
 const {TRAINING_HUD_REGIONS}=await import('../src/core/plus-training-hud.mjs'),{MATCH_STATISTICS_REGIONS}=await import('../src/core/plus-match-statistics.mjs');
 const file=new Uint8Array(fs.readFileSync(fixture)),snapshot=file.slice(),base=splitRom(file).rom,p=await createDeluxeProject(file);
 for(const [id,fields]of [['trainingHud',TRAINING_HUD_FIELDS],['matchStatistics',MATCH_STATISTICS_FIELDS]])p.changes[id]=Object.fromEntries(fields.map(f=>[f[0],f[1]]));
 assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
 for(const [id,fields]of [['trainingHud',TRAINING_HUD_FIELDS],['matchStatistics',MATCH_STATISTICS_FIELDS]])p.changes[id]=Object.fromEntries(fields.map(f=>[f[0],f[2]]));
 const output=await buildDeluxeProject(file,JSON.parse(JSON.stringify(p))),out=splitRom(output.rom).rom;
 assert.equal(output.rom.length,file.length);assert.equal(output.expanded,false);assert.deepEqual(file,snapshot);assert.ok(output.diff.changedBytes>1000);
 const ranges=[...TRAINING_HUD_REGIONS,...MATCH_STATISTICS_REGIONS,[0x7fdc,0x7fe0]];
 for(let i=0;i<base.length;i++)if(base[i]!==out[i])assert.ok(ranges.some(([a,b])=>i>=a&&i<b),'unexpected write '+i.toString(16));
 assert.equal(out.reduce((s,b)=>(s+b)&65535,0),out[0x7fde]|out[0x7fdf]<<8);
 for(const bad of [{trainingHud:{bad:'A'}},{matchStatistics:{shots:''}},{trainingHud:{start:'Z'}},{matchStatistics:{shots:'A'.repeat(100)}}]){
  const trial=await createDeluxeProject(file);Object.assign(trial.changes,bad);await assert.rejects(buildDeluxeProject(file,trial));assert.deepEqual(file,snapshot);
 }
 delete p.changes.trainingHud;delete p.changes.matchStatistics;assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
});

test('ROM real: seis textos especiais realocam rótulos e ajustam posições como no Plus',{skip:!fixture},async()=>{
 const {SPECIAL_MENU_FIELDS}=await import('../src/core/deluxe-special-menu-fields.mjs');
 const {applyDeluxeMenuTexts,encodeNativeMenuField}=await import('../src/core/deluxe-menu-text.mjs');
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file);
 const translations={data_87cad3:'ESTADIO',data_87df39:'LIVRE',data_87df3d:'DEFESA',data_87df52:'FALTA',data_87df5b:'GOLEIRO',data_87df61:'MODO'};
 p.changes.menuTexts={};for(const {section,field}of SPECIAL_MENU_FIELDS)(p.changes.menuTexts[section]??={})[field[0]]=translations[field[0]];
 const result=await buildDeluxeProject(file,JSON.parse(JSON.stringify(p))),out=splitRom(result.rom).rom;
 assert.equal(result.rom.length,file.length);assert.equal(result.expanded,false);
 for(const {field:f}of SPECIAL_MENU_FIELDS){const r=f[3].pool.relocation;if(!r)continue;const expected=encodeNativeMenuField(f,translations[f[0]])[0];assert.equal(out[r.ref]|out[r.ref+1]<<8,r.pc&65535);assert.equal(out[r.ref+4],expected.length);assert.deepEqual(out.slice(r.pc,r.pc+expected.length),expected);assert.deepEqual(out.slice(f[3].pool.segments[0].pc,f[3].pool.segments[0].pc+f[1].length),base.slice(f[3].pool.segments[0].pc,f[3].pool.segments[0].pc+f[1].length));}
 for(const [at,value]of [[0x3BDBB,0x010D],[0x3BDC1,0x016D],[0x3BDC7,0x0108],[0x3BDCD,0x0168],[0x3B1BE,0x0128],[0x3448F,0x0131]])assert.equal(out[at]|out[at+1]<<8,value);
 const target=base.slice();target[0x3FBA0]=0;const snapshot=target.slice();assert.throws(()=>applyDeluxeMenuTexts(target,base,p.changes.menuTexts),/reserva ocupada/);assert.deepEqual(target,snapshot);
 p.changes.menuTexts={};for(const {section,field}of SPECIAL_MENU_FIELDS)(p.changes.menuTexts[section]??={})[field[0]]=field[1];assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
});

test('ROM real: FB96 individual e lote preservam as amostras do Plus sem reconversão',{skip:!fixture},async()=>{
 const {fb96SoundChoices,SOUND_SLOTS,selectedSound}=await import('../src/core/deluxe-sounds.mjs');
 const reference=JSON.parse(fs.readFileSync(new URL('../deluxe-editor/fb96-samples.json',import.meta.url))),file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file);
 assert.equal(Object.keys(fb96SoundChoices(base,reference,[SOUND_SLOTS[0].id])).length,1);
 p.changes.sounds=fb96SoundChoices(base,reference);assert.equal(Object.keys(p.changes.sounds).length,74);
 const output=splitRom((await buildDeluxeProject(file,JSON.parse(JSON.stringify(p)))).rom).rom,allowed=[];
 for(const s of SOUND_SLOTS){assert.equal(p.changes.sounds[s.id].source,'fb96');const bytes=selectedSound(base,s.id,p.changes.sounds);assert.deepEqual(bytes,Uint8Array.from(Buffer.from(reference.samples[s.id],'base64')));assert.deepEqual(output.slice(s.pc,s.pc+bytes.length),bytes);allowed.push([s.pc,s.pc+bytes.length]);}
 for(let i=0;i<base.length;i++)if(base[i]!==output[i])assert.ok((i>=0x7fdc&&i<0x7fe0)||allowed.some(([a,b])=>i>=a&&i<b));
 delete p.changes.sounds;assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
 assert.throws(()=>fb96SoundChoices(base,{...reference,source:'Galvao'}),/inválida/);
});

test('ROM real: tela inicial altera quatro paletas e dois rodapés, com restauração exata',{skip:!fixture},async()=>{
 const {TITLE_PALETTES,TITLE_TEXT_FIELDS,readTitlePalettes,readTitleText}=await import('../src/core/deluxe-title-screen.mjs');
 const file=new Uint8Array(fs.readFileSync(fixture)),snapshot=file.slice(),base=splitRom(file).rom,p=await createDeluxeProject(file);
 p.changes.titleScreen={texts:Object.fromEntries(TITLE_TEXT_FIELDS.map(f=>[f.id,readTitleText(base,f)])),palettes:Object.fromEntries(readTitlePalettes(base).map(p=>[p.id,p.colors]))};
 assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
 p.changes.titleScreen.texts={copyright:'@1995KONAMI',license:'BYNINTENDO'};
 p.changes.titleScreen.palettes=Object.fromEntries(readTitlePalettes(base).map(p=>[p.id,p.colors.map(c=>c^31)]));
 const result=await buildDeluxeProject(file,JSON.parse(JSON.stringify(p))),out=splitRom(result.rom).rom;
 for(const f of TITLE_TEXT_FIELDS)assert.equal(readTitleText(out,f),p.changes.titleScreen.texts[f.id]);
 for(const palette of readTitlePalettes(out))assert.deepEqual(palette.colors,p.changes.titleScreen.palettes[palette.id]);
 const allowed=[...TITLE_PALETTES.map(p=>[p.pc,p.pc+32]),...TITLE_TEXT_FIELDS.map(f=>[f.pc-2,f.pc-2+f.count*4]),[0x7fdc,0x7fe0]];
 for(let i=0;i<base.length;i++)if(base[i]!==out[i])assert.ok(allowed.some(([a,b])=>i>=a&&i<b),'unexpected write '+i.toString(16));
 assert.deepEqual(file,snapshot);assert.equal(file.length,result.rom.length);assert.equal(out.reduce((s,b)=>(s+b)&65535,0),out[0x7fde]|out[0x7fdf]<<8);
 for(const value of [{texts:{license:'A\nB'}},{texts:{bad:'A'}},{palettes:{ball:[1]}},{texts:{license:'A'.repeat(19)}}]){p.changes.titleScreen=value;await assert.rejects(buildDeluxeProject(file,p));}
 delete p.changes.titleScreen;assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
});

test('ROM real: letreiro usa ponteiro Deluxe, roundtrip PNG sem mudança e gravação restrita',{skip:!fixture},async()=>{
 const {readTitleLogo,titleLogoPixels,importTitleLogo}=await import('../src/core/deluxe-title-logo.mjs');
 const file=new Uint8Array(fs.readFileSync(fixture)),base=splitRom(file).rom,p=await createDeluxeProject(file),native=readTitleLogo(base),preview=titleLogoPixels(base);
 assert.equal(native.pc,0x150f56);assert.equal(preview.width,176);assert.equal(preview.height,65);assert.ok(preview.rgba.some(v=>v!==0));
 const unchanged=importTitleLogo(base,{},preview.rgba,preview.width,preview.height);assert.deepEqual(unchanged,native.tiles);p.changes.titleScreen={logoTiles:Array.from(unchanged)};assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
 const cleared=importTitleLogo(base,{},new Uint8ClampedArray(preview.rgba.length),preview.width,preview.height);assert.notDeepEqual(cleared,native.tiles);p.changes.titleScreen.logoTiles=Array.from(cleared);
 const result=await buildDeluxeProject(file,JSON.parse(JSON.stringify(p))),out=splitRom(result.rom).rom;assert.deepEqual(readTitleLogo(out).tiles,cleared);assert.equal(result.rom.length,file.length);
 for(let i=0;i<base.length;i++)if(base[i]!==out[i])assert.ok((i>=native.pc&&i<native.pc+native.capacity)||(i>=0x7fdc&&i<0x7fe0),'unexpected write '+i.toString(16));
 assert.throws(()=>importTitleLogo(base,{},preview.rgba,1,1),/176/);
 p.changes.titleScreen.logoTiles=[1];await assert.rejects(buildDeluxeProject(file,p),/tiles/);
 delete p.changes.titleScreen;assert.deepEqual((await buildDeluxeProject(file,p)).rom,file);
});
