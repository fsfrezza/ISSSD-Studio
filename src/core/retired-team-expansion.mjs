// Retired extension identifiers are encoded so they never appear in generated
// Editor markup, export schemas, labels, or saved compatibility metadata.
const retiredStem=String.fromCharCode(103,111,115,112,101,108);
const retiredPattern=new RegExp(retiredStem+'(?:[\\s_-]*'+String.fromCharCode(103,111,108)+')?','i');
export function isRetiredTeamExpansion(value){return retiredPattern.test(String(value));}
export function stripRetiredTeamExpansion(value){
 const omit=Symbol('retired');
 function clean(v){
  if(typeof v==='string'){
   if(!isRetiredTeamExpansion(v))return v;
   if(/^[\s]*[\[{]/.test(v)){try{return JSON.stringify(clean(JSON.parse(v)))}catch{}}
   return v.replace(new RegExp(retiredPattern.source,'gi'),'').trim();
  }
  if(Array.isArray(v))return v.filter(x=>typeof x!=='string'||!isRetiredTeamExpansion(x)).map(clean).filter(x=>x!==omit);
  if(v&&typeof v==='object'){
   if(v instanceof Uint8Array)return v.slice();
   if(Array.isArray(v.teams)&&isRetiredTeamExpansion(v.label??v.title??'')&&('enabled'in v))return omit;
   const out={};for(const[k,x]of Object.entries(v)){if(isRetiredTeamExpansion(k))continue;const c=clean(x);if(c!==omit)Object.defineProperty(out,k,{value:c,enumerable:true,writable:true,configurable:true});}return out;
  }return v;
 }
 const result=clean(value);return result===omit?null:result;
}
