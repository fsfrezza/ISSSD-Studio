import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../editor-src/uniforms-editor.mjs',import.meta.url),'utf8');
const runtime=source.slice(source.indexOf(' function selectedLabel()'),source.indexOf(' function reloadPixels()'));
function harness(){
 const nodes=new Map(),calls=[];let keeperColor=90;const palettes=[[0,10],[0,40]];
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.style={};this.attrs={};this.visible=true;}
  set innerHTML(v){this.children=[];}append(...els){this.children.push(...els);}setAttribute(k,v){this.attrs[k]=v;}
  getClientRects(){return this.visible?[{}]:[];}
  getContext(){return{createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),clearRect(){},putImageData:img=>{this.image=Array.from(img.data);}};}
 }
 const document={hidden:false,createElement:tag=>new Element(tag)};
 for(const id of ['uniformDirections','uniformDirectionsTitle','uniformDirectionsHelp','uniformAnimatedPreview','uniformAnimationCaption','uniformAnimationDirection'])nodes.set(id,new Element(id));
 const views=(kind,step)=>{calls.push([kind,step]);return ['N','NE','E','SE','S','SW','W','NW'].map(id=>({id,label:id,name:kind+step,width:1,height:1,pixels:[1],available:true}));};
 const window={ISSSDPlayerSpriteCore:{uniformDirectionalViews:(_b,_e,_p,{step})=>views('line',step),goalkeeperDirectionalViews:(_b,{step})=>views('keeper',step)},__ISSSD_GOALKEEPERS_EDITOR__:{previewPalette:()=>[0,keeperColor]},ISSSDGoalkeepers:{goalkeeperBgrHex:v=>'#'+v.toString(16).padStart(2,'0')+'0000'}};
 const context=vm.createContext({window,document,by:id=>nodes.get(id),base:()=>new Uint8Array(),read:k=>({colors:palettes[k]}),patternBytes:()=>new Uint8Array(),Uint8ClampedArray});
 vm.runInContext('let kit=0,team=30,draft=[1],animationFrames=[],animationPhase=0,animationDirection="S";\n'+runtime,context);
 const run=code=>vm.runInContext(code,context),gallery=()=>nodes.get('uniformDirections').children,canvases=()=>gallery().flatMap(card=>card.children[1].children.map(item=>item.children[0]));
 return{nodes,calls,document,palettes,run,gallery,canvases,setKeeperColor:v=>{keeperColor=v;}};
}
test('gallery and animation show only the selected kit and refresh edited palettes',()=>{
 const h=harness();h.run('directionGallery()');assert.equal(h.gallery().length,8);assert.equal(h.canvases().length,80);assert.ok(h.canvases().every(c=>c.image[0]===10&&c.attrs['aria-label'].includes('Titular')));
 h.run('kit=1;directionGallery()');assert.equal(h.canvases().length,80);assert.ok(h.canvases().every(c=>c.image[0]===40&&c.attrs['aria-label'].includes('Reserva')));assert.equal(h.nodes.get('uniformAnimatedPreview').image[0],40);
 h.palettes[1][1]=65;h.run('directionGallery()');assert.equal(h.nodes.get('uniformAnimatedPreview').image[0],65);assert.ok(h.canvases().every(c=>c.image[0]===65));
 h.calls.length=0;h.run('kit=2;directionGallery()');assert.equal(h.canvases().length,64);assert.ok(h.calls.every(([kind])=>kind==='keeper'));assert.ok(h.canvases().every(c=>c.image[0]===90&&c.attrs['aria-label'].includes('Goleiro')));assert.match(h.nodes.get('uniformDirectionsHelp').textContent,/goleiro selecionado/);assert.doesNotMatch(h.nodes.get('uniformDirectionsHelp').textContent,/titular e reserva/);
 h.setKeeperColor(110);h.run('directionGallery()');assert.equal(h.nodes.get('uniformAnimatedPreview').image[0],110);assert.ok(h.canvases().every(c=>c.image[0]===110));
});
test('animation advances independently, switches direction from gallery and pauses while invisible',()=>{
 const h=harness();h.run('directionGallery()');assert.match(h.nodes.get('uniformAnimationCaption').textContent,/line0$/);h.run('animateSelection()');assert.match(h.nodes.get('uniformAnimationCaption').textContent,/line1$/);
 h.gallery()[2].children[0].onclick();assert.equal(h.nodes.get('uniformAnimationDirection').value,'E');assert.match(h.nodes.get('uniformAnimationCaption').textContent,/E · line0$/);
 const phase=h.run('animationPhase');h.document.hidden=true;h.run('animateSelection()');assert.equal(h.run('animationPhase'),phase);h.document.hidden=false;h.nodes.get('uniformAnimatedPreview').visible=false;h.run('animateSelection()');assert.equal(h.run('animationPhase'),phase);
});
