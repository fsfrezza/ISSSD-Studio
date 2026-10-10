import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'project-source','canonical');

function loadCanonical(){
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
  const joined=manifest.parts.map(name=>fs.readFileSync(path.join(dir,name),'utf8').trim()).join('');
  const raw=zlib.gunzipSync(Buffer.from(joined,'base64'));
  const sha=crypto.createHash('sha256').update(raw).digest('hex');
  assert.equal(sha,manifest.sha256,'canonical project SHA-256 mismatch');
  return {manifest,project:JSON.parse(raw.toString('utf8'))};
}

test('canonical Plus project source is complete and deterministic',()=>{
  const {manifest,project}=loadCanonical();
  assert.equal(manifest.parts.length,8);
  const sem=project.state.semantic;
  assert.equal(sem.romInternalTitle,'INTERNETSSSUCKERRELAX');
  assert.equal(sem.romInternalTitleDesired,'INTERNETSSSUCKERRELAX');
  assert.equal(sem.titleScreen.stripeTint,'#00FFD5');
  assert.ok(sem.titleScreen.dirtyPalettes.includes('Faixa vermelha'));
  assert.equal(sem.textWorkspaceV2.sections.mainMenu.values.openGame,'JOGATINA');
  assert.equal(sem.textWorkspaceV2.sections.graphicIntents.values['strategy.screen.v614.offtrap'],'LINHA DE IMPEDIMENTO');
  assert.equal(Object.keys(project.state.titleComposerV2.assets||{}).length,7);
});

test('canonical Plus project includes the 20 altered Brazil player names',()=>{
  const {project}=loadCanonical();
  const team=project.state.semantic.teamsV1.names.teams['30'];
  assert.equal(team.teamName,'Brasil');
  const names=(team.players||[]).sort((a,b)=>a.slot-b.slot).map(p=>p.name);
  assert.deepEqual(names,[
    'Taffarel','Cafu','Aldair','Thiago S','R.Carlos','Falcao','Didi','Pele\'',
    'R.Gaucho','Ronaldo','Garrinch','Gilmar N','Djalma S','Domingos','Nilton S',
    'Gerson','Zico','Rivaldo','Neymar','Romario'
  ]);
  assert.ok(team.players.every(p=>!Object.prototype.hasOwnProperty.call(p,'attrHex')),
    'canonical name overrides must not carry attribute changes');
});
