import {DELUXE_REFERENCE_PHOTOS} from './deluxe-reference-photos.mjs';

// Native formation palettes are ordered highlight -> midtone -> shadow.
// Keep the original geometry, face/accessory selectors and skin palettes.
const styles={
 54:{shirt:['ff9431','e65a18','a53908'],shorts:['42424a','292931','191921'],detail:['e6e6e6','bdbdc5','848494'],keeper:['f7c59c','d69c73','ad735a','845239']},
 55:{shirt:['426394','29426b','192942'],shorts:['f7f7ff','ceced6','949ca5'],detail:['ef423a','bd2929','841919'],keeper:['9452bd','733a94','52296b','392142']},
 56:{shirt:['52525a','31313a','191921'],shorts:['42424a','292931','191921'],detail:['ffffff','c5c5ce','94949c'],keeper:['e6c59c','bd9c73','947352','634a39']},
 57:{shirt:['ffffff','d6d6de','a5a5b5'],shorts:['298452','196339','104229'],detail:['318c5a','216b42','104229'],keeper:['73e65a','42bd31','299421','186319']},
 58:{shirt:['427bde','2952b5','19317b'],shorts:['426bc5','294a9c','19316b'],detail:['84c5f7','529cd6','316ba5'],keeper:['84dec5','52bda5','31947b','216b5a']},
 59:{shirt:['ffde42','e6ad19','ad7b08'],shorts:['ef423a','bd2929','841919'],detail:['ef423a','bd2929','841919'],keeper:['e6c59c','bd9c73','947352','634a39']},
};
const bgr=hex=>[0,2,4].reduce((v,i)=>v|(Math.round(parseInt(hex.slice(i,i+2),16)*31/255)<<(i/2*5)),0);
function setColors(p,start,colors){colors.forEach((hex,i)=>{const c=bgr(hex),at=2+(start+i)*2;p[at]=c&255;p[at+1]=c>>8;});}
export function ggNativePhotoStyle(id){
 const style=styles[id];if(!style)return null;
 const row=structuredClone(DELUXE_REFERENCE_PHOTOS.teams[id]);
 setColors(row.palettes[0],0,[...style.shirt,...style.shorts,style.shirt[1],style.shirt[2]]);
 setColors(row.palettes[1],0,style.keeper);
 setColors(row.palettes[2],0,style.detail);
 // Stripe overlays can contain a second three-color ramp.
 if(row.bodyType===16||row.bodyType===80||row.bodyType===96)setColors(row.palettes[2],3,style.shirt);
 return row;
}
// Upgrade only unmodified reference rows. Explicit user edits are never reset.
export function upgradeGGPhotoStyle(catalog){
 if(!catalog?.teams)return;
 for(const id of Object.keys(styles))if(JSON.stringify(catalog.teams[id])===JSON.stringify(DELUXE_REFERENCE_PHOTOS.teams[id]))catalog.teams[id]=ggNativePhotoStyle(id);
}
