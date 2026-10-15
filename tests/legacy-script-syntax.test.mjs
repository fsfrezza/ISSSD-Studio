import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {normalizeLegacyScripts} from '../src/ui/normalize-legacy-scripts.mjs';

test('repairs recovered literal-newline script without rewriting normal script strings',()=>{
 const escaped='<script id="isssd-v673-save-flow-capture-fix">\\n(()=>{\\nconst x=1;\\n})();</script>';
 const normal='<script>const s="a\\nb";</script>';
 const out=normalizeLegacyScripts(escaped+normal);
 assert.ok(out.endsWith(normal));
 assert.doesNotThrow(()=>new vm.Script(out.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]));
 assert.equal(normalizeLegacyScripts(out),out);
});

test('closes historical history filter before workspace processing and finally',()=>{
 const body=`/* v6.64 — fluxo confirmado: */
 async function save(){try{if(history){for(const ch of []){romRef.set(new Uint8Array(ch.old),ch.off)}if(wsBackup){} }finally{}}`;
 assert.throws(()=>new vm.Script(body));
 const out=normalizeLegacyScripts('<script>'+body+'</script>');
 assert.doesNotThrow(()=>new vm.Script(out.slice(8,-9)));
 assert.equal(normalizeLegacyScripts(out),out);
});

test('HTML insertion keeps replacement tokens inside the visual import module literal',async()=>{
 const fs=await import('node:fs');
 const build=fs.readFileSync(new URL('../scripts/build-editor.mjs',import.meta.url),'utf8');
 const open=fs.readFileSync(new URL('../scripts/patch-project-open-semantic-only.mjs',import.meta.url),'utf8');
 assert.ok(build.includes("html.replace('</body>',()=>patch+'\\n</body>')"));
 assert.ok(open.includes('html.replace(moduleRx,()=>canonicalModule)'));
 const module=fs.readFileSync(new URL('../editor-src/project-import-v11.mjs',import.meta.url),'utf8');
 assert.ok(module.includes('$&'));
 const tag='<script type="module">'+module+'</script>';
 const html='<body></body>'.replace('</body>',()=>tag+'</body>');
 assert.equal(html.slice(6,6+tag.length),tag);
 assert.doesNotThrow(()=>new vm.Script(module));
});
