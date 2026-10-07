import {konamiLzCompress,konamiLzDecompress} from './konami-lz.mjs';
import {
  PLUS_MAIN_MENU_IDS,
  PLUS_MAIN_MENU_ORIGINAL,
  canonicalizePlusMainMenuState,
  canonicalizePlusMainMenuItemStyle,
} from './plus-main-menu-state.mjs';

export const PLUS_MAIN_MENU_REGIONS=Object.freeze({
  sprite:{pc:0x0F0000,capacity:1628,rawLength:2240},
  background:{pc:0x0F58AB,capacity:2413,rawLength:4032},
  tilemap:{pc:0x1169D0,capacity:337,rawLength:2048},
  oam:{pc:0x0C1FB8,capacity:284},
  pointers:{pc:0x0173AA,length:32},
});

export const PLUS_MAIN_MENU_SELECTION_TO_UI=Object.freeze([0,2,4,6,1,3,5,7]);

export const PLUS_MAIN_MENU_GLYPHS=Object.freeze({
  A:[56,68,68,124,68,68,68,0],B:[120,68,68,120,68,68,120,0],C:[60,64,64,64,64,64,60,0],D:[120,68,68,68,68,68,120,0],
  E:[124,64,64,120,64,64,124,0],F:[124,64,64,120,64,64,64,0],G:[60,64,64,92,68,68,60,0],H:[68,68,68,124,68,68,68,0],
  I:[124,16,16,16,16,16,124,0],J:[28,8,8,8,72,72,48,0],K:[68,72,80,96,80,72,68,0],L:[64,64,64,64,64,64,124,0],
  M:[68,108,84,84,68,68,68,0],N:[68,100,84,76,68,68,68,0],O:[56,68,68,68,68,68,56,0],P:[120,68,68,120,64,64,64,0],
  Q:[56,68,68,68,84,72,52,0],R:[120,68,68,120,80,72,68,0],S:[60,64,64,56,4,4,120,0],T:[124,16,16,16,16,16,16,0],
  U:[68,68,68,68,68,68,56,0],V:[68,68,68,68,68,40,16,0],W:[68,68,68,84,84,84,40,0],X:[68,68,40,16,40,68,68,0],
  Y:[68,68,40,16,16,16,16,0],Z:[124,4,8,16,32,64,124,0],
  0:[56,68,76,84,100,68,56,0],1:[16,48,16,16,16,16,56,0],2:[56,68,4,8,16,32,124,0],3:[120,4,4,56,4,4,120,0],
  4:[8,24,40,72,124,8,8,0],5:[124,64,64,120,4,4,120,0],6:[56,64,64,120,68,68,56,0],7:[124,4,8,16,32,32,32,0],
  8:[56,68,68,56,68,68,56,0],9:[56,68,68,60,4,4,56,0],'-':[0,0,0,124,0,0,0,0],' ':[0,0,0,0,0,0,0,0],
  'Á':[56,68,68,124,68,68,68,0],'À':[56,68,68,124,68,68,68,0],'Â':[56,68,68,124,68,68,68,0],'Ã':[56,68,68,124,68,68,68,0],
  'É':[124,64,64,120,64,64,124,0],'Ê':[124,64,64,120,64,64,124,0],'Í':[124,16,16,16,16,16,124,0],
  'Ó':[56,68,68,68,68,68,56,0],'Ô':[56,68,68,68,68,68,56,0],'Õ':[56,68,68,68,68,68,56,0],'Ú':[68,68,68,68,68,68,56,0],
  'Ç':[60,64,64,64,64,64,60,0],
});

export function normalizePlusMainMenuRenderText(value){
  const source=String(value??'').toUpperCase().replace(/\r/g,'');
  let out='';
  for(const char of source){
    if(char==='\n'||char===' '||Object.prototype.hasOwnProperty.call(PLUS_MAIN_MENU_GLYPHS,char)){out+=char;continue;}
    const decomposed=char.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    out+=(decomposed&&Object.prototype.hasOwnProperty.call(PLUS_MAIN_MENU_GLYPHS,decomposed[0]))?decomposed[0]:' ';
  }
  return out.replace(/[ \t]+/g,' ').trim();
}

export function plusMainMenuGlyphMetrics(style){
  const st=canonicalizePlusMainMenuItemStyle(style);
  const scale=st.scale/100,widthScale=st.width/100,heightScale=st.height/100;
  const visualWidthScale=scale<=1.30?1:(1+(scale-1.30)*1.65);
  const baseHeight=st.scale<=115
    ?10+((st.scale-100)*5/15)
    :15+((st.scale-115)*1/15);
  const width=Math.max(4,Math.min(16,Math.round(8*visualWidthScale*widthScale)));
  // v6.79 deliberately increases vertical weight by 1.5x while capping at
  // two tile rows. Going over 16 px corrupts following native menu tiles.
  const height=Math.max(4,Math.min(16,Math.round(baseHeight*heightScale*1.5)));
  return {width,height};
}

export function plusMainMenuMaxChars(style){
  const st=canonicalizePlusMainMenuItemStyle(style),metrics=plusMainMenuGlyphMetrics(st);
  const advance=metrics.width+st.letterSpacing;
  return Math.max(1,Math.floor((112+st.letterSpacing)/Math.max(1,advance)));
}

export function wrapPlusMainMenuText(value,style){
  const st=canonicalizePlusMainMenuItemStyle(style);
  const text=normalizePlusMainMenuRenderText(value);
  const max=plusMainMenuMaxChars(st),result=[];
  for(const explicit of text.split('\n')){
    const words=explicit.trim().split(/\s+/).filter(Boolean);
    let current='';
    for(let word of words){
      if(word.length>max){
        if(current){result.push(current);current='';}
        while(word.length>max){result.push(word.slice(0,max));word=word.slice(max);}
        current=word;
      }else if(!current)current=word;
      else if(current.length+1+word.length<=max)current+=' '+word;
      else{result.push(current);current=word;}
    }
    if(current)result.push(current);
  }
  if(!result.length)result.push('');
  if(result.length>2)throw new RangeError('Main menu text needs more than two lines: '+text+' -> '+result.join(' / '));
  return result;
}

function bitmapFromRows(rows,style){
  const st=canonicalizePlusMainMenuItemStyle(style),{width,height}=plusMainMenuGlyphMetrics(st);
  const out=Array.from({length:height},()=>Array(width).fill(0));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const sourceY=Math.min(7,Math.floor(y*8/height)),sourceX=Math.min(7,Math.floor(x*8/width));
    out[y][x]=(rows[sourceY]>>(7-sourceX))&1;
  }
  if(st.bold){
    const copy=out.map(row=>row.slice());
    for(let y=0;y<height;y++)for(let x=0;x<width-1;x++)if(copy[y][x])out[y][x+1]=1;
  }
  return out;
}

function spritePixels(rows,style){
  const pixels=bitmapFromRows(rows,style),height=pixels.length,width=pixels[0].length;
  const out=Array.from({length:height},()=>Array(width).fill(0));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[y][x]){
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const xx=x+dx,yy=y+dy;
      if(xx>=0&&xx<width&&yy>=0&&yy<height&&!pixels[yy][xx])out[yy][xx]=4;
    }
  }
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[y][x])out[y][x]=1;
  return out;
}

export function encodePlusMainMenuTile(pixels,offsetX=0,offsetY=0){
  const out=new Uint8Array(32);
  for(let y=0;y<8;y++){
    let p0=0,p1=0,p2=0,p3=0;
    for(let x=0;x<8;x++){
      const value=pixels[offsetY+y]?.[offsetX+x]||0,bit=7-x;
      p0|=(value&1)<<bit;p1|=((value>>1)&1)<<bit;p2|=((value>>2)&1)<<bit;p3|=((value>>3)&1)<<bit;
    }
    out[y*2]=p0;out[y*2+1]=p1;out[16+y*2]=p2;out[16+y*2+1]=p3;
  }
  return out;
}

export function decodePlusMainMenuTile(tile){
  if(!(tile instanceof Uint8Array)||tile.length<32)throw new TypeError('32-byte 4bpp tile required');
  const pixels=new Uint8Array(64);
  for(let y=0;y<8;y++){
    const a=tile[y*2],b=tile[y*2+1],c=tile[16+y*2],d=tile[16+y*2+1];
    for(let x=0;x<8;x++){
      const bit=7-x;
      pixels[y*8+x]=((a>>bit)&1)|(((b>>bit)&1)<<1)|(((c>>bit)&1)<<2)|(((d>>bit)&1)<<3);
    }
  }
  return pixels;
}

function bytesKey(bytes){let key='';for(const value of bytes)key+=String.fromCharCode(value);return key;}

function paddedCompressedRegion(raw,capacity,name){
  const compressed=konamiLzCompress(raw);
  const decoded=konamiLzDecompress(compressed).data;
  if(decoded.length!==raw.length||decoded.some((value,index)=>value!==raw[index]))throw new Error('Main menu Konami LZ round-trip failed: '+name);
  if(compressed.length>capacity)throw new RangeError(name+' does not fit native block: '+compressed.length+'/'+capacity+' bytes');
  const region=new Uint8Array(capacity);region.set(compressed);
  return {raw,compressed,region,capacity};
}

export function renderPlusMainMenu(value){
  const state=canonicalizePlusMainMenuState(value);
  if(!state)throw new TypeError('plusMainMenu state required');
  const texts=PLUS_MAIN_MENU_IDS.map(id=>normalizePlusMainMenuRenderText(state.texts[id]??PLUS_MAIN_MENU_ORIGINAL[id]));
  const style={previewSelected:state.style.previewSelected,items:state.style.items.map(canonicalizePlusMainMenuItemStyle)};
  const wrapped=texts.map((text,index)=>wrapPlusMainMenuText(text,style.items[index]));

  const sprite=new Uint8Array(PLUS_MAIN_MENU_REGIONS.sprite.rawLength);
  const background=new Uint8Array(PLUS_MAIN_MENU_REGIONS.background.rawLength);
  const spriteMap=new Map(),backgroundMap=new Map();
  let spriteCount=1,backgroundCount=1;

  const addTile=(raw,map,tile,kind,max)=>{
    if(!tile.some(Boolean))return 0;
    const key=bytesKey(tile);
    if(map.has(key))return map.get(key);
    const id=kind==='sprite'?spriteCount++:backgroundCount++;
    if(id>=max)throw new RangeError('native '+kind+' tile budget exceeded: '+(id+1)+'/'+max);
    raw.set(tile,id*32);map.set(key,id);return id;
  };

  const glyphCache=new Map();
  const glyphParts=(char,st)=>{
    const key=[char,st.scale,st.width,st.height,st.bold].join('|');
    if(glyphCache.has(key))return glyphCache.get(key);
    const pixels=spritePixels(PLUS_MAIN_MENU_GLYPHS[char],st),parts=[];
    for(let tileY=0;tileY<Math.ceil(pixels.length/8);tileY++)for(let tileX=0;tileX<Math.ceil(pixels[0].length/8);tileX++){
      const id=addTile(sprite,spriteMap,encodePlusMainMenuTile(pixels,tileX*8,tileY*8),'sprite',70);
      if(id)parts.push({tileX,tileY,id});
    }
    const result={width:pixels[0].length,height:pixels.length,parts};glyphCache.set(key,result);return result;
  };

  const tilemap=new Uint8Array(PLUS_MAIN_MENU_REGIONS.tilemap.rawLength),blank=0x0580;
  for(let i=0;i<1024;i++){tilemap[i*2]=blank&0xFF;tilemap[i*2+1]=blank>>8;}

  const lineBitmap=(line,st)=>{
    const metrics=plusMainMenuGlyphMetrics(st),advance=metrics.width+st.letterSpacing;
    const width=Math.max(1,line.length?metrics.width+(line.length-1)*advance:1);
    const canvasHeight=Math.ceil(metrics.height/8)*8,topPad=Math.ceil((canvasHeight-metrics.height)/2);
    const pixels=Array.from({length:canvasHeight},()=>Array(width).fill(0));
    for(let j=0;j<line.length;j++){
      const char=line[j];if(char===' ')continue;
      const glyph=bitmapFromRows(PLUS_MAIN_MENU_GLYPHS[char],st),offsetX=j*advance;
      for(let y=0;y<glyph.length;y++)for(let x=0;x<glyph[0].length;x++)if(glyph[y][x])pixels[topPad+y][offsetX+x]=1;
    }
    return pixels;
  };

  const slots=[[0,0],[1,0],[0,1],[1,1],[0,2],[1,2],[0,3],[1,3]];
  for(let i=0;i<8;i++){
    const st=style.items[i],[column,row]=slots[i],lines=wrapped[i];
    const baseX=(column?136:8)+st.x,topY=24+row*48+st.y,centerY=topY+24;
    const metrics=plusMainMenuGlyphMetrics(st);
    const ys=lines.length===1
      ?[centerY-Math.ceil(metrics.height/8)*4]
      :[centerY-Math.floor(st.lineSpacing/2)-Math.ceil(metrics.height/8)*4,centerY+Math.ceil(st.lineSpacing/2)-Math.ceil(metrics.height/8)*4];
    for(let lineIndex=0;lineIndex<lines.length;lineIndex++){
      const raw=lineBitmap(lines[lineIndex],st),lineWidth=raw[0].length,lineHeight=raw.length;
      const desiredX=st.align==='left'?baseX:st.align==='right'?baseX+112-lineWidth:baseX+Math.floor((112-lineWidth)/2);
      const startX=Math.floor(desiredX/8)*8,leftPad=desiredX-startX,paddedWidth=Math.ceil((leftPad+lineWidth)/8)*8;
      const padded=Array.from({length:lineHeight},()=>Array(paddedWidth).fill(0));
      for(let y=0;y<lineHeight;y++)for(let x=0;x<lineWidth;x++)if(raw[y][x])padded[y][leftPad+x]=raw[y][x];
      const startY=Math.round(ys[lineIndex]/8)*8;
      if(desiredX<baseX||desiredX+lineWidth>baseX+112||startY<0||startY+lineHeight>256)throw new RangeError('unsafe tilemap position for main menu option '+(i+1));
      for(let tileY=0;tileY<Math.ceil(lineHeight/8);tileY++)for(let tileX=0;tileX<Math.ceil(paddedWidth/8);tileX++){
        const id=addTile(background,backgroundMap,encodePlusMainMenuTile(padded,tileX*8,tileY*8),'background',126);
        if(!id)continue;
        const cellX=startX/8+tileX,cellY=startY/8+tileY;
        if(cellX<0||cellX>31||cellY<0||cellY>31)throw new RangeError('main menu tilemap cell outside 32x32 map');
        const word=0x0400|(0x180+id),position=(cellY*32+cellX)*2;
        tilemap[position]=word&0xFF;tilemap[position+1]=word>>8;
      }
    }
  }

  const centers=[[64,48],[64,96],[64,144],[64,192],[192,48],[192,96],[192,144],[192,192]];
  const sizes=[],xPositions=[],yPositions=[],tiles=[],palettes=[];
  for(let selection=0;selection<8;selection++){
    const ui=PLUS_MAIN_MENU_SELECTION_TO_UI[selection],st=style.items[ui],lines=wrapped[ui],[baseCenterX,baseCenterY]=centers[selection];
    const metrics=plusMainMenuGlyphMetrics(st),advance=metrics.width+st.letterSpacing,centerX=baseCenterX+st.x,centerY=baseCenterY+st.y;
    const ys=lines.length===1
      ?[centerY-Math.floor(metrics.height/2)]
      :[centerY-Math.floor(st.lineSpacing/2)-Math.floor(metrics.height/2),centerY+Math.ceil(st.lineSpacing/2)-Math.floor(metrics.height/2)];
    let count=0;
    for(let lineIndex=0;lineIndex<lines.length;lineIndex++){
      const line=lines[lineIndex],lineWidth=line.length?metrics.width+(line.length-1)*advance:0;
      const startX=st.align==='left'?centerX-56:st.align==='right'?centerX+56-lineWidth:centerX-Math.floor(lineWidth/2);
      for(let j=0;j<line.length;j++){
        const char=line[j];if(char===' ')continue;
        const glyph=glyphParts(char,st);
        for(const part of glyph.parts){
          xPositions.push((startX+j*advance+part.tileX*8-128+256)&0xFF);
          yPositions.push((ys[lineIndex]+part.tileY*8-120+256)&0xFF);
          tiles.push(part.id);palettes.push(0x01);count++;
        }
      }
    }
    sizes.push(count);
  }
  const totalSprites=sizes.reduce((a,b)=>a+b,0);
  if(totalSprites>255)throw new RangeError('too many main menu sprites: '+totalSprites+'/255');
  const oam=Uint8Array.from([8,totalSprites&0xFF,(totalSprites>>8)&0xFF,...sizes,...xPositions,...yPositions,...tiles,...palettes]);
  const pointers=new Uint8Array(PLUS_MAIN_MENU_REGIONS.pointers.length);
  let pointerOffset=0;
  for(let i=0;i<8;i++){
    const address=0x4000+pointerOffset;
    pointers[i*4]=address&0xFF;pointers[i*4+1]=(address>>8)&0xFF;pointers[i*4+2]=0x80;pointers[i*4+3]=0x78;
    pointerOffset+=sizes[i]*2;
  }

  const compressed={
    sprite:paddedCompressedRegion(sprite,PLUS_MAIN_MENU_REGIONS.sprite.capacity,'sprite'),
    background:paddedCompressedRegion(background,PLUS_MAIN_MENU_REGIONS.background.capacity,'background'),
    tilemap:paddedCompressedRegion(tilemap,PLUS_MAIN_MENU_REGIONS.tilemap.capacity,'tilemap'),
    oam:paddedCompressedRegion(oam,PLUS_MAIN_MENU_REGIONS.oam.capacity,'oam'),
  };

  return {
    state,texts,style,wrapped,
    sprite,background,tilemap,oam,pointers,compressed,
    spriteTiles:spriteCount,backgroundTiles:backgroundCount,totalSprites,sizes,
  };
}

export function plusMainMenuWriteRegions(value){
  const rendered=renderPlusMainMenu(value);
  return {
    rendered,
    regions:[
      {name:'Large Main Menu Letters',pc:PLUS_MAIN_MENU_REGIONS.sprite.pc,bytes:rendered.compressed.sprite.region},
      {name:'Layer2 Main Menu',pc:PLUS_MAIN_MENU_REGIONS.background.pc,bytes:rendered.compressed.background.region},
      {name:'Tilemap Main Menu',pc:PLUS_MAIN_MENU_REGIONS.tilemap.pc,bytes:rendered.compressed.tilemap.region},
      {name:'OAM selected',pc:PLUS_MAIN_MENU_REGIONS.oam.pc,bytes:rendered.compressed.oam.region},
      {name:'OAM pointers',pc:PLUS_MAIN_MENU_REGIONS.pointers.pc,bytes:rendered.pointers},
    ],
  };
}

export function plusMainMenuWriter(rom,state={}){
  if(!(rom instanceof Uint8Array))throw new TypeError('Uint8Array ROM required');
  if(state?.plusMainMenu===undefined||state?.plusMainMenu===null)return rom;
  const {regions}=plusMainMenuWriteRegions(state.plusMainMenu);
  for(const region of regions){
    if(region.pc<0||region.pc+region.bytes.length>rom.length)throw new RangeError('main menu region outside ROM: '+region.name);
    rom.set(region.bytes,region.pc);
  }
  return rom;
}
