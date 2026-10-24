import vm from'node:vm';
import{independentTeamsRuntime}from'../scripts/patch-independent-teams.mjs';
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.value='';this.className='';this._text='';}
 set textContent(v){this._text=String(v);this.children=[];}get textContent(){return this._text+this.children.map(n=>n.textContent).join('');}
 append(...nodes){this.children.push(...nodes);}prepend(...nodes){this.children.unshift(...nodes);}replaceChildren(...nodes){this.children=nodes;}
 get options(){return this.tagName==='select'?this.children:[];}
 querySelectorAll(selector){const match=n=>selector.split(',').some(s=>s[0]==='.'?n.className.split(' ').includes(s.slice(1)):n.tagName===s);return this.children.flatMap(n=>[...(match(n)?[n]:[]),...n.querySelectorAll(selector)]);}
 querySelector(s){return this.querySelectorAll(s)[0]??null;}
 getContext(){return{clearRect(){},putImageData(){},createImageData:(w,h)=>({data:new Uint8Array(w*h*4)})};}
 getBoundingClientRect(){return{left:0,top:0,width:this.width,height:this.height};}dispatchEvent(e){this['on'+e.type]?.(e);}click(){this.onclick?.();}
}
export function independentEditorFixture(){
 const body=new Element('body'),head=new Element('head'),pages={};for(const[id,title]of Object.entries({teams:'Equipes',players:'Jogadores',uniforms:'Uniformes',formations:'Formações',flags:'Bandeiras'})){const p=new Element('section');p.className='page';p.id='page-'+id;const h=new Element('h2');h.textContent=title;p.append(h);body.append(p);pages[p.id]=p;}
 const document={body,head,readyState:'complete',createElement:t=>new Element(t),querySelectorAll:s=>body.querySelectorAll(s),getElementById:id=>pages[id]??null};let applied=null;
 const window={studioProjectObject:async()=>({state:{semantic:{}}}),studioApplyProjectWithBase:async project=>{if(project.fail)throw Error('Importação falhou');applied=project;return true;},__ISSSD_GIT_FINALIZE_PROJECT_OBJECT__:p=>p,studioUpdateBadge(){}};
 vm.runInNewContext(independentTeamsRuntime(),{window,document,structuredClone,console,setTimeout,clearTimeout,MutationObserver:class{observe(){}},Event:class{constructor(type){this.type=type;}},URL,Blob});
 return{window,document,pages,applied:()=>applied};
}
