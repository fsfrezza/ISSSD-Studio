import{parse as parseJs}from'acorn';
import{parse as parseHtml}from'parse5';
import{isRetiredTeamExpansion as retired}from'../../src/core/retired-team-expansion.mjs';
const each=(n,fn)=>{if(!n||typeof n!=='object')return;fn(n);for(const[k,v]of Object.entries(n))if(!['start','end','loc'].includes(k)){if(Array.isArray(v))v.forEach(x=>each(x,fn));else if(v&&typeof v==='object')each(v,fn);}};
const has=n=>{let found=false;each(n,x=>{if(x.type==='Identifier'&&retired(x.name)||x.type==='Literal'&&typeof x.value==='string'&&retired(x.value)||x.type==='TemplateElement'&&retired(x.value?.cooked??''))found=true;});return found;};
const name=n=>n?.type==='Identifier'?n.name:n?.type==='Literal'?String(n.value):n?.type==='MemberExpression'?name(n.property):'';
function apply(source,edits){const outer=[];let end=-1;for(const e of edits.sort((a,b)=>a.start-b.start||b.end-a.end)){if(e.start<end)continue;outer.push(e);end=e.end;}for(const e of outer.reverse())source=source.slice(0,e.start)+e.text+source.slice(e.end);return source;}
export function stripRetiredExpansionScript(source,sourceType='script'){
 let text=source;
 // Iterate so pruning obsolete properties/branches exposes removable wrappers.
 for(let round=0;round<8;round++){
  let ast;try{ast=parseJs(text,{ecmaVersion:'latest',sourceType,allowReturnOutsideFunction:true,allowAwaitOutsideFunction:true});}catch(e){throw Error('Código do Editor inválido antes da limpeza: '+e.message);}
  const edits=[];const replace=(n,s='')=>edits.push({start:n.start,end:n.end,text:s});
  function ownedEntry(n){return n&&(retired(name(n))||n.type==='ObjectExpression'&&n.properties.some(p=>['id','key','name','title','label'].includes(name(p.key))&&p.value?.type==='Literal'&&retired(p.value.value))||n.type==='ArrayExpression'&&retired(name(n.elements[0])));}
  function list(items){return items.filter(n=>n&&!ownedEntry(n));}
  function visit(n){
   if(!n||typeof n!=='object')return;
   if(n.type==='FunctionDeclaration'&&retired(n.id?.name)){replace(n);return;}
   if(n.type==='VariableDeclaration'&&n.declarations.some(d=>has(d.id))){const kept=n.declarations.filter(d=>!has(d.id));replace(n,kept.length?n.kind+' '+kept.map(d=>text.slice(d.start,d.end)).join(',')+';':'');return;}
   if(n.type==='IfStatement'&&has(n.test)){replace(n,n.alternate?text.slice(n.alternate.start,n.alternate.end):';');return;}
   if(n.type==='ExpressionStatement'&&has(n.expression)){
    // Feature-owned calls, event handlers, assignments and namespace exports.
    const e=n.expression;if(e.type==='CallExpression'&&has(e.callee)||e.type==='AssignmentExpression'&&has(e.left)||e.type==='CallExpression'&&e.arguments.some(a=>a.type==='Literal'&&retired(a.value))){replace(n,';');return;}
   }
   if(n.type==='ObjectExpression'&&n.properties.some(p=>retired(name(p.key)))){const kept=n.properties.filter(p=>!retired(name(p.key)));replace(n,'{'+kept.map(p=>text.slice(p.start,p.end)).join(',')+'}');return;}
   if(n.type==='ArrayExpression'&&n.elements.some(ownedEntry)){const kept=list(n.elements);replace(n,'['+kept.map(e=>text.slice(e.start,e.end)).join(',')+']');return;}
   if((n.type==='ReturnStatement'||n.type==='ThrowStatement')&&n.argument?.type==='CallExpression'&&has(n.argument.callee)){replace(n,n.type==='ReturnStatement'?'return null;':'throw Error("Recurso removido.");');return;}
   if(n.type==='TemplateLiteral'&&n.quasis.some(q=>retired(q.value.cooked??''))&&n.quasis.some(q=>(q.value.cooked??'').includes('<'))){
    let combined=n.quasis.map((q,i)=>(q.value.cooked??q.value.raw)+(i<n.expressions.length?'__EXPR_'+i+'__':'')).join('');
    let cleaned=stripRetiredExpansionHtml(combined).replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$\{/g,'\\${');
    cleaned=cleaned.replace(/__EXPR_(\d+)__/g,(_,i)=>'${'+text.slice(n.expressions[Number(i)].start,n.expressions[Number(i)].end)+'}');replace(n,'`'+cleaned+'`');return;
   }
   if(n.type==='Identifier'&&retired(n.name)){replace(n,'undefined');return;}
   if(n.type==='Literal'&&typeof n.value==='string'&&retired(n.value)){replace(n,JSON.stringify(n.value.includes('<')?stripRetiredExpansionHtml(n.value):n.value.replace(new RegExp(retiredSource(),'gi'),'').trim()));return;}
   for(const[k,v]of Object.entries(n))if(!['start','end','loc'].includes(k)){if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')visit(v);}
  }
  visit(ast);if(!edits.length)break;text=apply(text,edits);
 }
 // Compatibility comments can contain the old label, but no behavior remains.
 text=text.replace(new RegExp(retiredSource(),'gi'),'retiredExtension');
 parseJs(text,{ecmaVersion:'latest',sourceType,allowReturnOutsideFunction:true,allowAwaitOutsideFunction:true});return text;
}
function retiredSource(){return String.fromCharCode(103,111,115,112,101,108)+'[\\s_-]*'+String.fromCharCode(103,111,108);}
export function stripRetiredExpansionHtml(html){
 const tree=parseHtml(html,{sourceCodeLocationInfo:true}),edits=[];
 function inspect(node){
  const loc=node.sourceCodeLocation,tag=node.tagName,attrs=node.attrs??[];
  const owned=attrs.some(a=>retired(a.value));
  if(loc&&tag&&tag!=='script'&&tag!=='style'&&owned){edits.push({start:loc.startOffset,end:loc.endOffset,text:''});return;}
  if(loc&&/^h[1-6]$/.test(tag??'')&&retired((node.childNodes??[]).map(n=>n.value??'').join(''))){let region=node;for(let p=node.parentNode;p?.tagName&&!['body','main','html'].includes(p.tagName);p=p.parentNode){if(['section','article'].includes(p.tagName)||(p.attrs??[]).some(a=>a.name==='class'&&/(?:^|\s)card(?:\s|$)/.test(a.value))){region=p;break;}}const l=region.sourceCodeLocation;edits.push({start:l.startOffset,end:l.endOffset,text:''});return;}
  if(loc&&tag==='script'){
   const type=attrs.find(a=>a.name==='type')?.value??'';const body=html.slice(loc.startTag.endOffset,loc.endTag?.startOffset??loc.endOffset);
   if(owned){edits.push({start:loc.startOffset,end:loc.endOffset,text:''});return;}
   if(retired(body)){
    const value=['application/json','application/ld+json'].includes(type)?JSON.stringify(stripJson(body)):stripRetiredExpansionScript(body,type==='module'?'module':'script');edits.push({start:loc.startTag.endOffset,end:loc.endTag?.startOffset??loc.endOffset,text:value});
   }return;
  }
  if(loc&&tag==='style'&&owned){edits.push({start:loc.startOffset,end:loc.endOffset,text:''});return;}
  for(const child of node.childNodes??[])inspect(child);
 }
 inspect(tree);let out=apply(html,edits);out=out.replace(new RegExp(retiredSource(),'gi'),'');if(retired(out))throw Error('Referência obsoleta permaneceu no Editor.');return out;
}
function stripJson(body){const out=JSON.parse(body);function clean(x){if(Array.isArray(x))return x.filter(v=>typeof v!=='string'||!retired(v)).map(clean);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([k])=>!retired(k)).map(([k,v])=>[k,clean(v)]));return typeof x==='string'?x.replace(new RegExp(retiredSource(),'gi'),''):x;}return clean(out);}
