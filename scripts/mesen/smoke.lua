print("ISSSD_SMOKE_LOADED")

local frames = 0
local targetFrames = 600

emu.addEventCallback(function()
  frames = frames + 1
  if frames >= targetFrames then
    print("ISSSD_SMOKE_PASS frames=" .. frames)
    emu.stop(0)
  end
end, emu.eventType.endFrame)
