// The scoreboard shares palette color 12 with a live indicator. Only 13–15
// remain stable for flag graphics during a match. Selection can use all four.
export function stableFieldFlag(pixels,colors){
 if(!Array.isArray(pixels)||pixels.length!==384||pixels.some(v=>!Number.isInteger(v)||v<0||v>15)||!Array.isArray(colors)||colors.length!==4||colors.some(v=>!Number.isInteger(v)||v<0||v>32767))throw Error('Bandeira: pixels ou cores inválidos.');
 const distance=(a,b)=>[0,5,10].reduce((n,s)=>n+((a>>s&31)-(b>>s&31))**2,0),counts=[0,0,0,0];
 for(const v of pixels)if(v>=12)counts[v-12]++;
 // Preserve the border/background colors and the darkest emblem color first.
 const edges=[0,0,0,0];pixels.forEach((v,i)=>{if(v>=12&&(i<24||i>=360||i%24===0||i%24===23))edges[v-12]++;});
 const brightness=v=>[0,5,10].reduce((n,s)=>n+(v>>s&31),0),dark=[0,1,2,3].reduce((a,i)=>brightness(colors[i])<brightness(colors[a])?i:a,0);
 const chosen=[...new Set([...([0,1,2,3].sort((a,b)=>edges[b]-edges[a]).filter(i=>edges[i]>0).slice(0,2)),dark])];
 for(const i of [0,1,2,3].sort((a,b)=>counts[b]-counts[a]))if(chosen.length<3&&!chosen.includes(i))chosen.push(i);
 const map=[0,1,2,3].map(i=>chosen.reduce((a,j)=>distance(colors[i],colors[j])<distance(colors[i],colors[a])?j:a,chosen[0]));
 const best={chosen,map,error:map.reduce((n,j,i)=>n+counts[i]*distance(colors[i],colors[j]),0)};
 return{pixels:pixels.map(v=>v<12?v:13+best.chosen.indexOf(best.map[v-12])),colors:[colors[0],...best.chosen.map(i=>colors[i])],error:best.error};
}
