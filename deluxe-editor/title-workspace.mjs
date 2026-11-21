// View-only workspace helpers. Coordinates remain in native SNES pixels.
export function nudgeTitleLayer(layer,key,large=false){
 const delta=large?8:1,offsets={ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]};
 if(!layer||layer.locked||!offsets[key])return false;
 const [dx,dy]=offsets[key],x=Math.max(-512,Math.min(512,layer.x+dx)),y=Math.max(-448,Math.min(448,layer.y+dy));
 if(x===layer.x&&y===layer.y)return false;
 layer.x=x;layer.y=y;return true;
}

export function titleWorkspaceHistory(limit=20){
 const past=[],future=[];
 return {
  record(state){past.push(structuredClone(state));if(past.length>limit)past.shift();future.length=0;},
  undo(state){if(!past.length)return null;future.push(structuredClone(state));return past.pop();},
  redo(state){if(!future.length)return null;past.push(structuredClone(state));return future.pop();},
  clear(){past.length=0;future.length=0;},
  get canUndo(){return !!past.length;},get canRedo(){return !!future.length;}
 };
}
