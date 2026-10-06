import {assertHostBridge} from '../platform/host-bridge.mjs';
import {canonicalProjectOpen} from '../core/project-open.mjs';
import {buildPlusProjectRom} from '../core/project-build.mjs';

function cloneValue(value){
  if(typeof structuredClone==='function')return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function cloneBytes(value,label='bytes'){
  if(!(value instanceof Uint8Array))throw new TypeError(label+' must be Uint8Array');
  return new Uint8Array(value);
}

export class StudioSession{
  #host;
  #verifyBase;
  #baseRom=null;
  #baseName=null;
  #project=null;
  #projectName=null;
  #canonicalProject=null;
  #lastBuild=null;

  constructor({host,verifyBase}={}){
    this.#host=assertHostBridge(host);
    if(typeof verifyBase!=='function')throw new TypeError('verifyBase function required');
    this.#verifyBase=verifyBase;
  }

  get hasBase(){return this.#baseRom!==null;}
  get hasProject(){return this.#project!==null;}
  get baseName(){return this.#baseName;}
  get projectName(){return this.#projectName;}
  get baseRom(){return this.#baseRom?new Uint8Array(this.#baseRom):null;}
  get canonicalProject(){return this.#canonicalProject?cloneValue(this.#canonicalProject):null;}
  get lastBuild(){return this.#lastBuild?{...this.#lastBuild,rom:new Uint8Array(this.#lastBuild.rom)}:null;}

  async openRom(){
    const picked=await this.#host.openRom();
    const bytes=cloneBytes(picked?.bytes,'base ROM');
    await this.#verifyBase(new Uint8Array(bytes));
    this.#baseRom=bytes;
    this.#baseName=String(picked?.name||'base.sfc');
    this.#lastBuild=null;
    return {name:this.#baseName,bytes:new Uint8Array(bytes)};
  }

  async openProject(){
    const picked=await this.#host.openProject();
    const project=cloneValue(picked?.project);
    const canonical=canonicalProjectOpen(project);
    this.#project=project;
    this.#projectName=String(picked?.name||'project.issdproj');
    this.#canonicalProject=canonical;
    this.#lastBuild=null;
    return {name:this.#projectName,canonical:cloneValue(canonical)};
  }

  build(options={}){
    if(!this.#baseRom||!this.#project)throw new Error('base ROM and project are required before build');
    const result=buildPlusProjectRom(this.#baseRom,this.#project,options);
    this.#lastBuild={...result,rom:new Uint8Array(result.rom)};
    return {...result,rom:new Uint8Array(result.rom)};
  }

  async saveProject(options={}){
    if(!this.#project)throw new Error('project is not loaded');
    return this.#host.saveProject(cloneValue(this.#project),options);
  }

  async exportBuilt(options={}){
    if(!this.#lastBuild)throw new Error('build is required before ROM export');
    return this.#host.exportRom(new Uint8Array(this.#lastBuild.rom),options);
  }
}
