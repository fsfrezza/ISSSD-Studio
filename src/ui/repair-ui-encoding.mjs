// Repair only known UI glyphs misread as Latin-1/Windows-1252, never decode
// an entire document: doing so damages already-correct Portuguese and assets.
const GLYPHS='⇑↑↓←→↔⇄●○◈◆◫▦▣⚑★☆✓✔✕✖⚠▶◀■□▪•…≠±×÷°✦⚙♟♫♪➕➖️';
export const UI_NAV_GLYPHS=Object.freeze({dashboard:'◈',expansion:'⇑',groups:'◫',teams:'◆',players:'●',goalkeepers:'●','bulk-roster':'▦',uniforms:'▣',flags:'⚑',texts:'▤','main-menu':'▦','game-modes':'▦',sounds:'♪',strategies:'⇄','game-improvements':'✦','title-screen':'▣'});
const badEncodings=text=>{
 const bytes=new TextEncoder().encode(text);
 return [new TextDecoder('windows-1252').decode(bytes),Array.from(bytes,b=>String.fromCharCode(b)).join('')];
};
const replacements=new Map();
for(const glyph of GLYPHS){
 for(const first of badEncodings(glyph)){
  if(first!==glyph)replacements.set(first,glyph);
  for(const second of badEncodings(first))if(second!==glyph)replacements.set(second,glyph);
 }
}
const entries=[...replacements].sort((a,b)=>b[0].length-a[0].length);
export function repairUiEncoding(html){
 for(const [bad,good]of entries)html=html.replaceAll(bad,good);
 // Local protected baselines can contain different historic icon spellings.
 // The navigation's page identifier is authoritative, not the damaged label.
 return html.replace(/(<(?:button|a)\b[^>]*\bdata-page=["']([^"']+)["'][^>]*>)([\s\S]*?)(<\/(?:button|a)>)/g,(all,open,page,body,close)=>{
  const glyph=UI_NAV_GLYPHS[page];if(!glyph)return all;
  return open+body.replace(/(<span\b[^>]*class=["'][^"']*\bnavico\b[^"']*["'][^>]*>)[\s\S]*?(<\/span>)/,(_,a,b)=>a+glyph+b)+close;
 });
}
