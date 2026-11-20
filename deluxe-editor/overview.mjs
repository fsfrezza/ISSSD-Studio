/** Project overview: describe the loaded model, not a hypothetical exported ROM. */
export function overviewFacts(project){
 if(!project)return null;
 const changes=project.changes??{},structure=changes.structure;
 const teams=structure?.teams?.length??36;
 return {base:project.base?.id==='deluxe-usa'?'Deluxe original (USA)':(project.base?.id??'ROM reconhecida'),size:project.base?.size?`${project.base.size/1048576} MB`:'—',teams,players:teams*20,groups:structure?.groups?.length??changes.groups?.length??6,secret:structure?.secret?.length??0,improvements:changes.improvements?.length??0};
}

export function renderOverview(doc,project){
 const facts=overviewFacts(project);
 for(const [key,value] of Object.entries(facts??{base:'Nenhuma ROM aberta',size:'—',teams:'—',players:'—',groups:'—',secret:'—',improvements:'—'})){
  const el=doc.getElementById('overview-'+key);if(el)el.textContent=String(value);
 }
 const note=doc.getElementById('overview-note');if(note)note.textContent=facts?'A expansão é determinada durante a geração da ROM; o tamanho acima é o da base original.':'Abra a ROM Deluxe original (USA) para habilitar as ferramentas.';
}

export function adjacentTeam(current,count,step){
 return count>0?(current+step+count)%count:0;
}
