(()=>{
 const core=window.ISSSDPlayerColors;let saved=core.validatePlayerColors(null);
 const copy=v=>JSON.parse(JSON.stringify(v));
 const previousFinalize=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;
 window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(p){previousFinalize?.(p);if(p?.state?.semantic)p.state.semantic.playerColorsV1=copy(saved);return p;};
 const previousRestore=window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__;
 window.__ISSSD_GIT_REAPPLY_PROJECT_STATE__=function(p){const next=core.validatePlayerColors(p?.state?.semantic?.playerColorsV1);const result=previousRestore?.(p);saved=next;return result;};
 const apply=window.studioApplyProjectWithBase;
 if(typeof apply==='function')window.studioApplyProjectWithBase=async function(p,...args){const next=core.validatePlayerColors(p?.state?.semantic?.playerColorsV1),previous=saved;saved=next;try{return await apply.call(this,p,...args);}catch(e){saved=previous;throw e;}};
 window.__ISSSD_PLAYER_COLORS_EDITOR__={get:(team,slot)=>copy(saved.players[team+':'+slot]??null),set(team,slot,value){const next=copy(saved);if(value===null)delete next.players[team+':'+slot];else next.players[team+':'+slot]=value;saved=core.validatePlayerColors(next);window.studioUpdateBadge?.();},transfer(source,target,mode='copy'){
  if(!['copy','swap'].includes(mode))throw Error('Transferência de cores inválida.');
  const a=source.team+':'+source.identity.baseSlot,b=target.team+':'+target.identity.baseSlot,next=copy(saved),av=next.players[a],bv=next.players[b];
  if(av)next.players[b]=copy(av);else delete next.players[b];
  if(mode==='swap'){if(bv)next.players[a]=copy(bv);else delete next.players[a];}
  saved=core.validatePlayerColors(next);
 },snapshot:()=>copy(saved)};
})();
