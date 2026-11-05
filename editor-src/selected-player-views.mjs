// Runs in the native editor scope so selection and semantic player state agree.
function renderSelectedPlayerViews(){
 const host=$('selectedPlayerViews'),status=$('selectedPlayerViewsStatus');if(!host)return;host.replaceChildren();
 const api=window.ISSSDPlayerSpriteCore,U=window.ISSSDUniforms,G=window.ISSSDGoalkeepers,A=window.ISSSDPlayerAppearanceCore;
 if(!rom||activeRomProfile?.id!=='iss-deluxe-plus'||!api||!U||!G){if(status)status.textContent='Carregue a ROM Plus para visualizar o jogador.';return;}
 try{
  const player=teams[currentTeam]?.players?.[currentPlayer];if(!player)return;
  const independent=window.__ISSSD_UNIFIED_TEAM_CORE__,own=independent?.is(currentTeam),slot=player.baseSlot??currentPlayer+1,keeper=nativeAppearanceIsGoalkeeper(player),base=window.__ISSSD_PREKICK_HOST__?.rom?.()||rom;
  const spriteEdits=window.__ISSSD_TEAMS_PROJECT_OVERLAY_V1__?.spriteEdits,uniforms=window.__ISSSD_UNIFORMS_EDITOR__?.snapshot();let palette,views;
  if(keeper){
   palette=[0,...(own?independent.keeperColors(currentTeam,slot):G.projectGoalkeeperPalette(base,window.__ISSSD_GOALKEEPERS_EDITOR__?.snapshot(),currentTeam,slot)),0,0,0,0];
   const directions=api.goalkeeperDirectionalViews(base,{step:0});views=['S','N','E'].map(id=>directions.find(v=>v.id===id));
  }else{
   const appearance=player.appearance||player,paletteIndex=Number(appearance.palette??player.palette)||0;
   const value=own?{colors:independent.kitColors(currentTeam,0)}:U.readUniform(base,uniforms,currentTeam,0);palette=value.colors.slice();
   const native=own?independent.team(currentTeam).data.appearance?.[paletteIndex]:A.readNativeAppearancePalettes(base,currentTeam).palettes[paletteIndex];if(native)palette.splice(1,6,...native.slice(1,7));
   const choice=window.__ISSSD_PLAYER_COLORS_EDITOR__?.get(currentTeam,slot);if(choice&&window.ISSSDPlayerColors)palette=window.ISSSDPlayerColors.applyAppearanceChoice(palette,choice);
   const hair=Number(appearance.hair??player.hair)||0,pattern=own?independent.pattern(currentTeam):Number.isInteger((value.layout-0xC5D4)/256)?U.readJerseyPattern(base,uniforms,(value.layout-0xC5D4)/256):Array(512).fill(0),jersey=U.encodeJerseyPattern(pattern);
   views=['Down','Up','Side'].map(prefix=>{const record=api.PLAYER_BODY_CATALOG.find(r=>r.name===prefix+'_Running1'),pose=api.PLAYER_POSE_CATALOG.find(p=>p.body===record?.id);if(!pose)throw Error('Vista nativa indisponível.');return api.renderPlayerReference(base,{kind:'body',id:pose.body},spriteEdits,{pose,style:hair,jersey});});
  }
  views.forEach((view,i)=>{
   if(!view||view.available===false)throw Error('Vista nativa indisponível.');
   const figure=document.createElement('figure'),canvas=document.createElement('canvas'),caption=document.createElement('figcaption'),label=['Frente','Costas','Perfil'][i];caption.textContent=label;canvas.setAttribute('aria-label',(player.name||'Jogador')+' · '+label);canvas.width=64;canvas.height=64;
   const ctx=canvas.getContext('2d'),image=ctx.createImageData(view.width,view.height);view.pixels.forEach((v,n)=>{if(!v)return;const hex=G.goalkeeperBgrHex(palette[v]??0);for(let c=0;c<3;c++)image.data[n*4+c]=parseInt(hex.slice(1+c*2,3+c*2),16);image.data[n*4+3]=255;});ctx.putImageData(image,Math.floor((64-view.width)/2),60-view.height);figure.append(canvas,caption);host.append(figure);
  });
  if(status)status.textContent=(keeper?'Goleiro':'Jogador')+' selecionado · '+(player.name||'(sem nome)')+(keeper?'':' · uniforme titular');
 }catch(error){host.replaceChildren();if(status)status.textContent='Prévia indisponível: '+error.message;}
}
const selectedPlayerOriginalRender=renderPlayer;
renderPlayer=function(...args){const result=selectedPlayerOriginalRender.apply(this,args);renderSelectedPlayerViews();return result;};
window.__ISSSD_REFRESH_SELECTED_PLAYER_VIEWS__=renderSelectedPlayerViews;
window.addEventListener('load',renderSelectedPlayerViews);
