export const NATIVE_SCREEN_TEXT_FIELDS=Object.freeze([
 {
  "name": "Selecionar · atribuições",
  "pc": 247287,
  "capacity": 6,
  "original": "SELECT"
 },
 {
  "name": "Atribuições",
  "pc": 247297,
  "capacity": 11,
  "original": "ASSIGNMENTS"
 },
 {
  "name": "Táticas",
  "pc": 248007,
  "capacity": 7,
  "original": "TACTICS"
 },
 {
  "name": "Ajustar · menu",
  "pc": 248175,
  "capacity": 6,
  "original": "ADJUST"
 },
 {
  "name": "Estratégia · menu",
  "pc": 248186,
  "capacity": 8,
  "original": "STRATEGY"
 },
 {
  "name": "Ajustar · instrução 1",
  "pc": 248197,
  "capacity": 6,
  "original": "ADJUST"
 },
 {
  "name": "Mostrar · instrução 1",
  "pc": 248208,
  "capacity": 7,
  "original": "DISPLAY"
 },
 {
  "name": "Ajustar · instrução 2",
  "pc": 248221,
  "capacity": 6,
  "original": "ADJUST"
 },
 {
  "name": "Mostrar · instrução 2",
  "pc": 248232,
  "capacity": 7,
  "original": "DISPLAY"
 },
 {
  "name": "Nenhum",
  "pc": 248252,
  "capacity": 4,
  "original": "NONE"
 },
 {
  "name": "Mostrar · instrução 3",
  "pc": 248272,
  "capacity": 8,
  "original": "DISPLAYS"
 },
 {
  "name": "Estratégia · ONLY",
  "pc": 248283,
  "capacity": 4,
  "original": "ONLY"
 },
 {
  "name": "Mostrar · instrução 4",
  "pc": 248292,
  "capacity": 8,
  "original": "DISPLAYS"
 },
 {
  "name": "Estratégia · instrução",
  "pc": 248303,
  "capacity": 8,
  "original": "STRATEGY"
 },
 {
  "name": "Número",
  "pc": 248327,
  "capacity": 6,
  "original": "NUMBER"
 },
 {
  "name": "De",
  "pc": 248334,
  "capacity": 2,
  "original": "OF"
 },
 {
  "name": "Estratégia · STRATEGIES",
  "pc": 248339,
  "capacity": 10,
  "original": "STRATEGIES"
 },
 {
  "name": "Clima · SNOW",
  "pc": 248391,
  "capacity": 4,
  "original": "SNOW"
 },
 {
  "name": "Clima · FINE",
  "pc": 248397,
  "capacity": 4,
  "original": "FINE"
 },
 {
  "name": "Clima · RAIN",
  "pc": 248403,
  "capacity": 4,
  "original": "RAIN"
 },
 {
  "name": "Tipo A",
  "pc": 248790,
  "capacity": 6,
  "original": "A TYPE"
 },
 {
  "name": "Tipo B",
  "pc": 248903,
  "capacity": 6,
  "original": "B TYPE"
 },
 {
  "name": "Tipo C",
  "pc": 249127,
  "capacity": 6,
  "original": "C TYPE"
 },
 {
  "name": "Tipo D",
  "pc": 249268,
  "capacity": 6,
  "original": "D TYPE"
 },
 {
  "name": "Área A",
  "pc": 249775,
  "capacity": 6,
  "original": "AREA A"
 }
]);
export const nativeTextArea=f=>f.pc>=248007&&f.pc<248350?'textos-estrategias':'pre-partida';
export function plusNativeScreenTextWriter(rom,state={},selectedAreas=null){
 const values=state?.textWorkspaceV2?.sections?.graphicIntents?.values||{};
 for(const f of NATIVE_SCREEN_TEXT_FIELDS){if(selectedAreas&&!selectedAreas.includes(nativeTextArea(f)))continue;const key='__pk590.native.'+f.pc;if(!Object.hasOwn(values,key))continue;
  const text=String(values[key]).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z ]/g,'').replace(/\s+/g,' ').trim();
  if(!/^[A-Z ]*$/.test(text)||text.length>f.capacity)throw new Error('Native text exceeds mapped field: '+f.name);
  rom.set(Uint8Array.from(text.padEnd(f.capacity,' '),c=>c===' '?0:c.charCodeAt(0)-65+11),f.pc);
 }return rom;
}
