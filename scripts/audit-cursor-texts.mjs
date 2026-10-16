import fs from 'node:fs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const POINTER_PC=0x3CB0F,END_PC=0x3D2E0;
const IDS=['pageHelp','typeIntro','typeAHelp','typeBHelp','typeCHelp','typeDHelp','areaIntro','areaHelp','areaAHelp','areaBHelp','areaCHelp','cursorAutoHelp','cursorManualHelp','keeperHelp'];
const LABELS=['Ajuda · trocar página','Ajuda · tipos de cursor','Ajuda · tipo A','Ajuda · tipo B','Ajuda · tipo C','Ajuda · tipo D','Ajuda · introdução às áreas','Ajuda · funcionamento da área','Ajuda · área A','Ajuda · área B','Ajuda · área C','Ajuda · cursor automático','Ajuda · cursor manual','Ajuda · selecionar goleiro'];
const extra=new Map([[0x47,'+'],[0x48,'='],[0x49,'<'],[0x4A,'>'],[0x4B,'$'],[0x4C,'?'],[0x4D,'*'],[0x4E,'#'],[0x4F,'~'],[0x50,"'"],[0x51,'/'],[0x52,','],[0x53,'…']]);
const small=new Map([[0,' '],...Array.from({length:10},(_,i)=>[i+1,String(i)]),...Array.from({length:26},(_,i)=>[i+11,String.fromCharCode(65+i)]),...Array.from({length:26},(_,i)=>[i+42,String.fromCharCode(97+i)]),...[...':-!%.'].map((c,i)=>[0x25+i,c]),[0x44,'('],[0x45,')'],...extra]);
export function auditCursorTexts(input){
 const rom=new Uint8Array(input),sha256=crypto.createHash('sha256').update(rom).digest('hex');
 if(sha256!=='ca2d73b226ab252649d4c9c35bb6b81937586d908c1d9dc9d447db7babfaad0a')throw Error('ROM Plus não reconhecida para auditoria do Cursor');
 const starts=IDS.map((_,i)=>0x38000+(rom[POINTER_PC+i*2]|rom[POINTER_PC+i*2+1]<<8)-0x8000);
 const fields=IDS.map((id,i)=>{
  const pc=starts[i],end=starts[i+1]??END_PC,terminator=rom[end-1]===0xFF?0xFF:null,capacity=end-pc-(terminator===null?0:1);
  if(capacity%28!==0)throw Error('Bloco de Cursor sem linhas/terminador comprovados: '+id);
  const rows=[];for(let p=pc;p<pc+capacity;p+=28){let row='';for(const byte of rom.slice(p,p+28)){if(!small.has(byte))throw Error('Glifo não mapeado: '+byte);row+=small.get(byte)}rows.push(row.replace(/ +$/,''));}
  return [id,rows.join('\n'),id==='pageHelp'?'Troque a página usando os botões L/R.':null,{label:LABELS[i],multiline:true,rows:rows.length,maxChars:capacity,native:{pc,pointerPc:POINTER_PC+i*2,pointerWord:pc-0x38000+0x8000,width:28,rowCount:rows.length,terminator}}];
 });
 return {schema:'isssd-cursor-text-audit-v1',source:{profile:'iss-deluxe-plus',sha256,font:'SmallMenuText',pointerPc:POINTER_PC,endPc:END_PC},fields};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const [rom,output]=process.argv.slice(2);if(!rom||!output)throw Error('Uso: node scripts/audit-cursor-texts.mjs ROM_PLUS OUTPUT_JSON');
 fs.writeFileSync(output,JSON.stringify(auditCursorTexts(fs.readFileSync(rom)),null,2)+'\n');
}
