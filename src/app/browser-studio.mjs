import {StudioSession} from './studio-session.mjs';
import {createPlusBaseVerifier} from './plus-base-verifier.mjs';
import {createBrowserHost} from '../platform/browser-host.mjs';
import {browserSha256} from '../platform/browser-crypto.mjs';

export function createBrowserStudioSession({io,sha256}={}){
  const host=createBrowserHost({io});
  const hash=sha256??(bytes=>browserSha256(bytes));
  const verifyBase=createPlusBaseVerifier({sha256:hash});
  return new StudioSession({host,verifyBase});
}
