// Compare persisted text records without depending on JSON property insertion order.
export function studioTextRecordsEqual(a,b){
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 if(Array.isArray(a)!==Array.isArray(b))return false;
 const keys=Object.keys(a);
 return keys.length===Object.keys(b).length&&keys.every(k=>Object.prototype.hasOwnProperty.call(b,k)&&studioTextRecordsEqual(a[k],b[k]));
}
