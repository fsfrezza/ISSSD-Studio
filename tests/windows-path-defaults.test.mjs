import test from 'node:test';
import assert from 'node:assert/strict';
import {WINDOWS_PATH_DEFAULTS,resolveWindowsPathDefaults} from '../src/platform/windows-path-defaults.mjs';

test('Windows defaults preserve the unified Studio folder layout and canonical filenames',()=>{
  assert.deepEqual(WINDOWS_PATH_DEFAULTS,{
    romDirectory:'C:\\Users\\fsfre\\Downloads\\ISSSD-Studio-UNIFICADO\\roms',
    projectDirectory:'C:\\Users\\fsfre\\Downloads\\ISSSD-Studio-UNIFICADO',
    romFileName:'International Superstar Soccer Deluxe Plus.sfc',
    projectFileName:'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj',
  });
  assert.equal(Object.isFrozen(WINDOWS_PATH_DEFAULTS),true);
});

test('Windows defaults can be overridden without mutating canonical defaults',()=>{
  const resolved=resolveWindowsPathDefaults({
    romDirectory:'D:\\ROMs',
    projectDirectory:'D:\\ISSSD Projects',
    romFileName:'custom.sfc',
    projectFileName:'custom.issdproj',
  });
  assert.deepEqual(resolved,{
    romDirectory:'D:\\ROMs',
    projectDirectory:'D:\\ISSSD Projects',
    romFileName:'custom.sfc',
    projectFileName:'custom.issdproj',
  });
  assert.equal(WINDOWS_PATH_DEFAULTS.romDirectory,'C:\\Users\\fsfre\\Downloads\\ISSSD-Studio-UNIFICADO\\roms');
  assert.equal(WINDOWS_PATH_DEFAULTS.romFileName,'International Superstar Soccer Deluxe Plus.sfc');
});

test('blank overrides fall back to canonical defaults',()=>{
  assert.deepEqual(resolveWindowsPathDefaults({
    romDirectory:'  ',
    projectDirectory:'',
    romFileName:' ',
    projectFileName:'',
  }),WINDOWS_PATH_DEFAULTS);
});
