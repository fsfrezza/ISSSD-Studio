import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'.editor-vendor','legacy-ui','ISSSD-Studio.html');

if(!fs.existsSync(source)){
  throw new Error([
    'Fonte canônica local do Editor ausente: '+source,
    'Build interrompido para não selecionar silenciosamente outra cópia histórica.',
    'Restaure .editor-vendor/legacy-ui/ISSSD-Studio.html a partir da cópia local já usada pelo projeto.'
  ].join('\n'));
}

const html=fs.readFileSync(source,'utf8');
const required=[
  'async function studioDoSave(options={})',
  'function studioDownloadFile(bytes,name,type="application/octet-stream")',
  'let output=studioBuildRomForDownload({graphics:explicitGraphics});',
  'studioDownloadFile(output,`ISSSD-STUDIO-BUILD-${profile}.smc`);'
];
for(const needle of required){
  if(!html.includes(needle))throw new Error('Fonte canônica do Editor incompatível; marcador ausente: '+needle);
}

const generatedMarkers=[
  'ISSSD_GIT_AUTOMATED_VISUAL_BRIDGE',
  'ISSSD_BRAZIL_FINAL_ROM_MIRROR_V3',
  'ISSSD_BRAZIL_FINAL_ROM_MIRROR_V4',
  'ISSSD_BRAZIL_FINAL_ROM_MIRROR_V5',
  '__ISSSD_FINAL_BLOB_V4__',
  "fetch('/__isssd/finalize-plus-rom'"
];
for(const marker of generatedMarkers){
  if(html.includes(marker))throw new Error('Fonte canônica do Editor contém patch gerado/experimental e não pode ser usada como baseline: '+marker);
}

console.log('ISSSD Studio: fonte local do Editor verificada.');
console.log('  baseline: '+source);
console.log('  fluxo esperado presente: studioDoSave -> output -> studioDownloadFile');
