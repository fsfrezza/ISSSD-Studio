const BUILD='git-visual-bridge-v1';
window.__ISSSD_GIT_VISUAL_BRIDGE__={build:BUILD,loadedAt:new Date().toISOString()};

function installBadge(){
 if(document.getElementById('isssdGitBridgeBadge'))return;
 const status=document.querySelector('.statusbar');
 if(!status)return;
 const badge=document.createElement('span');
 badge.id='isssdGitBridgeBadge';
 badge.className='badge ok';
 badge.textContent='Git Visual Bridge';
 badge.title='Interface gerada automaticamente a partir do Visual Bridge por npm run editor.';
 status.appendChild(badge);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installBadge,{once:true});
else installBadge();
window.addEventListener('load',installBadge,{once:true});
