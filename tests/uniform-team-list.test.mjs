import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../editor-src/uniforms-editor.mjs',import.meta.url),'utf8');
test('uniform list prefers independent identities to stale native overlay and refreshes after rename',()=>{
 const project=JSON.parse(fs.readFileSync(new URL('../International-Superstar-Soccer-Deluxe-Plus-projeto-recuperado.issdproj',import.meta.url)));const teams=structuredClone(project.state.semantic.independentTeamsV1.teams);
 const select={options:[],value:'30',append(o){this.options.push(o);},set innerHTML(v){this.options=[];}};
 const window={TEAM_COUNT:60,TEAM_NAMES:Array.from({length:60},(_,id)=>'Native '+id),__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__:{teams:{30:{teamName:'BRASIL'},54:{teamName:'EQUIPE DOS AUTORES'},55:{teamName:'TODAS AS ESTRELAS'}}},__ISSSD_UNIFIED_TEAM_CORE__:{is:t=>!!teams[t],team:t=>teams[t]}};
 const context=vm.createContext({window,document:{createElement:()=>({})},select});
 const functions=source.split('\n').filter(line=>/^ function (names|teamOptions)\(/.test(line)).join('\n');
 vm.runInContext('const unified=()=>window.__ISSSD_UNIFIED_TEAM_CORE__,by=()=>select;let team=30;\n'+functions+'\nteamOptions();',context);
 assert.equal(select.options.length,60);assert.equal(select.value,30);assert.equal(select.options[30].textContent,'BRASIL');for(let id=54;id<60;id++)assert.equal(select.options[id].textContent,teams[id].name);
 teams[54].name='NOVO ADIPOSOS';vm.runInContext('teamOptions();',context);assert.equal(select.options[54].textContent,'NOVO ADIPOSOS');assert.equal(select.options.length,60);
 window.__ISSSD_TEAMS_RESOLVED_OVERLAY_V1__.teams[30].teamName='BRASIL HISTORICO';vm.runInContext('teamOptions();',context);assert.equal(select.options[30].textContent,'BRASIL HISTORICO');
});
