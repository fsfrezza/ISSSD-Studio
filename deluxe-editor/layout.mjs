const pages={
 tactics:['Táticas e formações','Edite posições, funções e Atacar de forma independente para cada equipe.'],
 'match-announcement':['Anúncio da partida','Edite os rótulos; Brasil, Inglaterra e U.S.A. permanecem como exemplos.'],
 'opening-konami':['Tela 1 · Konami','Substitua a primeira tela por imagem ou vídeo convertido para o SNES.'],
 'opening-international':['Tela 2 · International','Preserve a animação original ou importe sua própria mídia.'],
 'opening-we-love-soccer':['Tela 3 · We Love Soccer','Edite a mídia e os fades da última etapa da abertura.'],
 'open-game':['Tela de Open Game','Edite as três opções e as descrições do tipo de partida.'],
 handicap:['Handicap','Edite os textos da tela de vantagem e confira sua composição.'],
 'pre-match':['Menu pré-partida','Edite os rótulos gráficos de preparação, treino e desafio.'],
 'stadium-screen':['Seleção de estádio','Edite os títulos, os países e as condições da tela de seleção.'],
 teams:['Equipes','Personalize as equipes da estrutura ampliada.'],
 groups:['Grupos','Organize as equipes e os grupos do projeto, incluindo o grupo secreto.'],
 players:['Jogadores','Edite os jogadores das equipes habilitadas no projeto.'],
 overview:['Visão geral','Abra a ROM original ou continue um projeto.\nSalve o projeto para continuar depois ou gere uma cópia da ROM com suas alterações.'],
 'title-screen':['Tela de título','Edite a composição, as cores e os textos da tela anterior ao menu principal.'],
 menu:['Menu principal','Personalize os nomes e confira a tipografia na prévia.'],
 texts:['Textos','Edite as frases do jogo, organizadas por tela.'],
 cursor:['Cursor','Personalize as instruções dos controles e da seleção de jogadores.'],
 stadiums:['Estádios','Ajuste as cores das paletas dos oito estádios originais.'],
 sounds:['Sons e vozes','Ouça, substitua e restaure as amostras de áudio.'],
 improvements:['Melhorias','Recursos da Plus, diferenças para o Deluxe e estado do projeto atual.'],
};
const panels=[...document.querySelectorAll('[data-panel]')],buttons=[...document.querySelectorAll('[data-page]')];
let active='overview';
function selectPage(id){
 if(!Object.hasOwn(pages,id))return;
 active=id;
 for(const panel of panels)panel.hidden=panel.dataset.panel!==id;
 if(id==='title-screen')document.dispatchEvent?.(new CustomEvent('deluxe:title-screen-open'));
 for(const button of buttons){if(button.dataset.page===id)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
 document.getElementById('pageTitle').textContent=pages[id][0];
 document.getElementById('pageDescription').textContent=pages[id][1];
 document.getElementById('expandAll').disabled=false;document.getElementById('collapseAll').disabled=false;
}
for(const button of buttons)button.addEventListener('click',()=>selectPage(button.dataset.page));
function setExpanded(open){const panel=panels.find(p=>p.dataset.panel===active);if(panel)for(const section of panel.querySelectorAll('details'))section.open=open;}
document.getElementById('expandAll').addEventListener('click',()=>setExpanded(true));
document.getElementById('collapseAll').addEventListener('click',()=>setExpanded(false));
selectPage('overview');
