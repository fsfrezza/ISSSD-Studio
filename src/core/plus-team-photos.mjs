import {validateTeamPhotos,packTeamPhoto} from './team-photos.mjs';
export const TEAM_PHOTO_REGIONS=Object.freeze([[0x240000,0x270000],[0x47900,0x47961],[0x2FC60,0x2FC68],[0x2AFA0,0x2AFA4]]);
export const TEAM_PHOTO_HELPER=0x247A00,TEAM_PHOTO_DIRECTORY=0x247C00;
const cpu=p=>0x800000|((p>>15)<<16)|0x8000|(p&32767),word=v=>[v&255,v>>8&255],long=v=>[...word(v),v>>16&255];
export function teamPhotoSlot(team){if(!Number.isInteger(team)||team<0||team>=60)throw Error('Foto: equipe inválida.');return 0x240000+Math.floor(team/10)*0x8000+(team%10)*3104;}
class Code{constructor(){this.b=[];this.l={};this.refs=[];}e(...v){this.b.push(...v);}label(n){this.l[n]=this.b.length;}br(op,n){if(op!==0x80)this.e(({0xD0:0xF0,0xF0:0xD0,0x90:0xB0,0xB0:0x90})[op],3);this.e(0x82);this.refs.push([this.b.length,n]);this.e(0,0);}end(){for(const [at,n]of this.refs){const d=this.l[n]-at-2;this.b[at]=d&255;this.b[at+1]=d>>8&255;}return Uint8Array.from(this.b);}}
export function teamPhotoLoader(){
 const c=new Code(),e=(...v)=>c.e(...v);
 // Native entry 85:AFA0 called with JSR. The gateway runs its original body
 // through an ordinary bank-85 JSR and returns here with X = doubled team ID.
 e(0x08,0x8B,0x0B,0x48,0xDA,0x5A,0x22,...long(0x85FC60),0xA9,0,0,0x5B,0x8A,0x0A,0xAA);
 e(0xBF,...long(cpu(TEAM_PHOTO_DIRECTORY)+2),0x29,255,0);c.br(0xF0,'done');e(0x85,0x46,0xBF,...long(cpu(TEAM_PHOTO_DIRECTORY)),0x85,0x44);
 // Expand twelve source tiles per row to the native sixteen-tile OBJ stride.
 e(0xA2,0,0,0xA9,0,0);c.label('zero');e(0x9F,0,0xC0,0x7F,0xE8,0xE8,0xE0,0,0x10);c.br(0x90,'zero');e(0xA2,0,0,0xA0,0,0);
 c.label('copy');e(0xB7,0x44,0x9F,0,0xC0,0x7F,0xC8,0xC8,0xE8,0xE8,0x8A,0x29,255,1,0xC9,0x80,1);c.br(0xD0,'row');e(0x8A,0x18,0x69,0x80,0,0xAA);c.label('row');e(0xC0,0,0x0C);c.br(0x90,'copy');
 e(0xA2,0,0);c.label('palette');e(0xB7,0x44,0x9F,0xC0,0x2D,0x7E,0x9F,0xC0,0x2F,0x7E,0xC8,0xC8,0xE8,0xE8,0xE0,32,0);c.br(0x90,'palette');e(0x22,...long(0x80A310));
 e(0xA9,0x7F,0,0x85,0,0xA9,0,0xC0,0xA0,0,0x78,0xA2,0,0x10,0x22,...long(0x808E37));
 e(0xA9,0,0xF9,0x8F,0xC0,0x12,0x7E,0xA9,0,0x0C,0x8F,0xC2,0x12,0x7E,0xA9,0,0);
 for(const at of [0x1240,0x1280,0x12A0,0x12E0,0x1300,0x1320])e(0x8F,...long(0x7E0000+at));
 c.label('done');e(0x7A,0xFA,0x68,0x2B,0xAB,0x28,0x5C,...long(0x85B14D));return c.end();
}
export function plusTeamPhotosWriter(rom,state={},base=rom,selectedAreas=null){
 if(selectedAreas&&!selectedAreas.includes('selecao-equipes'))return rom;
 const photos=validateTeamPhotos(state.teamPhotosV1);if(!Object.keys(photos.teams).length)return rom;
 if(rom.length!==0x400000||[0x20,0x6F,0xAF,0xAA].some((v,i)=>base[0x2AFA0+i]!==v))throw Error('Foto: rotina de seleção incompatível.');
 const writes=[],directory=new Uint8Array(240),objects=[24];
 for(let y=0;y<4;y++)for(let x=0;x<6;x++)objects.push(y*16+8,x*16+8,0x80+y*32+x*2,0x11);
 for(const[key,photo]of Object.entries(photos.teams)){const team=Number(key),at=teamPhotoSlot(team);writes.push([at,packTeamPhoto(photo)]);directory.set(long(cpu(at)),team*4);directory[team*4+3]=1;}
 const helper=teamPhotoLoader();if(helper.length>512)throw Error('Foto: rotina excede a reserva.');
 writes.push([TEAM_PHOTO_HELPER,helper],[TEAM_PHOTO_DIRECTORY,directory],[0x47900,Uint8Array.from(objects)],[0x2FC60,Uint8Array.of(0x20,0x6F,0xAF,0xAA,0x20,0xA4,0xAF,0x6B)]);
 for(const[at,data]of writes)if(rom.slice(at,at+data.length).length!==data.length||rom.slice(at,at+data.length).some((v,i)=>v!==255&&v!==data[i]))throw Error('Foto: espaço reservado ocupado em 0x'+at.toString(16));
 for(const[at,data]of writes)rom.set(data,at);rom.set([0x5C,...long(cpu(TEAM_PHOTO_HELPER))],0x2AFA0);return rom;
}
