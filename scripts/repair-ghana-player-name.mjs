import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {encodeFixedPlayerName} from '../src/core/plus-player-name.mjs';

export function repairGhanaPlayerName(project){
 const player=project?.state?.semantic?.teamsV1?.teams?.['46']?.players?.find(p=>p.playerId==='46:8'&&p.baseSlot===8);
 if(!player?.custom)throw Error('Registro 46:8 de Gana não encontrado. Nenhuma alteração aplicada.');
 const custom=player.custom;
 if(!['Pele',"Pele'",'Pele’','AbediPel','Abedi P.'].includes(custom.name))throw Error('O registro tem outro nome. Nenhuma alteração aplicada.');
 const hex=Buffer.from(encodeFixedPlayerName('Abedi P.')).toString('hex').toUpperCase();
 const changed=custom.name!=='Abedi P.'||custom.nameHex!==hex;
 custom.name='Abedi P.';custom.nameHex=hex;
 return changed;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const path=resolve(process.argv[2]||'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj');
 const raw=readFileSync(path,'utf8'),project=JSON.parse(raw.replace(/^\uFEFF/,''));
 if(repairGhanaPlayerName(project)){
  const backup=path+'.before-abedipel-'+Date.now()+'.bak';
  copyFileSync(path,backup);
  writeFileSync(path,JSON.stringify(project,null,2)+'\n');
  console.log('Gana: Abedi P.; nameHex=688386858A007754. Backup: '+backup);
 }else console.log('Gana já contém Abedi P. com os bytes corretos.');
}
