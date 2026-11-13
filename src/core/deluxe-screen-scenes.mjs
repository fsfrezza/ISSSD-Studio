import {deluxeMenuWallpaper} from './deluxe-main-menu-scene.mjs';
import {PLUS_MAIN_MENU_GLYPHS} from './plus-main-menu-renderer.mjs';
import {TITLE_FONT_ROWS} from './title-font-glyphs.mjs';
import {DELUXE_MENU_SECTIONS} from './deluxe-menu-text.mjs';
import {PREMATCH_GRAPHIC_LABELS} from './deluxe-prematch-labels.mjs';
export const DELUXE_SCREEN_EDITORS=Object.freeze([
 {id:'open-game',title:'Tela de Open Game',section:'game-type-native',choices:['friendly','league','tournament'],choiceLabels:['Open Game','Short League','Short Tournament']},
 {id:'handicap',title:'Handicap',section:'handicap-native',choices:['1P','CPU'],choiceLabels:['Jogador 1','Adversário']},
 {id:'pre-match',title:'Menu pré-partida',section:null,choices:PREMATCH_GRAPHIC_LABELS.map(f=>f[0]),choiceLabels:PREMATCH_GRAPHIC_LABELS.map(f=>f[1])},
 {id:'stadium-screen',title:'Seleção de estádio',section:'stadium-native',sections:['stadium-native','match-options-native'],choices:Array.from({length:8},(_,i)=>String(i)),choiceLabels:['Japão','E.U.A.','Espanha','Itália','Inglaterra','Alemanha','Brasil','Nigéria']},
].map(Object.freeze));
export const MOVED_MENU_SECTIONS=new Set(DELUXE_SCREEN_EDITORS.flatMap(s=>s.sections??[s.section]).filter(Boolean));
export function deluxeScreenModel(id,project,selected=0){
 const config=DELUXE_SCREEN_EDITORS.find(s=>s.id===id);if(!config)throw Error('Tela desconhecida');
 if(!Number.isInteger(selected)||selected<0||selected>=config.choices.length)throw Error('Seleção de prévia inválida');
 const sections=(config.sections??[config.section]).filter(Boolean).map(id=>DELUXE_MENU_SECTIONS.find(s=>s.id===id)),values=Object.fromEntries(sections.flatMap(section=>section.fields.map(f=>[f[0],project?.changes?.menuTexts?.[section.id]?.[f[0]]??f[1]])));
 const labels=Object.fromEntries(PREMATCH_GRAPHIC_LABELS.map(([key,en])=>[key,project?.changes?.preMatchLabels?.[key]??en]));
 return {id,selected,values,labels,config};
}
// Composition preview: original wallpaper, approximate native frames and font.
// Every editable string is read from the same project path as the ROM writer.
export function deluxeScreenScene(base,id,project,selected=0){
 const model=deluxeScreenModel(id,project,selected),rgba=deluxeMenuWallpaper(base),{values:v}=model;
 const put=(x,y,c)=>{if(x>=0&&x<256&&y>=0&&y<224)rgba.set([...c,255],(y*256+x)*4);};
 const rect=(x,y,w,h,color)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)put(xx,yy,color);};
 const panel=(x,y,w,h)=>{for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const edge=Math.min(xx,yy,w-1-xx,h-1-yy);if(edge<3){put(x+xx,y+yy,[[0,192,248],[16,16,96],[120,32,200]][edge]);continue;}const at=((y+yy)*256+x+xx)*4;put(x+xx,y+yy,[0,8,40].map((c,k)=>Math.floor((rgba[at+k]+c*3)/4)));}};
 const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const text=(s,x,y,{scale=1,tall=1,color=[248,248,248],max=240,compact=false}={})=>{let xx=x;for(const c of norm(s)){const width=compact?6:8;if(xx+width*scale>x+max)break;const rows=(compact?PLUS_MAIN_MENU_GLYPHS[c.toUpperCase()]:TITLE_FONT_ROWS[c]??TITLE_FONT_ROWS[c.toUpperCase()])??[];for(let row=0;row<8;row++)for(let col=0;col<(compact?5:8);col++)if((rows[row]??0)&(1<<((compact?6:7)-col)))for(let dy=0;dy<tall;dy++)for(let dx=0;dx<scale;dx++)put(xx+col*scale+dx,y+row*tall+dy,color);xx+=width*scale;}};
 const wrap=(s,width)=>String(s).split('\n').flatMap(line=>{const lines=[];while(line.length>width){let cut=line.lastIndexOf(' ',width);if(cut<1)cut=width;lines.push(line.slice(0,cut));line=line.slice(cut).trimStart();}return [...lines,line];});
 text('A CONFIRM',176,4,{max:80});text('B CANCEL',184,13,{max:72});
 if(id==='open-game'){
  panel(54,32,148,88);panel(46,132,164,60);
  const keys=model.config.choices;keys.forEach((key,i)=>{const y=40+i*24;if(i===selected){rect(59,y-2,136,20,[0,0,80]);for(let x=59;x<195;x++){put(x,y-2,[248,248,0]);put(x,y+17,[248,248,0]);}}text(v[key],62,y,{tall:2,color:i===selected?[248,248,0]:[248,248,248],max:132});});
  const description=v[['friendlyHelp','leagueHelp','tournamentHelp'][selected]];wrap(description,18).slice(0,3).forEach((line,i)=>text(line,54,142+i*15,{tall:2,max:148}));
 }else if(id==='handicap'){
  panel(16,32,224,152);text(v.data_87c811,80,40,{max:152,tall:2});
  text('1P',40,68,{color:selected===0?[248,248,0]:[248,248,248]});text('CPU',176,68,{color:selected===1?[248,248,0]:[248,248,248]});
  for(let team=0;team<2;team++){const x=32+team*128;rect(x,84,56,24,team?[56,120,216]:[248,200,0]);for(let j=0;j<5;j++)rect(x+j*12,116,8,10,[248,248,0]);}
  text(v.data_87c875.replace(/\n/g,' '),32,146,{max:192,compact:true});
  wrap(v.data_87c884,29).slice(0,3).forEach((line,i)=>text(line,12,190+i*9,{max:232}));
 }else if(id==='pre-match'){
  const list=selected<10?PREMATCH_GRAPHIC_LABELS.slice(0,10):[PREMATCH_GRAPHIC_LABELS[selected]];
  panel(72,24,128,196);
  list.forEach(([key],i)=>{const y=32+i*18,active=key===model.config.choices[selected];if(active)rect(77,y-1,118,16,[0,0,88]);text(model.labels[key],80,y,{tall:2,color:active?[248,248,0]:[248,248,248],max:112,compact:true});});
 }else{
  text(v.data_87ca36,64,26,{tall:2,max:184});panel(56,56,144,100);rect(66,68,124,76,[0,104,24]);rect(68,70,120,2,[224,240,224]);rect(68,140,120,2,[224,240,224]);rect(128,70,1,72,[224,240,224]);
  text(v.data_87ca57,64,44,{max:176});const country=v.data_87ca9b.split('\n')[selected]?.trim()??model.config.choiceLabels[selected];text(v.data_87cad3+' '+country,40,166,{max:208});text(v.data_87ca77,48,184,{max:160});text(v.data_87ca80.split('\n').join(' / '),64,198,{max:160});text(v.data_87cada,80,214,{max:160});
 }
 return {...model,width:256,height:224,rgba};
}
