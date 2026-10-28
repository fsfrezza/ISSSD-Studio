export function decodeUniformTile(bytes,offset=0){return Array.from({length:64},(_,i)=>{const x=i%8,y=i>>3;return[0,1,2,3].reduce((v,p)=>v|((bytes[offset+(p>>1)*16+y*2+(p&1)]>>(7-x)&1)<<p),0);});}
// A compact front view of the kit pieces. Colors are read directly from the
// active native palette; native pattern edits remain visible over the torso.
export function uniformPreviewPixels(colors,pattern,frame=0,model=null){
 const width=48,height=64,pixels=Array(width*height).fill(-1),set=(x,y,c)=>{if(x>=0&&x<width&&y>=0&&y<height)pixels[y*width+x]=c;},rect=(x,y,w,h,c)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)set(xx,yy,c);};
 for(let y=5;y<31;y++)for(let x=5;x<43;x++){const sleeve=y<15&&(x<14||x>=34),torso=x>=14&&x<34;if(sleeve||torso)set(x,y,x<17?7:x<20?8:9);}
 if(model){for(let y=5;y<31;y++)for(let x=5;x<43;x++){const sleeve=y<15&&(x<14||x>=34),torso=x>=14&&x<34;if(sleeve||torso)set(x,y,model==='white-green-sleeves'?(sleeve?12:9):(x<24?9:8));}}
 const tile=decodeUniformTile(pattern,frame*32);for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(!model&&tile[y*8+x])rect(16+x*2,10+y*2,2,2,tile[y*8+x]);
 rect(20,5,8,3,7);rect(14,32,9,12,12);rect(25,32,9,12,12);rect(14,32,20,3,11);rect(14,35,2,9,10);rect(25,35,2,9,10);rect(16,47,6,13,14);rect(26,47,6,13,14);rect(16,47,2,13,13);rect(26,47,2,13,13);rect(14,60,8,3,15);rect(26,60,8,3,15);
 return{width,height,pixels,colors};
}
