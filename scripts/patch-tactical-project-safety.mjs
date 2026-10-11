import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const htmlPath=path.join(root,'editor','ISSSD-Studio.html');
if(!fs.existsSync(htmlPath))throw new Error('Editor gerado não encontrado: '+htmlPath);
let html=fs.readFileSync(htmlPath,'utf8');

const late='if(activeRomProfile?.id==="iss-deluxe-plus")await studioAutoPreparePlusTactics();';
const apply='studioCore().applyProject(cleanBase,rebuilt,baseName||d.base?.fileName||"ROM-base.smc",d.state?.ui||{},d.base?.profile||null);';
if(!html.includes(apply))throw new Error('Não encontrei studioCore().applyProject para antecipar a preparação tática.');
html=html.replaceAll(late,'');
html=html.replace(apply,apply+'\n  // Git safety: preparar 4 MiB + banco seletor ANTES de restaurar teamsV1.\n  // Assim nenhuma tática específica de equipe é escrita no pool compartilhado de 2 MiB.\n  if(activeRomProfile?.id==="iss-deluxe-plus")await studioAutoPreparePlusTactics();');

const marker='isssd-git-tactical-project-safety-v1';
if(!html.includes(marker)){
 const runtime=`\n<script type="module" id="${marker}">\n(()=>{\n const prior=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;\n window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(obj){\n  obj=prior?.(obj)||obj;\n  if(!obj?.state?.semantic||obj?.base?.profile!==\"iss-deluxe-plus\")return obj;\n  const core=window.__ISSD_CORE__;\n  const st=core?.tacticalPreparationStatus?.()||{};\n  const ex=core?.plusExpansionOnlyStatus?.()||{};\n  const body=Number(ex.bodyLength)||0;\n  const prepared=!!st.active;\n  obj.state.semantic.plusPreparationV1={\n   schema:\"isssd-plus-preparation-v1\",version:1,\n   expanded4MiB:body===0x400000||Number(st.expansion)>=4,\n   bodyLength:body||0x400000,\n   expansionMode:Number(st.expansion)||4,\n   tacticsIndividualized:prepared\n  };\n  obj.state.semantic.historicalNationalTeamsV1=obj.state.semantic.historicalNationalTeamsV1||{\n   schema:\"isssd-historical-national-teams-v1\",version:1,appliedTeamIds:[8,30,31],source:\"project-data/historical-national-teams-v1.json\"\n  };\n  if(prepared)obj.state.targetLength=Math.max(Number(obj.state.targetLength)||0,(Number(obj.base.headerSize)||0)+0x400000);\n  return obj;\n };\n})();\n</script>\n`;
 html=html.replace('</body>',runtime+'\n</body>');
}

// Sanity checks: preparation must occur before the first teamsV1 restoration.
const prepPos=html.indexOf('if(activeRomProfile?.id==="iss-deluxe-plus")await studioAutoPreparePlusTactics();');
const restorePos=html.indexOf('studioRestoreTeamsV1(sem.teamsV1)');
if(prepPos<0||restorePos<0||prepPos>restorePos)throw new Error('Ordem insegura: teamsV1 ainda seria restaurado antes da individualização tática.');
if((html.match(/await studioAutoPreparePlusTactics\(\)/g)||[]).length!==1)throw new Error('Preparação tática automática deve ocorrer exatamente uma vez ao abrir projeto.');

fs.writeFileSync(htmlPath,html,'utf8');
console.log('ISSSD Studio: segurança tática aplicada — 4 MiB/individualização antes de teamsV1; metadados preservados no .issdproj.');
