const pages={
 overview:['Visão geral','Abra a ROM original ou continue um projeto.'],
 menu:['Menu principal','Personalize os nomes e confira a tipografia na prévia.'],
 texts:['Textos','Edite as frases do jogo, organizadas por tela.'],
 cursor:['Cursor','Personalize as instruções dos controles e da seleção de jogadores.'],
 stadiums:['Estádios','Ajuste as cores das paletas dos oito estádios originais.'],
 improvements:['Melhorias','Recursos opcionais para o Deluxe.'],
};
const panels=[...document.querySelectorAll('[data-panel]')],buttons=[...document.querySelectorAll('[data-page]')];
let active='overview';
function selectPage(id){
 if(!Object.hasOwn(pages,id))return;
 active=id;
 for(const panel of panels)panel.hidden=panel.dataset.panel!==id;
 for(const button of buttons){if(button.dataset.page===id)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
 document.getElementById('pageTitle').textContent=pages[id][0];
 document.getElementById('pageDescription').textContent=pages[id][1];
 const empty=id==='improvements';
 document.getElementById('expandAll').disabled=empty;document.getElementById('collapseAll').disabled=empty;
}
for(const button of buttons)button.addEventListener('click',()=>selectPage(button.dataset.page));
function setExpanded(open){const panel=panels.find(p=>p.dataset.panel===active);if(panel)for(const section of panel.querySelectorAll('details'))section.open=open;}
document.getElementById('expandAll').addEventListener('click',()=>setExpanded(true));
document.getElementById('collapseAll').addEventListener('click',()=>setExpanded(false));
selectPage('overview');
