import test from 'node:test';
import assert from 'node:assert/strict';
import {assertCurrentEditorFeatures} from '../scripts/lib/editor-feature-readiness.mjs';
test('server refuses stale generated Editor even when backend supports independent teams',()=>{
 assert.throws(()=>assertCurrentEditorFeatures('<html><body>old</body></html>'),/seis equipes GG ausente/);
 const current='<script id="isssd-independent-teams">window.__ISSSD_INDEPENDENT_TEAMS_EDITOR__={};window.__ISSSD_PROJECT_TEAM_RECORDS_GUARD__="v1";window.__ISSSD_ALL_FLAGS_EDITOR__={};window.__ISSSD_INSTALL_UNIFIED_TEAM_CORE__=()=>{}</script>';
 assert.doesNotThrow(()=>assertCurrentEditorFeatures(current));
 const old=String.fromCharCode(71,79,83,80,69,76,45,71,79,76);
 assert.throws(()=>assertCurrentEditorFeatures(current+'<button>Adicionar '+old+'</button>'),/extensão de equipes removida/);
});
