import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {INDEPENDENT_PHOTO_DIRECTORIES,independentPhotoDirectory} from '../src/core/plus-independent-teams.mjs';
import {validateIndependentTeams} from '../src/core/independent-teams.mjs';
const project=JSON.parse(fs.readFileSync(new URL('../International-Superstar-Soccer-Deluxe-Plus-projeto-recuperado.issdproj',import.meta.url)));
const model=project.state.semantic.independentTeamsV1;
test('selection photo directories cover all sixty teams with byte-indexed overlays and independent accessory pointers',()=>{
 const native=new Uint8Array(0x20000),data=Object.fromEntries(Object.entries(model.teams).map(([id,t])=>[id,structuredClone(t.data)]));
 assert.deepEqual(INDEPENDENT_PHOTO_DIRECTORIES.map(([k,a,s])=>[k,a,s]),[['bodyType',0xFD5E,1],['faceType',0xFB99,1],['overlayType',0xFBD1,1],['extraType',0xFC09,1],['accessory',0x17970,2],['formationFlags',0xFE78,1]]);
 // Read through the actual native index convention: LSR before byte selectors,
 // doubled team ID for the word accessory directory (85:B118).
 for(const[key,address,stride,fallback]of INDEPENDENT_PHOTO_DIRECTORIES){
  for(let id=0;id<54;id++){native[address+id*stride]=id+1;if(stride===2)native[address+id*stride+1]=0x90;}
  const bytes=independentPhotoDirectory(native,data,key,address,stride,fallback);assert.equal(bytes.length,60*stride);
  assert.deepEqual(bytes.slice(0,54*stride),native.slice(address,address+54*stride));
  for(let id=54;id<60;id++){const value=bytes[id*stride]|(stride===2?bytes[id*stride+1]<<8:0);assert.equal(value,data[id].photo[key]);}
  data[56].photo[key]=stride===2?0xABCD:0x34;
  const edited=independentPhotoDirectory(native,data,key,address,stride,fallback);
  assert.deepEqual(edited.slice(0,56*stride),bytes.slice(0,56*stride));assert.deepEqual(edited.slice(57*stride),bytes.slice(57*stride));
 }
});
test('old projects without the added photo fields use bounded empty overlays, while invalid fields are rejected',()=>{
 const value=structuredClone(model);for(const t of Object.values(value.teams))for(const k of ['overlayType','extraType','accessory','formationFlags'])delete t.data.photo[k];assert.ok(validateIndependentTeams(value));
 const data=Object.fromEntries(Object.entries(value.teams).map(([id,t])=>[id,t.data]));
 for(const[key,address,stride,fallback]of INDEPENDENT_PHOTO_DIRECTORIES.slice(2)){const bytes=independentPhotoDirectory(new Uint8Array(0x20000),data,key,address,stride,fallback);for(let id=54;id<60;id++)assert.equal(bytes[id*stride]|(stride===2?bytes[id*stride+1]<<8:0),fallback);}
 for(const[k,v]of [['overlayType',256],['extraType',-1],['accessory',65536],['formationFlags',1.5]]){const bad=structuredClone(model);bad.teams[56].data.photo[k]=v;assert.throws(()=>validateIndependentTeams(bad),/Composição da foto/);}
});
