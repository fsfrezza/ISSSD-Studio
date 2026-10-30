// Resource-agnostic pointer adapter. The caller supplies indexed pixels and commits.
(()=>{
 window.ISSSDPixelEditor={attach({canvas,read,write,tool,ink,pick,onchange,viewport}){
  let model=null,last=null,active=false,pointer=null;
  function load(){const value=read();model=new window.ISSSDPixelCore.IndexedPixelEditor(value);last=null;active=false;}
  function sync(){write(model.snapshot());onchange?.();}
  function point(e){const r=canvas.getBoundingClientRect(),v=viewport?.()||{x:0,y:0,width:model.width,height:model.height};const x=Math.floor((e.clientX-r.left)*v.width/r.width),y=Math.floor((e.clientY-r.top)*v.height/r.height);return x<0||y<0||x>=v.width||y>=v.height?[-1,-1]:[v.x+x,v.y+y];}
  function draw(e){if(!active||e.pointerId!==pointer)return;const [x,y]=point(e);if(model.index(x,y)<0){last=null;return;}const color=tool()==='erase'?0:ink();if(last)model.line(...last,x,y,color);else model.set(x,y,color);last=[x,y];sync();}
  canvas.onpointerdown=e=>{if(active)return;if(!model)load();e.preventDefault();const [x,y]=point(e);if(model.index(x,y)<0)return;if(tool()==='pick'){pick?.(model.sample(x,y));return;}model.begin();pointer=e.pointerId;canvas.setPointerCapture?.(pointer);if(tool()==='fill'){const originalMask=model.mask,v=viewport?.();if(v)model.mask=model.pixels.map((_,i)=>(!originalMask||originalMask[i])&&i%model.width>=v.x&&i%model.width<v.x+v.width&&Math.floor(i/model.width)>=v.y&&Math.floor(i/model.width)<v.y+v.height);try{model.fill(x,y,ink());}finally{model.mask=originalMask;}model.end();sync();return;}active=true;last=null;draw(e);};
  canvas.onpointermove=draw;
  canvas.onpointerup=e=>{if(e.pointerId!==pointer)return;model.end();active=false;last=null;};
  canvas.onpointercancel=()=>{model?.cancel();active=false;last=null;if(model)sync();};
  canvas.onlostpointercapture=()=>{if(active){model.end();active=false;last=null;}};
  return{load,undo(){if(model?.undo())sync();},redo(){if(model?.redo())sync();},replace(pixels){if(!model)load();model.replace(pixels);sync();},snapshot:()=>model?.snapshot()};
 }};
})();
