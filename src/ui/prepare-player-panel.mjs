// Build-time retirement of temporary player tools; preserve the private baseline.
export function preparePlayerPanel(html){
 const start=html.indexOf('<div class="player-font-test">');
 if(start>=0){const end=html.indexOf('<div class="note info" id="playerAttrMapNote"',start);if(end<0)throw Error('Fim do teste de fonte do jogador não encontrado.');html=html.slice(0,start)+html.slice(end);}
 for(const id of ['playerGlyphTestBtn','playerGlyphRestoreBtn'])html=html.replace(new RegExp('\\$\\(["\\\']'+id+'["\\\']\\)\\.onclick=[^;]+;','g'),'');
 html=html.replace(/<div class="note info" id="plusPlayerDiagVisibleBox"[^>]*>[\s\S]*?<\/button>\s*<\/div>/,
 '<div id="selectedPlayerViews" class="selected-player-views" aria-label="Vistas do jogador selecionado"></div><p id="selectedPlayerViewsStatus" class="subtle" role="status"></p>');
 html=html.replace(/function exportPlusPlayerDiagnostic\(\)\{[\s\S]*?\n\}\s*const plusPlayerDiagBtn=[^\n]*/,'');
 const selectAt=html.indexOf('<select id="playerTeamSelect">'),begin=html.lastIndexOf('<div style="margin-bottom:10px">',selectAt),end=html.indexOf('<div class="card">',selectAt);
 if(selectAt>=0&&begin>=0&&end>begin){
  const original=html.slice(begin,end),team=original.match(/<select id="playerTeamSelect">[\s\S]*?<\/select>/)?.[0],player=original.match(/<select class="player-select" id="playerSelect">[\s\S]*?<\/select>/)?.[0];
  if(!team||!player)throw Error('Seletores do elenco não encontrados.');
  html=html.slice(0,begin)+'<div class="sectionbar"><h3>Elenco</h3><span class="badge">20 slots</span></div><div class="player-roster-selectors"><label>Equipe'+team+'</label><label>Jogador'+player+'</label></div><div class="subtle" style="margin-top:6px">Formato: número - nome. A ordem dos slots da ROM é preservada.</div></div>\n'+html.slice(end);
 }
 return html;
}
