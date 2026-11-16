import {splitRom} from '../src/core/deluxe-project.mjs';
import {readDeluxeScenario,scenarioTeamNames,scenarioTexts,scenarioClock,scenarioDefaultDescription,scenarioDescriptionId,scenarioTextField,validateDeluxeScenario,SCENARIO_RESTARTS,SCENARIO_COUNT,SCENARIO_BASE} from '../src/core/deluxe-scenarios.mjs';
export function installScenarioEditor({getProject,getFile,onStatus}){
 const host=document.getElementById('scenarioFields');let index=0;
 function render(message=''){const p=getProject();host.replaceChildren();if(!p)return;
  const {rom}=splitRom(getFile()),names=scenarioTeamNames(p.changes.structure),native=readDeluxeScenario(rom,index),saved=p.changes.scenarios?.[index],v={...native,...saved};
  const field=(label,element)=>{const l=document.createElement('label');l.textContent=label;l.append(element);return l;};
  const button=(label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=action;return b;};
  const nav=document.createElement('div');nav.className='group-navigation';const title=document.createElement('strong');title.className='group-navigation-title';title.textContent=`CENÁRIO ${index+1} DE ${SCENARIO_COUNT}`;nav.append(button('‹',()=>{index=(index+11)%12;render();}),title,button('›',()=>{index=(index+1)%12;render();}));host.append(nav);
  const body=document.createElement('div');body.className='card-body scenario-body';host.append(body);
  const primary=document.createElement('div');primary.className='scenario-primary';body.append(primary);
  const secondary=document.createElement('div');secondary.className='scenario-secondary';
  const input=(key,label,min,max)=>{const el=document.createElement('input');el.type='number';el.min=min;el.max=max;el.step=1;el.value=v[key];primary.append(field(label,el));return el;};
  const select=(key,label,options,row=primary)=>{const el=document.createElement('select');options.forEach((text,i)=>{let o=document.createElement('option');o.value=i;o.textContent=text;el.append(o);});el.value=v[key];row.append(field(label,el));return el;};
  const a=select('team1','Equipe do jogador',names),b=select('team2','Equipe adversária',names),g1=input('score1','Gols do jogador',0,9),g2=input('score2','Gols do adversário',0,9);
  const restart=document.createElement('input');restart.disabled=true;restart.value=SCENARIO_RESTARTS[index];primary.append(field('Jogada inicial (original)',restart));body.append(secondary);
  const clock=document.createElement('input');clock.type='text';clock.placeholder='1:14';clock.value=scenarioClock(v.seconds);secondary.append(field('Tempo restante (m:ss)',clock));
  const ref=select('referee','Árbitro',['Árbitro 1','Árbitro 2','Árbitro 3'],secondary);
  const at=SCENARIO_BASE+index*15,coord=document.createElement('input');coord.disabled=true;const dv=new DataView(rom.buffer,rom.byteOffset,rom.byteLength);coord.value=`X ${dv.getInt16(at+11,true)} / Y ${dv.getInt16(at+13,true)}`;secondary.append(field('Posição nativa da bola (fixa)',coord));
  const preview=document.createElement('pre');preview.style.whiteSpace='pre-wrap';const heading=field('Cabeçalho automático',preview);heading.className='scenario-header';body.append(heading);
  const desc=document.createElement('textarea');const descId=scenarioDescriptionId(index),sizes=scenarioTextField(descId)[3].pool.segments.map(s=>s.original.length);desc.rows=6;desc.value=saved?.description??p.changes.menuTexts?.['scenario-native']?.[descId]??scenarioTextField(descId)[2];body.append(field('Descrição (limites por linha: '+sizes.join('/')+')',desc));
  const info=document.createElement('p');info.className='hint';info.textContent='A jogada e a posição da bola são preservadas para manter a lógica original. O objetivo é vencer a partida.';body.append(info);
  function values(){const m=/^(\d):([0-5]\d)$/.exec(clock.value.trim());if(!m)throw Error('Informe o tempo no formato m:ss.');if([g1,g2].some(x=>String(x.value)===''||!Number.isInteger(Number(x.value))||Number(x.value)<0||Number(x.value)>9))throw Error('Placar inválido.');return {team1:Number(a.value),team2:Number(b.value),score1:Number(g1.value),score2:Number(g2.value),seconds:Number(m[1])*60+Number(m[2]),referee:Number(ref.value),description:desc.value};}
  function refresh(){try{preview.textContent=Object.values(scenarioTexts(index,values(),names))[0];}catch(e){preview.textContent=e.message;}}
  for(const el of [a,b,g1,g2,clock,ref,desc])el.addEventListener('input',()=>{if(el===desc)customDescription=true;clearFeedback();refresh();});
  let customDescription=!!saved;
  for(const el of [a,b,g1,g2])el.addEventListener('change',()=>{if(!customDescription)desc.value=scenarioDefaultDescription(index);clearFeedback();refresh();});
  const feedback=document.createElement('p');feedback.className='scenario-feedback';feedback.role='status';feedback.ariaLive='polite';feedback.style.margin='0';feedback.style.fontWeight='600';feedback.hidden=true;
  function showFeedback(text,error=false){feedback.textContent=text;feedback.style.color=error?'#b42318':'#18723a';feedback.hidden=false;}
  function clearFeedback(){feedback.hidden=true;feedback.textContent='';}
  for(const el of [clock,ref,desc])el.addEventListener('change',clearFeedback);
  const bar=document.createElement('div');bar.className='preset-toolbar';bar.append(button('Aplicar alterações',()=>{try{const next=values();validateDeluxeScenario(index,next,names);(p.changes.scenarios??={})[index]=next;refresh();const msg=`Cenário ${index+1}: alterações aplicadas ao projeto. Clique em Salvar projeto para gravar o arquivo.`;showFeedback(msg);onStatus(msg);}catch(e){showFeedback('Alterações não aplicadas: '+e.message,true);onStatus(e.message);}}),button('Restaurar cenário original',()=>{if(p.changes.scenarios){delete p.changes.scenarios[index];if(!Object.keys(p.changes.scenarios).length)delete p.changes.scenarios;}const msg=`Cenário ${index+1} restaurado.`;render(msg);onStatus(msg);}));body.append(bar,feedback);refresh();if(typeof message==='string'&&message)showFeedback(message);
 }
 document.addEventListener('deluxe:scenarios-open',render);return {render};
}
