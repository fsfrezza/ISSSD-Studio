export const PLUS_TACTICAL_RECORD_SIZE=31;
export const PLUS_TACTICAL_PLAYER_COUNT=10;

export const PLUS_TACTICAL_ZONES=Object.freeze({
  DF:Object.freeze({min:-57,max:-18,base:-39,bits:1}),
  MC:Object.freeze({min:-18,max:18,base:0,bits:2}),
  AT:Object.freeze({min:18,max:57,base:39,bits:3}),
});

function requireRecord(bytes){
  if(!(bytes instanceof Uint8Array)||bytes.length!==PLUS_TACTICAL_RECORD_SIZE){
    throw new TypeError('31-byte Uint8Array tactical record required');
  }
  return bytes;
}

function signed8(value){return value>=0x80?value-0x100:value;}
function byteFromSigned(value){return value<0?value+0x100:value;}

function classFromBits(flag){
  const bits=flag&0x03;
  return bits===1?'DF':bits===2?'MC':bits===3?'AT':null;
}

function normalizeClass(value){
  const c=String(value??'').trim().toUpperCase();
  if(c==='DF')return 'DF';
  if(c==='MC'||c==='MF')return 'MC';
  if(c==='AT'||c==='FW')return 'AT';
  throw new RangeError('tactical class must be DF, MC/MF or AT/FW');
}

function zoneForClass(className){return PLUS_TACTICAL_ZONES[className]||PLUS_TACTICAL_ZONES.AT;}

function int(value,label){
  const n=Number(value);
  if(!Number.isInteger(n))throw new TypeError(label+' must be an integer');
  return n;
}

export function decodePlusTacticalRecord(bytes){
  const raw=requireRecord(bytes);
  const players=[];
  for(let i=0;i<PLUS_TACTICAL_PLAYER_COUNT;i++){
    const nativeDx=signed8(raw[1+i*2]);
    const nativeDy=signed8(raw[2+i*2]);
    const flag=raw[21+i];
    const className=classFromBits(flag);
    const zone=zoneForClass(className);
    players.push({
      index:i,
      nativeDx,nativeDy,
      x:zone.base+nativeDx,
      y:nativeDy,
      className,
      attack:!!(flag&0x04),
      flag,
    });
  }
  return {formationIndex:raw[0],players};
}

export function encodePlusTacticalRecord(baseRecord,semantic={}){
  const base=requireRecord(baseRecord);
  if(semantic===null||typeof semantic!=='object'||Array.isArray(semantic))throw new TypeError('tactical semantic state must be an object');
  const out=base.slice();

  if(semantic.formationIndex!==undefined){
    const formation=int(semantic.formationIndex,'formationIndex');
    if(formation<0||formation>15)throw new RangeError('formationIndex must be 0..15');
    out[0]=formation;
  }

  if(semantic.players!==undefined&&!Array.isArray(semantic.players))throw new TypeError('tactical players must be an array');
  for(let pos=0;pos<(semantic.players?.length||0);pos++){
    const player=semantic.players[pos];
    if(!player||typeof player!=='object'||Array.isArray(player))throw new TypeError('tactical player must be an object');
    const index=int(player.index??pos,'tactical player index');
    if(index<0||index>=PLUS_TACTICAL_PLAYER_COUNT)throw new RangeError('tactical player index must be 0..9');

    const className=player.className==null?classFromBits(out[21+index]):normalizeClass(player.className);
    if(!className)throw new RangeError('tactical class bits are invalid');
    const zone=zoneForClass(className);
    const x=int(player.x,'tactical X');
    const y=int(player.y,'tactical Y');
    if(x<zone.min||x>zone.max)throw new RangeError(`${className} tactical X must be ${zone.min}..${zone.max}`);
    if(y<-39||y>39)throw new RangeError('tactical Y must be -39..39');
    if(className==='AT'&&player.attack)throw new RangeError('AT tactical player cannot use attack flag');

    const nativeDx=x-zone.base;
    if(nativeDx<-40||nativeDx>40)throw new RangeError('native tactical X delta must be -40..40');
    out[1+index*2]=byteFromSigned(nativeDx);
    out[2+index*2]=byteFromSigned(y);

    const oldFlag=out[21+index];
    out[21+index]=(oldFlag&0xF8)|zone.bits|(player.attack?0x04:0);
  }

  return out;
}
