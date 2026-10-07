import {canonicalProjectOpen} from './project-open.mjs';

export const PROJECT_SCHEMA='isssd-studio-project-v1';
export const PROJECT_SCHEMA_VERSION=1;

function jsonSafe(value,label='value'){
  if(value===null)return null;
  const type=typeof value;
  if(type==='string'||type==='boolean')return value;
  if(type==='number'){
    if(!Number.isFinite(value))throw new TypeError(label+' must contain only finite numbers');
    return value;
  }
  if(value instanceof Uint8Array)return Array.from(value);
  if(Array.isArray(value))return value.map((item,index)=>jsonSafe(item,`${label}[${index}]`));
  if(type==='object'){
    const proto=Object.getPrototypeOf(value);
    if(proto!==Object.prototype&&proto!==null)throw new TypeError(label+' must contain only plain JSON objects');
    const out={};
    for(const key of Object.keys(value).sort()){
      const item=value[key];
      if(item===undefined)continue;
      out[key]=jsonSafe(item,`${label}.${key}`);
    }
    return out;
  }
  throw new TypeError(label+' must be JSON-serializable');
}

export function projectDocumentFromCanonical(canonical,{profile='plus'}={}){
  if(canonical===null||typeof canonical!=='object'||Array.isArray(canonical))throw new TypeError('canonical project object required');
  const targetLength=Number(canonical.targetLength);
  if(!Number.isInteger(targetLength)||targetLength<0)throw new RangeError('invalid canonical targetLength');
  if(!Array.isArray(canonical.patches))throw new TypeError('canonical patches must be an array');

  const patches=canonical.patches.map((patch,index)=>{
    if(!patch||typeof patch!=='object'||Array.isArray(patch))throw new TypeError(`canonical patch ${index} must be an object`);
    const off=Number(patch.off);
    if(!Number.isInteger(off)||off<0)throw new RangeError(`canonical patch ${index} offset must be non-negative integer`);
    const data=patch.data instanceof Uint8Array?patch.data:Uint8Array.from(patch.data??[]);
    return {off,bytes:Array.from(data)};
  });

  return {
    schema:PROJECT_SCHEMA,
    version:PROJECT_SCHEMA_VERSION,
    profile:String(profile||'plus'),
    state:{
      targetLength,
      patches,
      semantic:jsonSafe(canonical.semantic??{},'semantic'),
    },
  };
}

export function canonicalProjectDocument(project,options={}){
  const canonical=canonicalProjectOpen(project,options);
  return projectDocumentFromCanonical(canonical,options);
}
