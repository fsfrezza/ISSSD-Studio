local frames = 0
local targetFrames = 600

emu.addEventCallback(function()
  frames = frames + 1
  if frames >= targetFrames then
    emu.log("ISSSD_SMOKE_PASS frames=" .. frames)
    emu.exit(0)
  end
end, emu.eventType.endFrame)
