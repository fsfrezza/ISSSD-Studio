// Report the mandatory project target while semantic opening keeps the input
// ROM pristine. Never pretend the source file itself has been expanded.
(()=>{
 const original=renderExpansion;
 renderExpansion=function(){
  original();
  if(!rom||activeRomProfile?.id!=='iss-deluxe-plus'||expansionMode()===8)return;
  const set=(id,value)=>{const node=document.getElementById(id);if(node)node.textContent=value};
  set('expansionCurrentSize','4 MiB');
  set('expansionFormat','LoROM expandida');
  set('expansionFreeNow','2 MiB');
  set('expansionCompatibility','ampla / ZSNES');
  set('expansionBadge','4 MiB');
  set('expansionStateBadge','4 MiB · obrigatório');
  set('expansionStatus','Formato de 4 MiB e táticas individuais definidos automaticamente para o projeto. A geração aplica essa preparação à ROM exportada; a ROM-base permanece intacta ('+expansionFmtBytes(expansionBodySize())+').');
  set('expand4Btn','4 MiB · aplicado ao projeto');
  document.getElementById('expand4Btn').disabled=true;
  set('expand8Btn','8 MiB · experimental');
  document.getElementById('expand8Btn').disabled=true;
  for(const size of [2,4,8])document.getElementById('expMode'+size+'Card')?.classList.toggle('current',size===4);
  for(const id of ['expansionBadge','expansionStateBadge'])document.getElementById(id).className='badge ok';
  document.getElementById('expansionStatus').className='note ok expansion-status';
  document.getElementById('dot-expansion')?.classList.add('on');
  const page=document.getElementById('page-expansion');
  const intro=page?.querySelector('.pagehead p');
  if(intro)intro.textContent='O projeto Plus utiliza obrigatoriamente 4 MiB LoROM e táticas individuais.';
  const metric=document.getElementById('expansionCurrentSize')?.previousElementSibling;
  if(metric)metric.textContent='Tamanho da ROM gerada';
  const extra=document.getElementById('expansionFreeNow')?.previousElementSibling;
  if(extra)extra.textContent='Espaço acrescentado na geração';
  const detail=document.getElementById('expMode4Card')?.querySelector('.subtle');
  if(detail)detail.textContent='Preparação automática incluída na geração da ROM. Não é necessário executar uma etapa manual.';
  const subtitle=page?.querySelector('.sectionbar .subtle');
  if(subtitle)subtitle.textContent='Formato obrigatório do projeto. O arquivo da ROM-base é preservado.';
 };
})();
