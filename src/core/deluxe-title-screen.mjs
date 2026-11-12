import {applyTitleFont} from './deluxe-title-font.mjs';
import {applyTitleBackground} from './deluxe-title-background.mjs';
import {applyTitleLogo} from './deluxe-title-logo.mjs';
export const TITLE_PALETTES=Object.freeze([
 {id:'ball',label:'Bola',pc:0x4C2B4},{id:'stripe',label:'Faixa',pc:0x4C292},{id:'logo',label:'Letreiro',pc:0x4C318},{id:'text',label:'Textos',pc:0x4C2D6},
]);
export const TITLE_TEXT_FIELDS=Object.freeze([{id:'copyright',label:'Direitos autorais',pc:0x46E15,count:29},{id:'license',label:'Licença',pc:0x46E8A,count:18}]);
const glyphs={224:'@',225:'1',226:'9',227:'5',228:'K',229:'O',230:'N',231:'A',232:'M',233:'I',234:'L',235:'R',236:'G',237:'H',238:'T',239:'S',240:'E',241:'V',242:'D',243:'.',252:'C',253:'B',254:'Y'};
const inverse=Object.fromEntries(Object.entries(glyphs).map(([k,v])=>[v,Number(k)]));
export const TITLE_SUPPORTED_CHARACTERS=Object.values(glyphs).join('');
const signed=n=>n>127?n-256:n;
function order(base,f){return Array.from({length:f.count},(_,i)=>i).sort((a,b)=>signed(base[f.pc-1+a*4])-signed(base[f.pc-1+b*4]));}
export function readTitleText(base,f){return order(base,f).filter(i=>base[f.pc-2+i*4]!==127&&base[f.pc-2+i*4]<224).map(i=>glyphs[base[f.pc+i*4]]??'').join('');}
export function validateTitleText(value,f){
 if(typeof value!=='string')throw Error('Tela inicial: texto inválido');const text=value.normalize('NFC').toUpperCase();
 for(const c of text)if(/\p{C}/u.test(c))throw Error('Tela inicial: caracteres de controle não são permitidos');
 if([...text].filter(c=>c!==' ').length>f.count)throw Error(f.label+': máximo de '+f.count+' letras visíveis');
 if(text.length>32)throw Error(f.label+': texto largo demais');return text;
}
export function readTitlePalettes(base){return TITLE_PALETTES.map(p=>({...p,colors:Array.from({length:16},(_,i)=>base[p.pc+i*2]|base[p.pc+i*2+1]<<8)}));}
export function applyDeluxeTitleScreen(out,base,value){
 if(value===undefined)return out;
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
 if(!object(value)||Object.keys(value).some(k=>!['texts','palettes','logoTiles','backgroundTiles','photoTiles','fontGlyphs','map0','map1'].includes(k)))throw Error('Tela inicial: seção inválida');
 const texts=value.texts??{},palettes=value.palettes??{},writes=[];
 if(!object(texts)||!object(palettes))throw Error('Tela inicial: dados inválidos');
 const custom=value.fontGlyphs??{};if(!object(custom)||Object.keys(custom).length>64)throw Error('Fonte: dados inválidos');for(const [c,rows]of Object.entries(custom))if([...c].length!==1||!Array.isArray(rows)||rows.length!==8||rows.some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('Fonte: glifo inválido');
 const active=TITLE_TEXT_FIELDS.map(f=>validateTitleText(texts[f.id]??readTitleText(base,f),f));const fontMap=applyTitleFont(out,base,active,inverse,custom);
 for(const [id,v]of Object.entries(texts)){
  const f=TITLE_TEXT_FIELDS.find(f=>f.id===id);if(!f)throw Error('Texto inicial desconhecido');const text=validateTitleText(v,f);if(text===readTitleText(base,f)&&!active.some(t=>[...t].some(c=>c!==' '&&!Object.hasOwn(inverse,c))))continue;
  const rows=order(base,f),visible=rows.find(i=>base[f.pc-2+i*4]!==127&&base[f.pc-2+i*4]<224),y=base[f.pc-2+(visible??rows[0])*4],width=Math.max(0,(text.length-1)*8),left=-Math.floor(width/2);let used=0;
  for(let i=0;i<text.length;i++)if(text[i]!==' '){const row=rows[used++],at=f.pc+row*4;writes.push([at-2,y],[at-1,(left+i*8)&255],[at,fontMap[text[i]]]);}
  for(let i=used;i<rows.length;i++)writes.push([f.pc-2+rows[i]*4,240]);
 }
 for(const [id,colors]of Object.entries(palettes)){
  const p=TITLE_PALETTES.find(p=>p.id===id);if(!p)throw Error('Paleta inicial desconhecida');
  if(!Array.isArray(colors)||colors.length!==16||colors.some(c=>!Number.isInteger(c)||c<0||c>32767))throw Error('Paleta inicial inválida');
  colors.forEach((c,i)=>writes.push([p.pc+i*2,c&255],[p.pc+i*2+1,c>>8]));
 }
 applyTitleBackground(out,base,value);
 applyTitleLogo(out,base,value.logoTiles);
 for(const [at,v]of writes)out[at]=v;return out;
}
