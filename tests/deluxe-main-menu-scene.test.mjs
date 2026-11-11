import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {deluxeMenuWallpaper,deluxeMainMenuScene} from '../src/core/deluxe-main-menu-scene.mjs';
import {splitRom} from '../src/core/deluxe-project.mjs';
const fixture=process.env.ISSSD_DELUXE_ROM;
test('main menu scene decodes native wallpaper and composites dynamic labels without changing the ROM',{skip:!fixture},()=>{
 const base=splitRom(new Uint8Array(fs.readFileSync(fixture))).rom,snapshot=base.slice(),wall=deluxeMenuWallpaper(base),original=deluxeMainMenuScene(base),edited=deluxeMainMenuScene(base,{texts:{openGame:'TESTE'},scale:80});
 assert.equal(wall.length,256*224*4);assert.deepEqual(Array.from(wall.slice(0,4)),[16,48,160,255]);assert.equal(new Set(Array.from(wall).filter((_,i)=>i%4===3)).size,1);
 assert.notDeepEqual(original.rgba,edited.rgba);let differences=0;
 for(let y=0;y<224;y++)for(let x=0;x<256;x++)for(let c=0;c<4;c++){const at=(y*256+x)*4+c;if(original.rgba[at]!==edited.rgba[at]){differences++;assert.ok(x>=7&&x<122&&y>=24&&y<74,'label edit escaped its panel');}if(y<24)assert.equal(original.rgba[at],wall[at]);}
 assert.ok(differences>0);assert.deepEqual(base,snapshot);
 const selected=deluxeMainMenuScene(base,undefined,1);assert.notDeepEqual(original.rgba,selected.rgba);for(let y=80;y<224;y++)for(let x=0;x<256;x++)for(let c=0;c<4;c++)assert.equal(original.rgba[(y*256+x)*4+c],selected.rgba[(y*256+x)*4+c]);
 assert.throws(()=>deluxeMainMenuScene(base,undefined,8),/Seleção/);
});
