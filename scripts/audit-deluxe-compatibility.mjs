// Read-only audit: imports a pinned Git snapshot into a disposable directory.
// No ROM bytes or decoded copyrighted assets are included in the JSON output.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {splitRom,identifyDeluxe} from '../src/core/deluxe-project.mjs';
import {PLUS_BASELINE} from '../src/core/plus-baseline.mjs';
const [deluxePath,plusPath,reference='origin/fix/goalkeeper-backpass-investigation']=process.argv.slice(2);
if(!deluxePath||!plusPath)throw Error('Uso: node scripts/audit-deluxe-compatibility.mjs Deluxe.smc Plus.sfc [ref]');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const git=(...args)=>execFileSync('git',args,{cwd:root});
const ref=git('rev-parse','--verify',reference+'^{commit}').toString().trim();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'isssd-audit-'));
try{
 const files=git('ls-tree','-r','--name-only',ref,'src/core').toString().trim().split('\n');
 for(const file of files){const target=path.join(temp,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,git('show',ref+':'+file));}
 const load=name=>import(pathToFileURL(path.join(temp,'src/core',name+'.mjs')).href);
 const input=new Uint8Array(fs.readFileSync(deluxePath));await identifyDeluxe(input);
 const a=splitRom(input).rom,b=splitRom(new Uint8Array(fs.readFileSync(plusPath))).rom;
 const hash=value=>createHash('sha256').update(value).digest('hex');
 if(hash(b)!==PLUS_BASELINE.sha256)throw Error('A Plus deve coincidir com o baseline do Editor');
 const compare=(pc,length)=>{if(!Number.isInteger(pc)||!Number.isInteger(length)||length<=0||pc<0||pc+length>a.length||pc+length>b.length)return {pc,length,inBounds:false,identical:false};let equal=0;for(let i=0;i<length;i++)if(a[pc+i]===b[pc+i])equal++;return {pc,length,inBounds:true,identical:equal===length,equalBytes:equal};};
 const rows=[];
 const range=(id,category,source,regions,note)=>rows.push({id,category,source,evidence:regions.map(([pc,n])=>compare(pc,n)),note});
 range('strategies','Textos','plus-strategy-text',[[248014,160]],'Codec já reutilizado no Deluxe.');
 range('metadata','Metadados','plus-rom-meta',[[0x7fc0,21]],'O título difere por conteúdo; campo SNES e codec são compartilhados.');
 range('players','Jogadores','plus-player',[[0x150000,7840]],'Banco relocacionado na Plus; não copiar writer nem espelhos de integridade.');
 range('player-names','Jogadores','plus-player-name',[[0x38138,112],[0x178000,8960]],'Resolver banco e contagem original antes de reutilizar o codec.');
 range('groups','Grupos','plus-groups',[[0xe7f2,64]],'Tabela Plus não pode ser presumida válida no Deluxe.');
 range('tactics','Táticas','plus-tactics-address',[[0x5fdd0,114]],'Tabela Plus ausente no endereço examinado do Deluxe.');
 const menu=await load('plus-main-menu-renderer');
 range('main-menu','Textos / telas','plus-main-menu-renderer',Object.values(menu.PLUS_MAIN_MENU_REGIONS).map(r=>[r.pc,r.capacity??r.length]),'Comparar assets e ponteiros; igualdade não prova todos os caminhos de execução.');
 const stadium=await load('stadiums');
 const stadiumResults={};for(const [label,rom]of [['deluxe',a],['plus',b]]){try{stadiumResults[label]={passed:true,count:stadium.readStadiums(rom).length};}catch(e){stadiumResults[label]={passed:false,error:e.message};}}
 range('stadiums','Estádios','stadiums',stadium.STADIUMS.flatMap(s=>[[s.loader,7],[s.palette,34]]),'Executados os mesmos validadores estruturais nas duas bases.');rows.at(-1).validation=stadiumResults;
 const uniform=await load('team-uniforms');const uniformResults={};
 for(const [label,rom]of [['deluxe',a],['plus',b]]){try{uniformResults[label]={passed:true,mapping:uniform.uniformMapping(rom)};}catch(e){uniformResults[label]={passed:false,error:e.message};}}
 range('uniforms','Uniformes','team-uniforms',[[0x5cfd0,4],[0x26801,4],[0xfcec,112],[0x10274,228],[uniform.JERSEY_DETAILS_PC,8192]],'Validator de uniformes e tabela reserva usam pressupostos da Plus (57 entradas).');rows.at(-1).validation=uniformResults;
 const text=await load('plus-native-screen-text');
 range('native-screen-text','Textos','plus-native-screen-text',text.NATIVE_SCREEN_TEXT_FIELDS.map(f=>[f.pc,f.capacity]),'Comparação por campo; campos diferentes exigem revisão individual.');
 const native=await load('native-menu-text-fields');const nativeMenu=await load('plus-native-menu-text');
 const fields=native.NATIVE_MENU_TEXT_SECTIONS.flatMap(section=>section.fields.map(field=>({section:section.id,field})));
 const menuFields=fields.map(({section,field})=>{
  try{const encoded=nativeMenu.encodeNativeMenuField(field,field[1]);return {section,id:field[0],matchesDeluxe:field[3].pool.segments.every((seg,i)=>encoded[i].every((v,j)=>a[seg.pc+j]===v)),matchesPlus:field[3].pool.segments.every((seg,i)=>encoded[i].every((v,j)=>b[seg.pc+j]===v)),relocation:!!field[3].pool.relocation};}catch(e){return {section,id:field[0],error:e.message};}
 });
 rows.push({id:'native-menu-text',category:'Textos',source:'plus-native-menu-text',fields:menuFields,note:'Verifica conteúdo esperado pelo writer. Não cobre referências, reposicionamentos e reservas extras.'});
 const cursor=await load('plus-cursor-text'),cursorFields=await load('cursor-text-fields');
 rows.push({id:'cursor-help',category:'Cursor',source:'plus-cursor-text',fields:cursorFields.CURSOR_HELP_FIELDS.map(f=>{
 const n=f[3].native,encoded=cursor.encodeCursorText(f,f[1]);const check=rom=>(rom[n.pointerPc]|rom[n.pointerPc+1]<<8)===n.pointerWord&&encoded.every((v,i)=>rom[n.pc+i]===v)&&(n.terminator===null||rom[n.pc+encoded.length]===n.terminator);
 return {id:f[0],pc:n.pc,matchesDeluxe:check(a),matchesPlus:check(b)};
 }),note:'Ajuda textual somente; labels gráficos do Cursor exigem auditoria separada.'});
 const sound=await load('plus-sounds'),slots=await load('sound-slots');
 rows.push({id:'sounds',category:'Sons',source:'plus-sounds',slots:slots.SOUND_SLOTS.map(s=>{
 const result={id:s.id,...compare(s.pc,s.capacity)};
 for(const [label,rom]of [['deluxe',a],['plus',b]]){try{result[label+'BrrLength']=sound.terminatedBrr(rom.slice(s.pc,s.pc+s.capacity)).length;}catch(e){result[label+'Error']=e.message;}}
 return result;
 }),note:'Slots de amostras; não comprova identidade do instrumento/evento nem referências no driver de som.'});
 for(const [id,category,module,constant]of [
 ['photos','Fotos','plus-team-photos','TEAM_PHOTO_REGIONS'],['closeup','Aparência','plus-player-closeup','CLOSEUP_REGIONS'],
 ['pause','Textos / pausa','plus-pause-menu','PAUSE_MENU_REGIONS'],['announcements','Textos / partida','plus-match-announcements','MATCH_ANNOUNCEMENT_REGIONS'],
 ['statistics','Textos / pós-jogo','plus-match-statistics','MATCH_STATISTICS_REGIONS'],['training-hud','Treino','plus-training-hud','TRAINING_HUD_REGIONS']]){
 const m=await load(module);range(id,category,module,m[constant].map(([start,end])=>[start,end-start]),'Regiões de escrita do writer atual, incluindo reservas e hooks; inspecionar dependências antes de migrar.');
 }
 const output={schema:'isssd-deluxe-compatibility-audit-v1',reference:ref,main:git('rev-parse','main').toString().trim(),deluxe:hash(a),plus:hash(b),scope:'Comparação estática e validadores; não é validação de gameplay ou habilitação automática.',rows};
 console.log(JSON.stringify(output,null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
