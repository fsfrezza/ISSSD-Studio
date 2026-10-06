export const WINDOWS_PATH_DEFAULTS=Object.freeze({
  romDirectory:'C:\\Users\\fsfre\\Downloads\\ISSSD-Studio\\roms',
  projectDirectory:'C:\\Users\\fsfre\\Downloads\\ISSSD-Studio',
  romFileName:'International Superstar Soccer Deluxe Plus.sfc',
  projectFileName:'International-Superstar-Soccer-Deluxe-Plus-projeto.issdproj',
});

function clean(value,fallback){
  if(typeof value!=='string')return fallback;
  const trimmed=value.trim();
  return trimmed||fallback;
}

export function resolveWindowsPathDefaults({romDirectory,projectDirectory,romFileName,projectFileName}={}){
  return {
    romDirectory:clean(romDirectory,WINDOWS_PATH_DEFAULTS.romDirectory),
    projectDirectory:clean(projectDirectory,WINDOWS_PATH_DEFAULTS.projectDirectory),
    romFileName:clean(romFileName,WINDOWS_PATH_DEFAULTS.romFileName),
    projectFileName:clean(projectFileName,WINDOWS_PATH_DEFAULTS.projectFileName),
  };
}
