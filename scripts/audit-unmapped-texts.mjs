import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {CURSOR_HELP_FIELDS} from '../src/core/cursor-text-fields.mjs';
import {NATIVE_SCREEN_TEXT_FIELDS} from '../src/core/plus-native-screen-text.mjs';
import {PLUS_STRATEGY_TEXTS} from '../src/core/plus-strategy-text.mjs';
import {ADDITIONAL_TEXT_SECTIONS} from '../src/core/additional-screen-text-fields.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [disassembly,romFile,output]=process.argv.slice(2);
if(!output)throw Error('Uso: node scripts/audit-unmapped-texts.mjs DISASSEMBLY ROM_PLUS OUTPUT_JSON');
const source=fs.readFileSync(path.join(disassembly,'Routine_Macros_ISSD.asm'),'utf8');
const lines=source.split(/\r?\n/);
const rom=fs.readFileSync(romFile),sha=crypto.createHash('sha256').update(rom).digest('hex');
if(sha!=='ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a')throw Error('Auditoria exige a ROM Plus original verificada, sem header.');
const pc=cpu=>((cpu>>>16)&127)*0x8000+(cpu&0x7fff);
const norm=s=>s.toUpperCase().replace(/\s+/g,' ').trim();
const fonts={};
for(const name of ['SmallMenuText','TallMenuText']){
 const table=new Map();for(const line of fs.readFileSync(path.join(disassembly,'Tables','Fonts',name+'.txt'),'utf8').split(/\r?\n/)){
  const m=line.match(/^(.*)=([0-9A-Fa-f]+)$/);if(m)table.set(m[1],parseInt(m[2],16));
 }fonts[name]=table;
}
const legacy=fs.readFileSync(path.join(root,'.editor-vendor','legacy-ui','ISSSD-Studio.html'),'utf8');
const start=legacy.indexOf('const ALL_TEXT_GFX_ASSETS=['),end=legacy.indexOf('\n];',start)+3;
const legacyAssets=vm.runInNewContext(legacy.slice(start,end)+';ALL_TEXT_GFX_ASSETS');
const presets=JSON.parse(fs.readFileSync(path.join(root,'project-data','text-language-presets-v1.json')));
const knownEnglish=[...Object.values(presets.sections).flatMap(s=>Object.values(s.english)),...ADDITIONAL_TEXT_SECTIONS.flatMap(s=>s.fields.map(f=>f[1]))].map(norm);
const ranges=[
 ...CURSOR_HELP_FIELDS.map(([id,,,o])=>({pc:o.native.pc,len:o.native.width*o.native.rowCount,owner:'Cursor/'+id})),
 ...NATIVE_SCREEN_TEXT_FIELDS.map(f=>({pc:f.pc,len:f.capacity,owner:'native-screen/'+f.name})),
 ...PLUS_STRATEGY_TEXTS.map(f=>({pc:f.pc,len:20,owner:'strategies/'+f.id})),
 {pc:0x3da0d,len:0x82,owner:'game-modes'},
 {pc:0x3c884,len:6,owner:'Press'},
 {pc:0x3cafa,len:5,owner:'Cursor/AUTO'},
];
const blocks=[];let font=null,block=null,offset=0;
for(const [i,line] of lines.entries()){
 const s=line.trim();if(s==='cleartable')font=null;
 const f=s.match(/^table .*\/(\w+)\.txt/);if(f)font=f[1];
 const label=s.match(/^((?:DATA|UNK)_([0-9A-F]{6})):/);
 if(label){block={label:label[1],cpu:parseInt(label[2],16),sourceLine:i+1,rows:[]};offset=0;blocks.push(block);}
 if(!block)continue;
 for(const part of s.split(/\s+:\s+(?=db\b)/)){
  const d=part.match(/^db\s+(.+?)(?:\s*;.*)?$/);if(!d)continue;
  for(const token of d[1].match(/"[^"]*"|\$[\dA-Fa-f]+|%[01]+|\b\d+\b|[A-Za-z_]\w*/g)||[]){
   if(token.startsWith('"')){
    const text=token.slice(1,-1),at=pc(block.cpu)+offset,encoded=[...text].map(c=>fonts[font]?.get(c));
    if(font&&block.cpu>=0x87c000&&block.cpu<0x87fac8){
     const relevant=[...text].flatMap((c,j)=>c===' '?[]:[at+j]);
     const covering=ranges.filter(r=>relevant.some(p=>p>=r.pc&&p<r.pc+r.len));
     const bindings=relevant.length&&relevant.every(p=>covering.some(r=>p>=r.pc&&p<r.pc+r.len))?covering.map(r=>r.owner):[];
     block.rows.push({text,font,pc:at,sourceLine:i+1,verifiedInPlus:encoded.every((b,j)=>b!==undefined&&rom[at+j]===b),bindings,
      relatedField:!bindings.length&&knownEnglish.includes(norm(text))});
    }offset+=text.length;
   }else offset++;
  }
 }
}
function screenTab(cpu){
 const a=cpu&0xffff;
 if(a===0xc5cd)return 'Textos Seleção de Equipes';
 if(a<0xc811)return 'Textos Escalação';
 if(a<0xc8ba)return 'Textos Vantagem';
 if(a<0xca25)return 'Textos Estratégias';
 if(a<0xca36)return 'Textos Número de Jogadores';
 if(a<0xcada)return 'Textos Estádio';
 if(a===0xcada)return 'Opções da Partida';
 if(a<0xd2e0)return 'Textos Cursor';
 if(a<0xd73a)return 'Textos Controles';
 if(a<0xd79f)return 'Textos Resultados';
 if(a<0xdaa2)return 'Textos Competições';
 if(a<0xdb3d)return 'Textos Pênaltis';
 if(a<0xdd85)return 'Textos Finais';
 if(a<0xdde8)return 'Textos Regras';
 if(a<0xde77)return 'Textos Opções Gerais';
 if(a<0xdfbe)return 'Textos Treinamento';
 if(a<0xe808)return 'Textos Desafio';
 if(a<0xe9e8)return 'Textos Treinamento';
 if(a<0xedbd)return 'Textos Recordes';
 if(a<0xee15)return 'Textos Senha';
 if(a<0xf990)return 'Textos Cenários';
 return 'Textos Créditos';
}
const native=blocks.filter(b=>b.rows.length).map(b=>{
 const rows=b.rows.filter(r=>r.text.trim()),text=rows.map(r=>r.text.trim()).join(' ');
 const technical=!text||/^[\d\s:.-]+$/.test(text)||text.length===1||b.label==='DATA_87EC76';
 const uncovered=rows.filter(r=>!r.bindings.length);
 const references=lines.flatMap((line,i)=>i+1!==b.sourceLine&&line.includes(b.label)?[{line:i+1,text:line.trim()}]:[]);
 return {...b,references,tab:screenTab(b.cpu),pc:pc(b.cpu),status:technical?'technical-or-empty':uncovered.length?'needs-occurrence-mapping':'covered',uncoveredRows:uncovered.length,verifiedInPlus:rows.every(r=>r.verifiedInPlus)};
});
const assetSource=fs.readFileSync(path.join(disassembly,'AsarScripts','AssetPointersAndFiles.asm'),'utf8');
const graphical=[];
for(const [i,line] of assetSource.split(/\r?\n/).entries()){
 const m=line.match(/^\s*dl \$([\dA-F]{6}),\$([\dA-F]{6}),(GFX_\w+),/);if(!m||!/Text|Letters|Copyright/.test(m[3])||/Font/.test(m[3]))continue;
 const cpu=parseInt(m[1],16),cpuEnd=parseInt(m[2],16),asset=legacyAssets.find(a=>a.cpu0===cpu);
 const specific=/EditPlayerSkillsScreen_SkillNameText|FormationChangeScreen_TypeOfFormationText/.test(m[3])?'editable-project-only':/ChangeControllerScreen_Text/.test(m[3])||['largeMainLetters','gameStartText','keyActions'].includes(asset?.id)?'native-writer':null;
 graphical.push({symbol:m[3],cpu,cpuEnd,pc:pc(cpu),sourceLine:i+1,legacyAsset:asset?.id??null,status:specific??(asset?'in-legacy-inventory':'not-in-legacy-inventory')});
}
const result={schema:'isssd-unmapped-text-audit-v1',source:{file:'Routine_Macros_ISSD.asm',sha256:crypto.createHash('sha256').update(source).digest('hex'),romSha256:sha},
 scope:'Quoted SmallMenuText/TallMenuText UI blocks in bank 87 C000..FAC8; graphical assets named Text/Letters/Copyright. Player names excluded. Inventory is not proof of an editable native writer.',
 summary:{nativeBlocks:native.length,covered:native.filter(b=>b.status==='covered').length,needsOccurrenceMapping:native.filter(b=>b.status==='needs-occurrence-mapping').length,technicalOrEmpty:native.filter(b=>b.status==='technical-or-empty').length,verifiedBlocks:native.filter(b=>b.verifiedInPlus).length,graphicalAssets:graphical.length},native,graphical};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.summary));
