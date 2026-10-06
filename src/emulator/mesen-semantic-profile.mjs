function asObject(value,name){
  if(value===null||typeof value!=='object'||Array.isArray(value))throw new TypeError(`${name} object required`);
  return value;
}
function asInt(value,name,{min=0,max=Number.MAX_SAFE_INTEGER}={}){
  if(!Number.isInteger(value)||value<min||value>max)throw new TypeError(`${name} must be an integer between ${min} and ${max}`);
  return value;
}
function asName(value,name){
  if(typeof value!=='string'||!value.trim())throw new TypeError(`${name} non-empty string required`);
  return value.trim();
}
const ALLOWED_INPUTS=new Set(['a','b','x','y','l','r','start','select','up','down','left','right']);

export function normalizeSemanticProfile(profile){
  asObject(profile,'semantic profile');
  if(profile.schema!=='isssd-mesen-semantic-v1')throw new TypeError('semantic profile schema must be isssd-mesen-semantic-v1');
  const maxFrames=asInt(profile.maxFrames,'maxFrames',{min:1,max:1000000});
  if(!Array.isArray(profile.pulses))throw new TypeError('pulses array required');
  if(!Array.isArray(profile.checkpoints)||profile.checkpoints.length===0)throw new TypeError('checkpoints non-empty array required');
  const pulses=profile.pulses.map((row,index)=>{
    asObject(row,`pulse ${index}`);
    const name=asName(row.name,`pulse ${index} name`);
    const start=asInt(row.start,`pulse ${index} start`,{max:maxFrames});
    const stop=asInt(row.stop,`pulse ${index} stop`,{min:start+1,max:maxFrames});
    asObject(row.input,`pulse ${index} input`);
    const input={};
    for(const [key,value] of Object.entries(row.input)){
      if(!ALLOWED_INPUTS.has(key))throw new TypeError(`pulse ${index} unsupported input: ${key}`);
      if(value!==true&&value!==false)throw new TypeError(`pulse ${index} input ${key} must be boolean`);
      if(value)input[key]=true;
    }
    if(Object.keys(input).length===0)throw new TypeError(`pulse ${index} input must contain at least one active button`);
    return {name,start,stop,input};
  });
  const checkpoints=profile.checkpoints.map((row,index)=>{
    asObject(row,`checkpoint ${index}`);
    const name=asName(row.name,`checkpoint ${index} name`);
    const address=asInt(row.address,`checkpoint ${index} address`,{max:0x1FFFF});
    const expected=asInt(row.expected,`checkpoint ${index} expected`,{max:0xFF});
    const start=asInt(row.start,`checkpoint ${index} start`,{max:maxFrames});
    const stop=asInt(row.stop,`checkpoint ${index} stop`,{min:start+1,max:maxFrames});
    return {name,address,expected,start,stop};
  });
  return {schema:'isssd-mesen-semantic-v1',maxFrames,pulses,checkpoints};
}

function luaString(value){
  return `"${String(value).replace(/\\/g,'\\\\').replace(/"/g,'\\"')}"`;
}
function luaInput(input){
  return `{${Object.keys(input).sort().map(key=>`${key}=true`).join(',')}}`;
}

export function renderSemanticLua(profile){
  const normalized=normalizeSemanticProfile(profile);
  const pulseRows=normalized.pulses.map(p=>`  {name=${luaString(p.name)},start=${p.start},stop=${p.stop},input=${luaInput(p.input)}}`).join(',\n');
  const checkpointRows=normalized.checkpoints.map(c=>`  {name=${luaString(c.name)},address=${c.address},expected=${c.expected},start=${c.start},stop=${c.stop},seen=false}`).join(',\n');
  return `local frame=0\nlocal pulses={\n${pulseRows}\n}\nlocal checkpoints={\n${checkpointRows}\n}\n\nlocal function stateForFrame(f)\n  local state={}\n  for _,p in ipairs(pulses) do\n    if f==p.start then emu.log(\"ISSSD_SEMANTIC_INPUT \"..p.name..\" frame=\"..f) end\n    if f>=p.start and f<p.stop then\n      for k,v in pairs(p.input) do state[k]=v end\n    end\n  end\n  return state\nend\n\nlocal function checkStates(f)\n  for _,c in ipairs(checkpoints) do\n    if not c.seen and f>=c.start and f<=c.stop then\n      local value=emu.read(c.address,emu.memType.snesWorkRam,false)\n      if value==c.expected then\n        c.seen=true\n        emu.log(\"ISSSD_SEMANTIC_STATE \"..c.name..\" frame=\"..f..\" value=\"..value)\n      end\n    end\n    if not c.seen and f>c.stop then\n      emu.log(\"ISSSD_SEMANTIC_FAIL checkpoint=\"..c.name..\" frame=\"..f)\n      emu.stop(1)\n      return false\n    end\n  end\n  return true\nend\n\nemu.addEventCallback(function()\n  emu.setInput(stateForFrame(frame),1)\nend,emu.eventType.inputPolled)\n\nemu.addEventCallback(function()\n  frame=frame+1\n  if not checkStates(frame) then return end\n  if frame>=${normalized.maxFrames} then\n    local count=0\n    for _,c in ipairs(checkpoints) do if c.seen then count=count+1 end end\n    if count==#checkpoints then\n      emu.log(\"ISSSD_SEMANTIC_PASS frames=\"..frame..\" checkpoints=\"..count)\n      emu.stop(0)\n    else\n      emu.log(\"ISSSD_SEMANTIC_FAIL checkpoint=incomplete frame=\"..frame)\n      emu.stop(1)\n    end\n  end\nend,emu.eventType.endFrame)\n`;
}
