// Repairs narrowly identified serialization/syntax defects in recovered legacy HTML.
// The vendor baseline is never modified.
export function normalizeLegacyScripts(html){
 return html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi,(block,attrs,body)=>{
  if(/\bid=["']isssd-v673-save-flow-capture-fix["']/.test(attrs)&&body.startsWith('\\n')){
   body=body.replace(/\\n/g,'\n');
  }
  if(body.includes('v6.64 — fluxo confirmado:')){
   body=body.replace('romRef.set(new Uint8Array(ch.old),ch.off)}if(wsBackup)',
    'romRef.set(new Uint8Array(ch.old),ch.off)}}if(wsBackup)');
  }
  return `<script${attrs}>${body}</script>`;
 });
}
