import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const src=await readFile(join(here,'..','editor-src','visual-bridge-overrides.mjs'),'utf8');

test('Visual Bridge rehydrates canonical project text state after legacy repaint',()=>{
  for(const token of [
    'textWorkspaceV2',
    'ISSSDTextWorkspace?.restore',
    '__ISSSD_PREKICK_TEXTS__?.restore',
    'ISSSDTextIntentions?.restore',
    'data-profile-text',
    'data-pk-id',
    'data-mm-real',
    'st612_',
    'romInternalTitle',
    '__ISSSD_ROM_META_WRITE_TITLE__',
    "id==='projectFile'"
  ]) assert.ok(src.includes(token),`missing project hydration token: ${token}`);
});
