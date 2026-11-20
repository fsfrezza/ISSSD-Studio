import test from 'node:test';
import assert from 'node:assert/strict';
import {overviewFacts,renderOverview,adjacentTeam} from '../deluxe-editor/overview.mjs';

test('overview reports the loaded project without claiming an ungenerated expansion',()=>{
 const base={id:'deluxe-usa',size:2097152};
 assert.equal(overviewFacts(null),null);
 assert.deepEqual(overviewFacts({base,changes:{}}),{base:'Deluxe original (USA)',size:'2 MB',teams:36,players:720,groups:6,secret:0,improvements:0});
 const project={base,changes:{structure:{teams:Array(60),groups:Array(9),secret:Array(6)},improvements:['one','two']}};
 const original=JSON.stringify(project);assert.deepEqual(overviewFacts(project),{base:'Deluxe original (USA)',size:'2 MB',teams:60,players:1200,groups:9,secret:6,improvements:2});assert.equal(JSON.stringify(project),original);
 const nodes=new Map();const doc={getElementById:id=>{if(!nodes.has(id))nodes.set(id,{});return nodes.get(id);}};
 renderOverview(doc,project);assert.equal(nodes.get('overview-teams').textContent,'60');assert.match(nodes.get('overview-note').textContent,/durante a geração/);
 renderOverview(doc,null);assert.equal(nodes.get('overview-teams').textContent,'—');
});
test('team navigation wraps in both directions and supports an empty catalog',()=>{
 assert.equal(adjacentTeam(0,36,-1),35);assert.equal(adjacentTeam(59,60,1),0);assert.equal(adjacentTeam(19,60,1),20);assert.equal(adjacentTeam(0,0,1),0);
});
