(function(){
 const clean=window.ISSSDRetiredExpansion.stripRetiredTeamExpansion;
 if(typeof studioImportProject==='function'){const original=studioImportProject;studioImportProject=async function(file,...args){
  if(file&&typeof file.text==='function'&&typeof File==='function'){const value=clean(JSON.parse(await file.text()));file=new File([JSON.stringify(value)],file.name,{type:file.type||'application/json',lastModified:file.lastModified});}
  else if(file&&typeof file==='object'&&!(file instanceof Blob))file=clean(file);
  return original.call(this,file,...args);
 };}
 if(typeof studioProjectObject==='function'){const original=studioProjectObject;studioProjectObject=async function(...args){return clean(await original.apply(this,args))};}
 if(typeof studioCollectTeamsV1==='function'){const original=studioCollectTeamsV1;studioCollectTeamsV1=function(...args){return clean(original.apply(this,args))};}
 if(typeof studioApplyProjectWithBase==='function'){const original=studioApplyProjectWithBase;studioApplyProjectWithBase=function(project,...args){return original.call(this,clean(project),...args)};}
 if(typeof studioRestoreTeamsV1==='function'){const original=studioRestoreTeamsV1;studioRestoreTeamsV1=function(state,...args){return original.call(this,clean(state),...args)};}
 // Last boundary also covers separate team exports and selective project exports.
 if(typeof studioDownloadFile==='function'){
  const original=studioDownloadFile;
  studioDownloadFile=function(bytes,name,type,...args){
   if(/\.(?:issdproj|issdteams|json)$/i.test(String(name))||/json/i.test(String(type))){
    if(bytes instanceof Blob)return bytes.text().then(text=>original.call(this,new TextEncoder().encode(JSON.stringify(clean(JSON.parse(text)),null,2)+'\n'),name,type,...args));
    try{const text=typeof bytes==='string'?bytes:new TextDecoder().decode(bytes);bytes=new TextEncoder().encode(JSON.stringify(clean(JSON.parse(text)),null,2)+'\n');}catch(e){throw e;}
   }
   return original.call(this,bytes,name,type,...args);
  };
 }
})();
