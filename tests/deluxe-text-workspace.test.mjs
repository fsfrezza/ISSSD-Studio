import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchesTextField} from '../deluxe-editor/text-workspace.mjs';
import {isOriginalText} from '../src/core/deluxe-text-presets.mjs';

test('text search is accent insensitive and checks original, current and suggested translation',()=>{
 const field={label:'Cobrança',key:'freeKick',original:'FREE KICK',value:'FALTA',portuguese:'TIRO LIVRE',invalid:false};
 for(const query of ['cobranca','free kick','falta','tiro livre','cobranca falta'])assert.equal(matchesTextField(field,query),true);
 assert.equal(matchesTextField(field,'escanteio'),false);
 assert.equal(matchesTextField(field,'','changed'),true);
 assert.equal(matchesTextField(field,'','original'),false);
 assert.equal(matchesTextField(field,'','invalid'),false);
 assert.equal(matchesTextField({...field,invalid:true},'','invalid'),true);
});
test('missing-only presets distinguish untouched text from custom changes including empty strings',()=>{
 const field={original:'FREE KICK',path:['menuTexts','match','freeKick']};
 assert.equal(isOriginalText({},field),true);
 assert.equal(isOriginalText({menuTexts:{match:{freeKick:'FREE KICK'}}},field),true);
 assert.equal(isOriginalText({menuTexts:{match:{freeKick:'PERSONALIZADO'}}},field),false);
 assert.equal(isOriginalText({menuTexts:{match:{freeKick:''}}},field),false);
});
