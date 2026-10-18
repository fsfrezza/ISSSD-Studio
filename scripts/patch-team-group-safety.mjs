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
html=html.replace('Nome lógico do grupo no Studio e nos JSONs.','Nome do grupo no projeto e na ROM. Use letras, números, espaços, ponto ou hífen; a largura é conferida ao exportar.');
html=html.replace('Os títulos gráficos desenhados dentro do jogo (“EUROPE 1”, “AMERICA 1”, “ALL STARS” etc.) continuam sendo assets separados e não são alterados por esta função.','Ao salvar a ROM com Seleção de equipes marcada, os nomes personalizados também são desenhados nos títulos do jogo. A largura disponível é de 64 pixels; nomes que excedam esse espaço precisam ser encurtados.');
html=html.replace('rótulos lógicos do Studio/JSON','nomes salvos no projeto e usados na exportação da ROM');
fs.writeFileSync(file,html);
console.log('ISSSD Studio: organização nativa dos grupos preserva DATA_81E82E; não grava contador secreto inexistente.');
