import {drawIndexedPreview} from '../src/core/deluxe-visual-preview.mjs';

export function pixelAt(rect,width,height,event){
 if(!rect.width||!rect.height)return null;
 const x=Math.floor((event.clientX-rect.left)*width/rect.width),y=Math.floor((event.clientY-rect.top)*height/rect.height);
 return x>=0&&x<width&&y>=0&&y<height?[x,y]:null;
}

/** One pointer interaction = one undoable stroke; resource adapters own persistence. */
export function bindPixelStroke(canvas,{getEditor,getTool,getInk,setInk,draw,commit}){
 let stroke=null;
 const finish=(cancel=false)=>{if(!stroke)return;const {editor}=stroke;stroke=null;if(cancel||getEditor()!==editor){editor.cancel();draw();}else if(editor.end())commit();};
 canvas.onpointerdown=e=>{if(e.button!==undefined&&e.button!==0)return;const editor=getEditor();if(!editor)return;const pt=pixelAt(canvas.getBoundingClientRect(),editor.width,editor.height,e);if(!pt)return;finish(true);const tool=getTool();if(tool==='pick'){const color=editor.sample(...pt);if(color!==null)setInk(color);return;}const color=tool==='eraser'?0:getInk();editor.begin();stroke={editor,tool,color,last:pt,pointerId:e.pointerId};canvas.setPointerCapture?.(e.pointerId);if(tool==='fill')editor.fill(...pt,color);else editor.set(...pt,color);draw();};
 canvas.onpointermove=e=>{if(!stroke||!(e.buttons&1)||e.pointerId!==stroke.pointerId||!['pencil','eraser'].includes(stroke.tool))return;if(getEditor()!==stroke.editor){finish(true);return;}const editor=stroke.editor,pt=pixelAt(canvas.getBoundingClientRect(),editor.width,editor.height,e);if(!pt){stroke.last=null;return;}if(stroke.last)editor.line(...stroke.last,...pt,stroke.color);else editor.set(...pt,stroke.color);stroke.last=pt;draw();};
 canvas.onpointerup=e=>{if(e?.pointerId===undefined||stroke?.pointerId===e.pointerId)finish();};canvas.onpointercancel=()=>finish(true);canvas.onlostpointercapture=()=>finish(true);
 return {cancel:()=>finish(true)};
}

/** Native-resolution preview, optional render-only grid, and exact PNG export. */
export function installPixelView({canvas,controls,getView,redraw,onStatus,filename='imagem.png',getEditor,commit}){
 let grid=false,zoom='auto',baseline=null,previous=null;
 const host=document.createElement('div');host.className='pixel-workspace-options';controls.append(host);
 const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;host.append(b);return b;};
 const zoomLabel=document.createElement('label'),zoomSelect=document.createElement('select');zoomLabel.textContent='Zoom';for(const [value,label]of [['auto','Ajustar'],['2','200%'],['4','400%'],['8','800%'],['12','1200%']]){const option=document.createElement('option');option.value=value;option.textContent=label;zoomSelect.append(option);}zoomSelect.value='auto';zoomSelect.onchange=()=>{zoom=zoomSelect.value;redraw();};zoomLabel.append(zoomSelect);host.append(zoomLabel);
 const gridLabel=document.createElement('label'),check=document.createElement('input'),gridText=document.createElement('span');check.type='checkbox';check.onchange=()=>{grid=check.checked;redraw();};gridText.textContent='Grade';gridLabel.className='pixel-grid-toggle';gridLabel.append(check,gridText);host.append(gridLabel);
 button('Exportar PNG',()=>{try{const v=getView();if(!v)throw Error('Nenhuma imagem carregada.');const native=document.createElement('canvas');drawIndexedPreview(native,v,v.colors);native.toBlob(blob=>{if(!blob){onStatus('Não foi possível exportar PNG.');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');}catch(error){onStatus(error.message);}});
 if(getEditor)button('Restaurar pixels da sessão',()=>{const editor=getEditor();if(editor&&baseline&&editor.replace(baseline))commit();});
 return {render(view){if(!view)return;const editor=getEditor?.();if(editor!==previous){previous=editor;baseline=editor?.snapshot()??null;}canvas.style.setProperty?.('--pixel-display-width',zoom==='auto'?'288px':`${view.width*Number(zoom)}px`);canvas.classList?.toggle('pixel-grid-on',grid);if(!grid){drawIndexedPreview(canvas,view,view.colors);return;}const native=document.createElement('canvas');drawIndexedPreview(native,view,view.colors);const scale=8;canvas.width=view.width*scale;canvas.height=view.height*scale;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(native,0,0,canvas.width,canvas.height);ctx.strokeStyle='rgba(255,255,255,0.55)';ctx.lineWidth=1;ctx.beginPath();for(let x=0;x<=canvas.width;x+=scale){ctx.moveTo(x+.5,0);ctx.lineTo(x+.5,canvas.height);}for(let y=0;y<=canvas.height;y+=scale){ctx.moveTo(0,y+.5);ctx.lineTo(canvas.width,y+.5);}ctx.stroke();}};
}
