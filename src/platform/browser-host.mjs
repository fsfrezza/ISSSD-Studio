import {assertHostBridge} from './host-bridge.mjs';

function ensureExtension(name,extension){
  const text=String(name||'').trim()||'untitled';
  return text.toLowerCase().endsWith(extension)?text:text+extension;
}

function cloneBytes(value,label='bytes'){
  if(value instanceof Uint8Array)return new Uint8Array(value);
  if(value instanceof ArrayBuffer)return new Uint8Array(value.slice(0));
  if(ArrayBuffer.isView(value))return new Uint8Array(value.buffer.slice(value.byteOffset,value.byteOffset+value.byteLength));
  throw new TypeError(label+' must be binary data');
}

async function readPickedFile(file,kind){
  if(kind==='project')return {name:file.name,text:await file.text()};
  return {name:file.name,bytes:new Uint8Array(await file.arrayBuffer())};
}

function pickerTypes(kind,extensions){
  const mime=kind==='project'?'application/json':'application/octet-stream';
  const description=kind==='project'?'ISSSD Studio project':'SNES ROM';
  return [{description,accept:{[mime]:extensions}}];
}

async function modernOpen(globalObject,options){
  const [handle]=await globalObject.showOpenFilePicker({
    multiple:false,
    types:pickerTypes(options.kind,options.extensions),
    excludeAcceptAllOption:false,
  });
  return readPickedFile(await handle.getFile(),options.kind);
}

function fallbackOpen(documentObject,options){
  return new Promise((resolve,reject)=>{
    const input=documentObject.createElement('input');
    input.type='file';
    input.accept=options.extensions.join(',');
    input.style.display='none';
    input.addEventListener('change',async()=>{
      try{
        const file=input.files?.[0];
        if(!file){reject(new Error('file selection cancelled'));return;}
        resolve(await readPickedFile(file,options.kind));
      }catch(error){reject(error);}
      finally{input.remove();}
    },{once:true});
    documentObject.body.appendChild(input);
    input.click();
  });
}

async function modernSave(globalObject,options){
  const handle=await globalObject.showSaveFilePicker({
    suggestedName:options.suggestedName,
    types:pickerTypes(options.kind,options.kind==='project'?['.issdproj']:['.sfc','.smc']),
  });
  const writable=await handle.createWritable();
  try{
    await writable.write(options.text??options.bytes);
  }finally{
    await writable.close();
  }
  return {name:options.suggestedName};
}

function fallbackSave(globalObject,documentObject,options){
  const payload=options.text!==undefined
    ? new Blob([options.text],{type:options.mimeType||'text/plain'})
    : new Blob([options.bytes],{type:options.mimeType||'application/octet-stream'});
  const url=globalObject.URL.createObjectURL(payload);
  const a=documentObject.createElement('a');
  a.href=url;
  a.download=options.suggestedName;
  a.style.display='none';
  documentObject.body.appendChild(a);
  a.click();
  a.remove();
  globalObject.setTimeout(()=>globalObject.URL.revokeObjectURL(url),1000);
  return {name:options.suggestedName};
}

export function createBrowserIo({globalObject=globalThis,documentObject=globalThis.document}={}){
  if(!documentObject)throw new Error('browser document required');
  return {
    openFile(options){
      if(typeof globalObject.showOpenFilePicker==='function')return modernOpen(globalObject,options);
      return fallbackOpen(documentObject,options);
    },
    saveFile(options){
      if(typeof globalObject.showSaveFilePicker==='function')return modernSave(globalObject,options);
      return fallbackSave(globalObject,documentObject,options);
    },
  };
}

export function createBrowserHost({io}={}){
  const browserIo=io??createBrowserIo();
  if(!browserIo||typeof browserIo.openFile!=='function'||typeof browserIo.saveFile!=='function'){
    throw new TypeError('browser io requires openFile and saveFile');
  }
  return assertHostBridge({
    async openRom(){
      const picked=await browserIo.openFile({kind:'rom',extensions:['.sfc','.smc']});
      return {name:String(picked.name||'ROM.sfc'),bytes:cloneBytes(picked.bytes,'ROM bytes')};
    },
    async openProject(){
      const picked=await browserIo.openFile({kind:'project',extensions:['.issdproj']});
      let project;
      try{project=JSON.parse(String(picked.text??''));}
      catch(error){throw new Error('invalid project JSON',{cause:error});}
      return {name:String(picked.name||'project.issdproj'),project};
    },
    async saveProject(project,{suggestedName='project.issdproj'}={}){
      const text=JSON.stringify(project,null,2)+'\n';
      return browserIo.saveFile({
        kind:'project',
        suggestedName:ensureExtension(suggestedName,'.issdproj'),
        mimeType:'application/json',
        text,
      });
    },
    async exportRom(rom,{suggestedName='output.sfc'}={}){
      return browserIo.saveFile({
        kind:'rom',
        suggestedName:ensureExtension(suggestedName,'.sfc'),
        mimeType:'application/octet-stream',
        bytes:cloneBytes(rom,'ROM bytes'),
      });
    },
  });
}
