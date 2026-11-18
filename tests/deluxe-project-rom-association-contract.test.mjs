import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../deluxe-editor/app.mjs',import.meta.url),'utf8');
const romHandler=source.split("$('rom').onchange=async()=>{")[1]?.split("$('rom').addEventListener('cancel'")[0];
const projectHandler=source.split("$('load').onchange=async()=>{")[1]?.split("$('export').onclick=")[0];
const saveHandler=source.split("$('save').onclick=async()=>{")[1]?.split("$('load').onchange=")[0];
const exportHandler=source.split("$('export').onclick=async()=>{")[1]?.split("\n};")[0];

test('ROM + projeto são associados pela identidade da base, sem aplicar alterações durante abertura',()=>{
 assert.ok(romHandler?.includes("await createDeluxeProject(bytes)"));
 assert.ok(romHandler?.includes("pending.base?.sha256!==p.base.sha256"));
 assert.ok(!romHandler?.includes('buildDeluxeProject('));
 assert.ok(projectHandler?.includes('await createDeluxeProject(current)'));
 assert.ok(projectHandler?.includes('p.base?.sha256!==romProject.base.sha256'));
 assert.ok(!projectHandler?.includes('buildDeluxeProject('));
});
test('salvar projeto não requer exportar ROM; exportação continua validada',()=>{
 assert.ok(saveHandler?.includes('JSON.stringify(project,null,2)'));
 assert.ok(!saveHandler?.includes('buildDeluxeProject('));
 assert.ok(source.includes("const result=await buildDeluxeProject(file,project)"));
});
