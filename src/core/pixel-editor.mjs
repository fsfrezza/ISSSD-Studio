// Indexed pixels only: resource adapters own ROM addresses, palettes and commits.
export class IndexedPixelEditor {
 constructor({width,height,pixels,mask=null,maxIndex=15,historyLimit=64}) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>1048576)throw Error('Dimensões inválidas.');
  this.width=width;this.height=height;this.maxIndex=maxIndex;this.historyLimit=historyLimit;
  if(mask&&mask.length!==width*height)throw Error('Máscara inválida.');
  this.mask=mask?Array.from(mask,Boolean):null;this.past=[];this.future=[];this.pending=null;
  this.validate(pixels);this.pixels=Array.from(pixels);
 }
 validate(pixels){if(!pixels||pixels.length!==this.width*this.height||Array.from(pixels).some(v=>!Number.isInteger(v)||v<0||v>this.maxIndex))throw Error('Pixels ou índices inválidos.');}
 begin(){if(!this.pending)this.pending=this.pixels.slice();}
 end(){if(!this.pending)return false;const old=this.pending;this.pending=null;if(old.every((v,i)=>v===this.pixels[i]))return false;this.past.push(old);if(this.past.length>this.historyLimit)this.past.shift();this.future=[];return true;}
 cancel(){if(this.pending)this.pixels=this.pending;this.pending=null;}
 index(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<this.width&&y<this.height?y*this.width+x:-1;}
 sample(x,y){const i=this.index(x,y);return i<0?null:this.pixels[i];}
 set(x,y,color){if(!Number.isInteger(color)||color<0||color>this.maxIndex)throw Error('Cor inválida.');const i=this.index(x,y);if(i>=0&&(!this.mask||this.mask[i]))this.pixels[i]=color;}
 line(x0,y0,x1,y1,color){if(this.index(x0,y0)<0||this.index(x1,y1)<0)return;const steps=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=steps;i++){const t=steps?i/steps:0;this.set(Math.round(x0+(x1-x0)*t),Math.round(y0+(y1-y0)*t),color);}}
 fill(x,y,color){const start=this.index(x,y);if(start<0||(this.mask&&!this.mask[start]))return;const source=this.pixels[start];if(source===color)return;const stack=[start],seen=new Set();while(stack.length){const i=stack.pop();if(seen.has(i))continue;seen.add(i);if(this.pixels[i]!==source||(this.mask&&!this.mask[i]))continue;this.set(i%this.width,Math.floor(i/this.width),color);if(i%this.width)stack.push(i-1);if(i%this.width<this.width-1)stack.push(i+1);if(i>=this.width)stack.push(i-this.width);if(i+this.width<this.pixels.length)stack.push(i+this.width);}}
 replace(pixels){this.validate(pixels);this.begin();this.pixels=this.pixels.map((v,i)=>!this.mask||this.mask[i]?pixels[i]:v);return this.end();}
 undo(){this.cancel();if(!this.past.length)return false;this.future.push(this.pixels.slice());this.pixels=this.past.pop();return true;}
 redo(){this.cancel();if(!this.future.length)return false;this.past.push(this.pixels.slice());this.pixels=this.future.pop();return true;}
 snapshot(){return this.pixels.slice();}
}
export function quantizeRgba(rgba,palette,{transparentIndex=0,alphaThreshold=128}={}){
 if(rgba.length%4||!palette.length||palette.some(c=>!Array.isArray(c)||c.length!==3))throw Error('Imagem ou paleta inválida.');
 const out=[];for(let i=0;i<rgba.length;i+=4){if(rgba[i+3]<alphaThreshold){out.push(transparentIndex);continue;}let best=-1,score=Infinity;palette.forEach((c,j)=>{if(j===transparentIndex)return;const distance=c.reduce((s,v,k)=>s+(rgba[i+k]-v)**2,0);if(distance<score){score=distance;best=j;}});if(best<0)throw Error('Paleta sem cor opaca.');out.push(best);}return out;
}
