import fs from 'node:fs';
const file=new URL('../editor/ISSSD-Studio.html',import.meta.url);
let html=fs.readFileSync(file,'utf8');
// Restrict the repair to native group editing. Structural experiments stay separate.
for(const name of ['writePlusGroups','plusComposeGroupsUiToCopy','importPlusGroupsFile']){
 const start=html.indexOf('function '+name+'(');if(start<0)throw new Error('Grupos: função ausente '+name);
 const next=html.indexOf('\nfunction ',start+10),asyncNext=html.indexOf('\nasync function ',start+10);
 const end=Math.min(...[next,asyncNext,html.indexOf('</script>',start)].filter(v=>v>=0));
 let body=html.slice(start,end);
 body=body.replace(/^.*\{off:globalThis\.__ISSSD_FILE_OFFSET__\(effectiveSecret(?:Terminator|Count)\(\)\),bytes:.*\n/gm,'');
 body=body.replace(/^.*out\[globalThis\.__ISSSD_FILE_OFFSET__\(effectiveSecret(?:Terminator|Count)\(\)\)\]=.*\n/gm,'');
 html=html.slice(0,start)+body+html.slice(end);
}
fs.writeFileSync(file,html);
console.log('ISSSD Studio: organização nativa dos grupos preserva DATA_81E82E; não grava contador secreto inexistente.');
