import{TEAM_NAME_LANGUAGE_PRESETS}from'../src/core/team-name-presets.mjs';
import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),file=path.join(root,'editor/ISSSD-Studio.html');
const source=name=>fs.readFileSync(path.join(root,name),'utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
export function independentTeamsRuntime(){
 const core='window.ISSSDIndependentTeams=(()=>{'+source('src/core/retired-team-expansion.mjs')+source('src/core/independent-teams.mjs')+';return{validateIndependentTeams,GG_TEAM_IDS,GG_DEFAULT_IDENTITIES,applyIndependentKitColors,normalNames:'+JSON.stringify(TEAM_NAME_LANGUAGE_PRESETS.map(p=>p.portuguese))+'};})();';
 const names='const{decodeFixedPlayerName,encodeFixedPlayerName,normalizePlayerName}=(()=>{'+source('src/core/plus-player-name.mjs')+';return{decodeFixedPlayerName,encodeFixedPlayerName,normalizePlayerName};})();';
 const tactics='const{decodePlusTacticalRecord,encodePlusTacticalRecord}=(()=>{'+source('src/core/plus-tactics-record.mjs')+';return{decodePlusTacticalRecord,encodePlusTacticalRecord};})();';
 const exports=['INDEPENDENT_SKILLS','readIndependentPlayer','editIndependentPlayer','readIndependentFormation','editIndependentFormation','independentPaletteColors','editIndependentPalette','independentFlagPixels','editIndependentFlag'];
 return core+'\nwindow.ISSSDIndependentFields=(()=>{'+names+tactics+source('src/core/independent-team-fields.mjs')+';return{'+exports.join(',')+'};})();\n'+source('editor-src/independent-teams-editor.mjs');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let html=fs.readFileSync(file,'utf8');const id='isssd-independent-teams';html=html.replace(new RegExp('<script id="'+id+'">[\\s\\S]*?</script>','g'),'');if(!html.includes('</body>'))throw Error('Editor sem fechamento de body.');html=html.replace('</body>','<script id="'+id+'">'+independentTeamsRuntime()+'</script>\n</body>');fs.writeFileSync(file,html);console.log('Equipes GG: nomes, jogadores, uniformes, formações e bandeiras independentes integrados ao projeto.');
}
