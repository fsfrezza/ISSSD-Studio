import {isRetiredTeamExpansion} from '../../src/core/retired-team-expansion.mjs';
export function assertCurrentEditorFeatures(html){
 if(isRetiredTeamExpansion(html))throw Error('Editor antigo: ainda contém a extensão de equipes removida. Feche o servidor antigo e execute npm run serve:editor nesta pasta.');
 if(!html.includes('__ISSSD_PROJECT_TEAM_RECORDS_GUARD__')||!html.includes('__ISSSD_INSTALL_UNIFIED_TEAM_CORE__')||!html.includes('id="isssd-independent-teams"')||!html.includes('__ISSSD_INDEPENDENT_TEAMS_EDITOR__'))throw Error('Editor desatualizado: suporte às seis equipes GG ausente. Execute npm run serve:editor para reconstruir o Editor.');
}
