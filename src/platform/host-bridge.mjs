export const HOST_BRIDGE_METHODS=Object.freeze([
  'openRom',
  'openProject',
  'saveProject',
  'exportRom',
]);

export function assertHostBridge(bridge){
  if(bridge===null||typeof bridge!=='object'||Array.isArray(bridge)){
    throw new TypeError('host bridge object required');
  }
  for(const method of HOST_BRIDGE_METHODS){
    if(typeof bridge[method]!=='function'){
      throw new TypeError(`host bridge method required: ${method}`);
    }
  }
  return bridge;
}
