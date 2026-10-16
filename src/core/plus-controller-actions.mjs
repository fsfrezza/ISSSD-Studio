// Native descriptors consumed by CODE_858DA4 (five cells per action/mode,
// three cells for KEEPER). Tile IDs $72..$90 belong to the 496-byte asset.
export const CONTROLLER_ACTIONS=Object.freeze([
 {id:'highball',original:'HIGH BALL',pc:0x3ECDC,cells:5},
 {id:'passball',original:'PASS BALL',pc:0x3ECE3,cells:5},
 {id:'shoot',original:'SHOOT',pc:0x3ECEA,cells:5},
 {id:'dash',original:'DASH',pc:0x3ECF1,cells:5},
 {id:'keeper',original:'KEEPER',pc:0x3ECD7,cells:3},
 {id:'semiauto',original:'SEMI AUTO',pc:0x3ECF8,cells:5},
 {id:'auto',original:'AUTO',pc:0x3ECFF,cells:5},
 {id:'manual',original:'MANUAL',pc:0x3ED06,cells:5},
]);
export const CONTROLLER_NATIVE_DESCRIPTORS=Object.freeze([
 [0x3ECD7,[0x82,0x83,0x84]],
 [0x3ECDC,[0x72,0x73,0x74,0x75,0x76]],
 [0x3ECE3,[0x77,0x78,0x74,0x75,0x76]],
 [0x3ECEA,[0x79,0x7A,0x7B,0x7C,0]],
 [0x3ECF1,[0x7D,0x7E,0x7F,0x80,0]],
 [0x3ECF8,[0x85,0x86,0x87,0x88,0]],
 [0x3ECFF,[0x89,0x8A,0x8B,0x8C,0]],
 [0x3ED06,[0x8D,0x8E,0x8F,0x90,0]],
]);
export const normalizeControllerText=s=>String(s??'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9 -]/g,'').replace(/\s+/g,' ').trim();
export function resolveControllerActions(state={}){
 const whole=state.screenTextsV1?.values?.controls||{},gfx=state.textWorkspaceV2?.sections?.graphicIntents?.values||{};
 const legacy=id=>whole[id]??gfx['controller.'+id]??gfx['controller.v621.'+id];
 const out={};
 for(const a of CONTROLLER_ACTIONS){
  let value=whole[a.id]??gfx['controller.'+a.id];
  if(value==null&&a.id==='highball'&&(legacy('high')!=null||legacy('ball')!=null))value=(legacy('high')??'HIGH')+' '+(legacy('ball')??'BALL');
  if(value==null&&a.id==='passball'){
   const pass=legacy('pass');if(pass!=null)value=normalizeControllerText(pass)==='PASS'?'PASS BALL':pass;
  }
  out[a.id]=normalizeControllerText(value??legacy(a.id)??a.original);
 }
 return out;
}
