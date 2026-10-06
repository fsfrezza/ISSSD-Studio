export const WINDOWS_PATH_DEFAULTS=Object.freeze({
  romDirectory:'C:\\Users\\fsfre\\Downloads\\ISSSD-Studio\\roms',
  projectDirectory:'C:\\Users\\fsfre\\Downloads\\ISSSD-Studio',
});

function clean(value,fallback){
  if(typeof value!=='string')return fallback;
  const trimmed=value.trim();
  return trimmed||fallback;
}

export function resolveWindowsPathDefaults({romDirectory,projectDirectory}={}){
  return {
    romDirectory:clean(romDirectory,WINDOWS_PATH_DEFAULTS.romDirectory),
    projectDirectory:clean(projectDirectory,WINDOWS_PATH_DEFAULTS.projectDirectory),
  };
}
