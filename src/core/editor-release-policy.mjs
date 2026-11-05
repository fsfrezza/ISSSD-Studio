// Experimental ROM builders are intentionally separate from the Editor release gate.
export function assertEditorReleasedRules(project,{selectedAreas=null}={}){
 const rules=project?.state?.semantic?.specialRulesV1;
 if(selectedAreas&&!selectedAreas.includes('melhorias-jogo'))return;
 if(rules?.goalkeeperBackpassNoHands===true&&rules.goalkeeperBackpassPunishment==='free-kick')throw Error('Tiro livre por recuo está em testes e temporariamente bloqueado no Editor. Use a ROM de teste direta. Para exportar pelo Editor, escolha Pênalti ou desmarque a correção do recuo. A escolha importada continua preservada no projeto.');
}
