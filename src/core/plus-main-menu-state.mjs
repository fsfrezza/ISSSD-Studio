export const PLUS_MAIN_MENU_SCHEMA='isssd-plus-main-menu-v1';
export const PLUS_MAIN_MENU_VERSION=1;
export const PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY='mainMenuGraphicTextsV600';

export const PLUS_MAIN_MENU_IDS=[
  'openGame','scenario','championship','penalty','cup','training','password','options'
];

export const PLUS_MAIN_MENU_ORIGINAL={
  openGame:'OPEN GAME',
  scenario:'SCENARIO',
  championship:'INTERNATIONAL',
  penalty:'PENALTY SHOOTKICK',
  cup:'WORLD SERIES',
  training:'TRAINING',
  password:'PASSWORD',
  options:'OPTIONS',
};

export const PLUS_MAIN_MENU_BASE_ITEM_STYLE={
  scale:115,width:100,height:100,x:0,y:0,letterSpacing:0,lineSpacing:16,align:'center',bold:0,
};

export const PLUS_MAIN_MENU_DEFAULT_STYLE={
  previewSelected:1,
  items:Array.from({length:8},()=>({...PLUS_MAIN_MENU_BASE_ITEM_STYLE})),
};

const LEGACY_TEXT_ALIASES={international:'championship',worldSeries:'cup'};

function clone(value){return structuredClone(value);}
function clamp(value,min,max,fallback){const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}

export function normalizePlusMainMenuText(value){
  const source=String(value??'').toUpperCase().replace(/\r/g,'');
  return source
    .split('\n')
    .map(line=>line.replace(/[\t ]+/g,' ').trim())
    .join('\n')
    .trim();
}

export function canonicalizePlusMainMenuItemStyle(value={}){
  if(value===null||typeof value!=='object'||Array.isArray(value))throw new TypeError('Plus main menu item style must be an object');
  return {
    scale:clamp(value.scale,80,160,PLUS_MAIN_MENU_BASE_ITEM_STYLE.scale),
    width:clamp(value.width,80,125,PLUS_MAIN_MENU_BASE_ITEM_STYLE.width),
    height:clamp(value.height,80,125,PLUS_MAIN_MENU_BASE_ITEM_STYLE.height),
    x:Math.round(clamp(value.x,-16,16,0)/8)*8,
    y:Math.round(clamp(value.y,-16,16,0)/8)*8,
    letterSpacing:[0,8].includes(Number(value.letterSpacing))?Number(value.letterSpacing):0,
    lineSpacing:[8,16,24].includes(Number(value.lineSpacing))?Number(value.lineSpacing):16,
    align:['left','center','right'].includes(value.align)?value.align:'center',
    bold:Number(value.bold)?1:0,
  };
}

function normalizeStyle(style={}){
  if(style===null||typeof style!=='object'||Array.isArray(style))throw new TypeError('Plus main menu style must be an object');
  const previewSelected=Math.round(clamp(style.previewSelected,0,7,1));
  let items;
  if(Array.isArray(style.items)){
    if(style.items.length!==8)throw new TypeError('Plus main menu style must contain 8 item styles');
    items=style.items.map(canonicalizePlusMainMenuItemStyle);
  }else{
    // v6.00/v6.01 stored only global size/bold. Promote those values to the
    // per-item style introduced later without losing historical appearance.
    const global={...PLUS_MAIN_MENU_BASE_ITEM_STYLE};
    if(style.size!==undefined)global.scale=clamp(style.size,80,160,115);
    if(style.bold!==undefined)global.bold=Number(style.bold)?1:0;
    items=Array.from({length:8},()=>canonicalizePlusMainMenuItemStyle(global));
  }
  return {previewSelected,items};
}

function normalizeTextRecord(record={}){
  if(record===null||typeof record!=='object'||Array.isArray(record))throw new TypeError('Plus main menu texts must be an object');
  const mapped={...record};
  for(const [legacy,id] of Object.entries(LEGACY_TEXT_ALIASES)){
    if(mapped[id]===undefined&&mapped[legacy]!==undefined)mapped[id]=mapped[legacy];
  }
  const out={};
  for(const id of PLUS_MAIN_MENU_IDS){
    const text=normalizePlusMainMenuText(mapped[id]??PLUS_MAIN_MENU_ORIGINAL[id]);
    if(text.length>140)throw new RangeError('Plus main menu text too long: '+id);
    out[id]=text||PLUS_MAIN_MENU_ORIGINAL[id];
  }
  return out;
}

function hasKnownTextValue(record){
  if(!record||typeof record!=='object'||Array.isArray(record))return false;
  return [...PLUS_MAIN_MENU_IDS,...Object.keys(LEGACY_TEXT_ALIASES)]
    .some(key=>Object.prototype.hasOwnProperty.call(record,key));
}

function normalizeCompositionItem(item,id){
  if(!item||typeof item!=='object'||Array.isArray(item))throw new TypeError('Plus main menu composition item must be an object');
  if(item.id!==id)throw new TypeError('Unexpected Plus main menu composition item: '+String(item.id));
  const mode=item.mode??'text';
  if(mode!=='text'&&mode!=='image')throw new TypeError('Plus main menu composition mode must be text or image');
  const numeric={};
  for(const key of ['x','y','w','h','size']){
    if(item[key]===undefined)continue;
    const value=Number(item[key]);
    if(!Number.isFinite(value))throw new TypeError('Invalid Plus main menu composition '+key+' for '+id);
    numeric[key]=value;
  }
  const out={
    id,
    mode,
    text:normalizePlusMainMenuText(item.text??PLUS_MAIN_MENU_ORIGINAL[id]),
    ...numeric,
  };
  if(item.font!==undefined)out.font=String(item.font);
  if(mode==='image'){
    const image=String(item.image??'');
    if(image&&!/^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/=]+$/i.test(image))throw new TypeError('Invalid Plus main menu embedded image for '+id);
    out.image=image;
  }
  return out;
}

export function canonicalizePlusMainMenuComposition(value){
  if(value===undefined||value===null)return null;
  if(typeof value!=='object'||Array.isArray(value))throw new TypeError('Plus main menu composition must be an object');
  if(value.schema&&value.schema!=='isssd-menu-screen-v1')throw new TypeError('Unsupported Plus main menu composition schema');
  if(value.version!==undefined&&Number(value.version)!==1)throw new TypeError('Unsupported Plus main menu composition version');
  if(!Array.isArray(value.items)||value.items.length!==PLUS_MAIN_MENU_IDS.length)throw new TypeError('Plus main menu composition must contain 8 items');
  const cursor=Number(value.cursor??0);
  if(!Number.isInteger(cursor)||cursor<0||cursor>7)throw new RangeError('Plus main menu cursor must be between 0 and 7');
  return {
    schema:'isssd-menu-screen-v1',
    version:1,
    background:String(value.background??''),
    cursor,
    items:PLUS_MAIN_MENU_IDS.map((id,index)=>normalizeCompositionItem(value.items[index],id)),
  };
}

export function canonicalizePlusMainMenuState(value){
  if(value===undefined||value===null)return null;
  if(typeof value!=='object'||Array.isArray(value))throw new TypeError('Plus main menu state must be an object');
  if(value.schema&&value.schema!==PLUS_MAIN_MENU_SCHEMA)throw new TypeError('Unsupported Plus main menu schema');
  if(value.version!==undefined&&Number(value.version)!==PLUS_MAIN_MENU_VERSION)throw new TypeError('Unsupported Plus main menu version');
  return {
    schema:PLUS_MAIN_MENU_SCHEMA,
    version:PLUS_MAIN_MENU_VERSION,
    texts:normalizeTextRecord(value.texts??{}),
    style:normalizeStyle(value.style??{}),
    composition:canonicalizePlusMainMenuComposition(value.composition),
  };
}

function parseLegacyGraphicState(raw){
  if(typeof raw!=='string'||!raw.trim())return null;
  try{
    const parsed=JSON.parse(raw);
    if(Array.isArray(parsed)&&parsed.length===8){
      return {texts:Object.fromEntries(PLUS_MAIN_MENU_IDS.map((id,i)=>[id,parsed[i]])),style:PLUS_MAIN_MENU_DEFAULT_STYLE};
    }
    if(parsed&&Array.isArray(parsed.texts)&&parsed.texts.length===8){
      return {
        texts:Object.fromEntries(PLUS_MAIN_MENU_IDS.map((id,i)=>[id,parsed.texts[i]])),
        style:parsed.style??PLUS_MAIN_MENU_DEFAULT_STYLE,
      };
    }
  }catch(_){/* malformed legacy graphic intent stays untouched */}
  return null;
}

function removeKnownTextKeys(record){
  if(!record||typeof record!=='object'||Array.isArray(record))return;
  for(const id of PLUS_MAIN_MENU_IDS)delete record[id];
  for(const legacy of Object.keys(LEGACY_TEXT_ALIASES))delete record[legacy];
}

export function migrateLegacyPlusMainMenu(semantic){
  if(semantic===null||typeof semantic!=='object'||Array.isArray(semantic))throw new TypeError('semantic state must be an object');
  const out=clone(semantic);

  const graphicValues=out?.textWorkspaceV2?.sections?.graphicIntents?.values;
  const graphicRaw=graphicValues?.[PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY]
    ?? out?.graphicalTextIntentions?.[PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY];
  const graphic=parseLegacyGraphicState(graphicRaw);
  const workspaceTexts=out?.textWorkspaceV2?.sections?.mainMenu?.values;
  const legacyTexts=out?.mainMenuDraft;
  const composition=out?.menuScreenV1;
  const hasWorkspaceTexts=hasKnownTextValue(workspaceTexts);
  const hasLegacyTexts=hasKnownTextValue(legacyTexts);

  if(out.plusMainMenu!==undefined&&out.plusMainMenu!==null){
    out.plusMainMenu=canonicalizePlusMainMenuState(out.plusMainMenu);
  }else if(graphic||hasWorkspaceTexts||hasLegacyTexts||composition){
    out.plusMainMenu=canonicalizePlusMainMenuState({
      texts:graphic?.texts??(hasWorkspaceTexts?workspaceTexts:null)??(hasLegacyTexts?legacyTexts:null)??{},
      style:graphic?.style??PLUS_MAIN_MENU_DEFAULT_STYLE,
      composition:composition??null,
    });
  }

  if(out.plusMainMenu){
    if(graphic&&graphicValues&&typeof graphicValues==='object')delete graphicValues[PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY];
    if(graphic&&out.graphicalTextIntentions&&typeof out.graphicalTextIntentions==='object')delete out.graphicalTextIntentions[PLUS_MAIN_MENU_GRAPHIC_LEGACY_KEY];
    if(hasWorkspaceTexts)removeKnownTextKeys(workspaceTexts);
    if(hasLegacyTexts)delete out.mainMenuDraft;
    if(composition)delete out.menuScreenV1;
  }

  return out;
}
