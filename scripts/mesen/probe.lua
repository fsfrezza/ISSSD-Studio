local frame=0
local WRAM_SIZE=0x20000
local first=nil
local stable={}
local last={}
local masks={}
local stageIndex=0

local pulses={
  {start=360,stop=366,input={start=true}},
  {start=520,stop=526,input={a=true}},
  {start=700,stop=706,input={down=true}},
  {start=760,stop=766,input={a=true}},
  {start=940,stop=946,input={start=true}},
}

local checkpoints={
  {330,340},
  {450,460},
  {610,620},
  {730,740},
  {850,860},
  {1030,1040},
}

local function inputForFrame(f)
  local state={}
  for _,p in ipairs(pulses) do
    if f>=p.start and f<p.stop then
      for k,v in pairs(p.input) do state[k]=v end
    end
  end
  return state
end

local function snapshot()
  local t={}
  for addr=0,WRAM_SIZE-1 do
    t[addr]=emu.read(addr,emu.memType.snesWorkRam,false)
  end
  return t
end

local function beginPair()
  first=snapshot()
end

local function endPair()
  stageIndex=stageIndex+1
  local bit=1 << (stageIndex-1)
  for addr=0,WRAM_SIZE-1 do
    local v=emu.read(addr,emu.memType.snesWorkRam,false)
    if v==first[addr] then
      if stageIndex==1 then
        stable[addr]=true
        last[addr]=v
        masks[addr]=0
      elseif stable[addr] then
        if v~=last[addr] then masks[addr]=masks[addr] | bit end
        last[addr]=v
      end
    elseif stageIndex==1 then
      stable[addr]=false
    elseif stable[addr] then
      stable[addr]=false
    end
  end
  first=nil
  emu.log("ISSSD_PROBE_STAGE index="..stageIndex.." frame="..frame)
end

local function bitCount(n)
  local c=0
  while n~=0 do
    if (n & 1)~=0 then c=c+1 end
    n=n >> 1
  end
  return c
end

local function finish()
  local rows={}
  for addr=0,WRAM_SIZE-1 do
    if stable[addr] and masks[addr] and masks[addr]~=0 then
      table.insert(rows,{addr=addr,mask=masks[addr],value=last[addr],changes=bitCount(masks[addr])})
    end
  end
  table.sort(rows,function(a,b)
    if a.changes~=b.changes then return a.changes>b.changes end
    return a.addr<b.addr
  end)
  local limit=math.min(#rows,128)
  for i=1,limit do
    local r=rows[i]
    emu.log(string.format("ISSSD_PROBE_CAND addr=0x%05X value=%d mask=0x%02X changes=%d",r.addr,r.value,r.mask,r.changes))
  end
  emu.log("ISSSD_PROBE_PASS frames="..frame.." candidates="..#rows)
  emu.stop(0)
end

emu.addEventCallback(function()
  emu.setInput(inputForFrame(frame),1)
end,emu.eventType.inputPolled)

emu.addEventCallback(function()
  frame=frame+1
  for _,p in ipairs(checkpoints) do
    if frame==p[1] then beginPair() end
    if frame==p[2] then endPair() end
  end
  if frame>=1200 then finish() end
end,emu.eventType.endFrame)
