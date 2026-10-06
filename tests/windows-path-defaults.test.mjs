import test from 'node:test';
import assert from 'node:assert/strict';
import {WINDOWS_PATH_DEFAULTS,resolveWindowsPathDefaults} from '../src/platform/windows-path-defaults.mjs';

test('Windows defaults preserve the historical monolithic Studio folder layout',()=>{
  assert.deepEqual(WINDOWS_PATH_DEFAULTS,{
    romDirectory:'C:\\Users\\fsfre\\Downloads\\ISSSD-Studio\\roms',
    projectDirectory:'C:\\Users\\fsfre\\Downloads\\ISSSD-Studio',
  });
  assert.equal(Object.isFrozen(WINDOWS_PATH_DEFAULTS),true);
});

test('Windows path defaults can be overridden without mutating canonical defaults',()=>{
  const resolved=resolveWindowsPathDefaults({
    romDirectory:'D:\\ROMs',
    projectDirectory:'D:\\ISSSD Projects',
  });
  assert.deepEqual(resolved,{romDirectory:'D:\\ROMs',projectDirectory:'D:\\ISSSD Projects'});
  assert.equal(WINDOWS_PATH_DEFAULTS.romDirectory,'C:\\Users\\fsfre\\Downloads\\ISSSD-Studio\\roms');
});

test('blank overrides fall back to canonical defaults',()=>{
  assert.deepEqual(resolveWindowsPathDefaults({romDirectory:'  ',projectDirectory:''}),WINDOWS_PATH_DEFAULTS);
});
