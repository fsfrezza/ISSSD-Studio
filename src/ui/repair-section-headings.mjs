// Move existing titles into the collapse header instead of copying their text.
// Keep labels, buttons and nested editors in place.
export function repairSectionHeadings(html){
 const old="const title=card.querySelector('h3,h4,strong')?.textContent?.trim()?.slice(0,85)||'Seção';const h=document.createElement('h3');h.textContent=title;head.appendChild(h);card.insertBefore(head,card.firstChild)";
 const replacement="const original=Array.from(card.querySelectorAll('h3,h4')).find(n=>n.closest('.card')===card&&!n.closest('label,button,details'));const h=original||document.createElement('h3');if(!original)h.textContent='Seção';head.appendChild(h);card.insertBefore(head,card.firstChild)";
 if(!html.includes(old))throw Error('Cabeçalhos: mecanismo de seções não encontrado.');
 html=html.replace(old,replacement);
 const anchor="head.classList.add('studio-collapse-head');";
 if(!html.includes(anchor))throw Error('Cabeçalhos: ponto de deduplicação ausente.');
 return html.replace(anchor,anchor+`
 const heading=head.querySelector('h3,h4');
 const title=heading?.textContent?.replace(/\\s+/g,' ').trim();
 if(title)for(const other of card.querySelectorAll('h3,h4')){
  if(other===heading||head.contains(other)||other.closest('.card')!==card||other.closest('label,button,details'))continue;
  if(other.textContent.replace(/\\s+/g,' ').trim()===title&&!other.querySelector('input,select,button,textarea'))other.remove();
 }
 `);
}
