local frame = 0
local steps = 0
local active = {}

local pulses = {
  {start=360, stop=366, input={start=true}, name="start"},
  {start=520, stop=526, input={a=true}, name="a1"},
  {start=700, stop=706, input={down=true}, name="down"},
  {start=760, stop=766, input={a=true}, name="a2"},
  {start=940, stop=946, input={start=true}, name="start2"},
}

local function stateForFrame(f)
  local state={}
  for _,p in ipairs(pulses) do
    if f==p.start then
      steps=steps+1
      emu.log("ISSSD_NAV_STEP "..p.name.." frame="..f)
    end
    if f>=p.start and f<p.stop then
      for k,v in pairs(p.input) do state[k]=v end
    end
  end
  return state
end

emu.addEventCallback(function()
  emu.setInput(stateForFrame(frame),1)
end, emu.eventType.inputPolled)

emu.addEventCallback(function()
  frame=frame+1
  if frame>=1200 then
    emu.log("ISSSD_NAV_PASS frames="..frame.." steps="..steps)
    emu.exit(0)
  end
end, emu.eventType.endFrame)
