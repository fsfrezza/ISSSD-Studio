// Uniform display and export policy, without mutating the loaded base ROM.
const centeredPlayerOriginalAlign=alignName;
alignName=function(text,mode,manual){return centeredPlayerOriginalAlign(text,activeRomProfile?.id==='iss-deluxe-plus'?'center':mode,manual);};
const centeredPlayerOriginalRender=renderPlayer;
renderPlayer=function(...args){
 const plus=activeRomProfile?.id==='iss-deluxe-plus',player=teams?.[currentTeam]?.players?.[currentPlayer];if(plus&&player)player.align='center';
 const result=centeredPlayerOriginalRender.apply(this,args),select=$('pNameAlign');
 if(plus&&select){select.value='center';select.disabled=true;select.title='Os nomes de todas as equipes são centralizados nos oito espaços da ROM.';}return result;
};
function installCenteredPlayerFinalizer(){
 const prior=window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__;
 window.__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__=function(project){prior?.(project);if(project?.state&&activeRomProfile?.id==='iss-deluxe-plus'){project.state.semantic||={};project.state.semantic.playerNameAlignment='center';}return project;};
}
// Git's project bridge installs its finalizer after the legacy scope. Chain the
// policy only once all initial runtimes have loaded, rather than losing it there.
if(document.readyState==='complete')installCenteredPlayerFinalizer();else window.addEventListener('load',installCenteredPlayerFinalizer,{once:true});
