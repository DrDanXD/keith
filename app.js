/* KEITH v3 · Radar, Global map, Brain dump, Today, People. Data stays in this browser. */
(function(){
"use strict";
/* ---------- model ---------- */
const SLICES=[
 {id:"family",name:"Family",side:"personal",a0:90,a1:135},
 {id:"childhood",name:"Childhood",side:"personal",a0:135,a1:180},
 {id:"friends",name:"Friends",side:"personal",a0:180,a1:225},
 {id:"love",name:"Love",side:"personal",a0:225,a1:270},
 {id:"mentors",name:"Mentors",side:"professional",a0:45,a1:90},
 {id:"colleagues",name:"Bosses & Colleagues",short:"Colleagues",side:"professional",a0:0,a1:45},
 {id:"builders",name:"Builders",side:"professional",a0:-45,a1:0},
 {id:"industry",name:"Industry",side:"professional",a0:-90,a1:-45}];
const SL=Object.fromEntries(SLICES.map(s=>[s.id,s]));
const RINGS=[null,{n:"Core",d:14,r0:.08,r1:.28},{n:"Close",d:30,r0:.30,r1:.48},{n:"Active",d:90,r0:.50,r1:.68},{n:"Wide",d:180,r0:.70,r1:.86}];
const LOST_R=.95;
const LAWS=["Build it before you need it.","Don't keep score. Generosity is the currency.","Ping constantly. Relationships die of neglect, not conflict.","Be the connector. The best ping helps them.","Gratitude is a ping. Tell people what they made possible.","Never eat alone. Turn the call into a coffee.","Follow up or fail. A warm thread goes cold in weeks."];
const CITIES={"baltimore":[39.29,-76.61],"washington":[38.91,-77.04],"washington dc":[38.91,-77.04],"new york":[40.71,-74.01],"nyc":[40.71,-74.01],"boston":[42.36,-71.06],"cambridge":[42.37,-71.11],"philadelphia":[39.95,-75.17],"san francisco":[37.77,-122.42],"bay area":[37.6,-122.2],"palo alto":[37.44,-122.14],"los angeles":[34.05,-118.24],"seattle":[47.61,-122.33],"chicago":[41.88,-87.63],"austin":[30.27,-97.74],"miami":[25.76,-80.19],"atlanta":[33.75,-84.39],"toronto":[43.65,-79.38],"london":[51.51,-0.13],"paris":[48.86,2.35],"berlin":[52.52,13.4],"dubai":[25.2,55.27],"singapore":[1.35,103.82],"tokyo":[35.68,139.69],"sydney":[-33.87,151.21],"bangalore":[12.97,77.59],"bengaluru":[12.97,77.59],"chennai":[13.08,80.27],"coimbatore":[11.02,76.96],"tiruppur":[11.11,77.34],"tirupur":[11.11,77.34],"vellore":[12.92,79.13],"madurai":[9.93,78.12],"erode":[11.34,77.72],"salem":[11.66,78.15],"trichy":[10.79,78.7],"tiruchirappalli":[10.79,78.7],"kochi":[9.93,76.27],"hyderabad":[17.39,78.49],"mumbai":[19.08,72.88],"pune":[18.52,73.86],"delhi":[28.61,77.21],"new delhi":[28.61,77.21],"gurgaon":[28.46,77.03],"kolkata":[22.57,88.36],"ooty":[11.41,76.7],"pollachi":[10.66,77.01]};

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const ymd=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const today=()=>ymd(new Date());
function daysSince(s){const [y,m,d]=s.split("-").map(Number);const b=new Date();b.setHours(0,0,0,0);return Math.round((b-new Date(y,m-1,d))/864e5)}
function addDays(n){const d=new Date();d.setDate(d.getDate()+n);return ymd(d)}
function slug(s){return(String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"p").slice(0,60)}
function ago(n){if(n<=0)return"today";if(n===1)return"yesterday";if(n<60)return n+" days ago";if(n<730)return Math.round(n/30)+" months ago";return Math.round(n/365)+" years ago"}
const initials=n=>n.replace(/\(.*?\)/g,"").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("");
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return(h>>>0)/4294967295}
const firstName=n=>n.replace(/\s*\(.*\)/,"").split(" ")[0];

/* ---------- store ---------- */
const KEY="keith.v3";let S;
const DEF_SETTINGS={key:"",model:"claude-sonnet-5-5",lang:"en-IN",hometown:"",currentCity:"Baltimore",daily:3};
function migrate(p){if(p.slice&&p.ring)return p;
  const school=["Neighborhood","Sai Baba","Century Foundation","Spring Mount","Chaitanya"].includes(p.chapter);
  let slice="friends";const c=p.circle;
  if(c==="family")slice="family";else if(c==="love")slice="love";else if(c==="mentor")slice="mentors";else if(c==="colleague")slice="colleagues";
  else if(c==="teacher")slice=school?"childhood":"mentors";else if(school)slice="childhood";
  const ring=p.tier===1?2:p.tier===3?4:3;
  const known={"rithanya":"Bangalore","kingsley":"Coimbatore","harish-spring-mount":"New York","riley":"Baltimore"};
  return{...p,slice,ring,city:p.city||known[p.id]||""}}
function load(){try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}
  if(!S||!Array.isArray(S.people)){let old=null;try{old=JSON.parse(localStorage.getItem("keith.v2"))}catch(e){}
    const base=old&&Array.isArray(old.people)?old.people:(window.KEITH_SEED||[]);
    S={people:base.map(p=>migrate({...p})),dumps:[],drafts:(old&&old.drafts)||{},settings:{...DEF_SETTINGS,...((old&&old.settings)||{})}};persist()}
  S.settings={...DEF_SETTINGS,...S.settings};S.dumps=S.dumps||[];S.drafts=S.drafts||{};S.people=S.people.map(migrate)}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast("Couldn't save. Download a backup now.")}}
const find=id=>S.people.find(p=>p.id===id);
function upsert(p){const i=S.people.findIndex(x=>x.id===p.id);if(i<0)S.people.push(p);else S.people[i]=p;persist()}
const hasKey=()=>!!(S.settings.key||"").trim();

/* ---------- warmth ---------- */
const cad=p=>(RINGS[p.ring]||RINGS[3]).d;
function temp(p){if(p.lost)return"lost";if(!p.lastContact)return"cold";const s=daysSince(p.lastContact);if(s<cad(p))return"warm";if(s<cad(p)*2)return"cool";return"cold"}
function due(p){if(p.lost)return null;if(p.snoozeUntil&&p.snoozeUntil>today())return{due:false};if(!p.lastContact)return{due:true,never:true,over:cad(p)};const s=daysSince(p.lastContact);return{due:s>=cad(p),over:s-cad(p),since:s}}
const score=(p,d)=>d.over/cad(p)+(5-(p.ring||3))*.5+(p.toTell?.5:0);
const dueList=()=>S.people.map(p=>({p,d:due(p)})).filter(x=>x.d&&x.d.due).sort((a,b)=>score(b.p,b.d)-score(a.p,a.d));
function cityOf(p){const c=(p.city||"").trim();if(c)return c;if(p.slice==="childhood"&&S.settings.hometown)return S.settings.hometown;return""}
function coords(p){if(p.lat!=null&&p.lng!=null&&p.lat!==""&&p.lng!=="")return[+p.lat,+p.lng];const c=cityOf(p).toLowerCase().split(",")[0].trim();return CITIES[c]||null}

/* ---------- UI helpers ---------- */
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),2800)}
function openSheet(html){$("#sheet-root").innerHTML=`<div class="scrim" id="scrim"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  $("#scrim").addEventListener("click",e=>{if(e.target.id==="scrim"||e.target.closest("[data-close]"))closeSheet()})}
function closeSheet(){$("#sheet-root").innerHTML=""}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeSheet()});
function countTo(el,n){const from=+el.textContent||0;if(from===n||matchMedia("(prefers-reduced-motion: reduce)").matches){el.textContent=n;return}
  const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/650),e=1-Math.pow(1-k,3);el.textContent=Math.round(from+(n-from)*e);if(k<1)requestAnimationFrame(f)})(t0)}
const waLink=(p,msg)=>{const d=String(p.contact||"").replace(/[^\d]/g,"");const t=encodeURIComponent(msg||"");return d.length>=8?`https://wa.me/${d}?text=${t}`:`https://wa.me/?text=${t}`};
const liLink=p=>"https://www.linkedin.com/search/results/people/?keywords="+encodeURIComponent(p.name.replace(/\s*\(.*\)/,""));
async function copy(text){try{await navigator.clipboard.writeText(text);return true}catch(_){const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand("copy")}catch(__){}ta.remove();return ok}}

/* ---------- Claude ---------- */
async function claude(prompt,max){
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":S.settings.key.trim(),"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body:JSON.stringify({model:S.settings.model||"claude-sonnet-5-5",max_tokens:max||4000,messages:[{role:"user",content:prompt}]})});
  if(!r.ok){let m="";try{m=(await r.json()).error.message}catch(_){}throw{status:r.status,message:m}}
  const j=await r.json();return(j.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n")}
function parseJSON(t){t=String(t||"");try{return JSON.parse(t)}catch(_){}const m=t.match(/```(?:json)?\s*([\s\S]*?)```/);if(m){try{return JSON.parse(m[1])}catch(_){}}const a=t.indexOf("{"),b=t.lastIndexOf("}");if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1))}catch(_){}}return null}
function errMsg(e){if(!e)return"Something went wrong.";if(e.status===401)return"API key rejected. Check it in settings.";if(e.status===429)return"Rate limited. Try in a minute.";if(/credit|billing/i.test(e.message||""))return"Your Anthropic account needs credits.";if(e.status===404)return"Model not found. Change it in settings.";return e.message||"Couldn't reach Claude."}
function extractPrompt(text){
  return `You are sorting a voice brain dump into a personal relationship map. Read the transcript and list every real person the speaker mentions (skip celebrities he only name-drops, skip the speaker himself).

Existing people (if it's the same person, put their exact existing name in "match"): ${S.people.map(p=>p.name).join(" | ")||"none"}

Slices. Personal side: family, childhood (neighbors, school friends, school teachers), friends (teen, college, adult friends), love. Professional side: mentors (professors, guides, people who advise him), colleagues (bosses and coworkers), builders (cofounders, founders, startup people, cohort peers), industry (people in fields he's targeting, senior leaders he wants to know).
Ring = closeness: 1 core (handful of closest), 2 close, 3 active, 4 wide.
City: where the person lives now if said, else where he knew them. Give lat and lng for the city if you know it.

Reply with ONLY JSON in this exact shape:
{"people":[{"name":"","match":null,"slice":"friends","ring":3,"city":"","lat":null,"lng":null,"relation":"short role","story":"1 to 2 sentences using his own details","toTell":"what he wants to say to them, or empty","give":"one give-first idea, or empty","lost":false}]}
lost is true only if he says he lost touch or can't reach them.

TRANSCRIPT:
${text}`}

/* ---------- views ---------- */
let view="radar",radarMode="radar",sliceFilter=null;
function show(v){view=v;["radar","dump","today","people"].forEach(k=>$("#v-"+k).hidden=k!==v);$$(".dock button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));try{localStorage.setItem("keith.view",v)}catch(_){}window.scrollTo({top:0});if(v==="radar")renderRadarView()}
$$(".dock button").forEach(b=>b.onclick=()=>show(b.dataset.v));

/* ---------- RADAR ---------- */
const NS="http://www.w3.org/2000/svg";let freshIds=new Set();
function polar(r,deg){const a=deg*Math.PI/180;return[Math.cos(a)*r,-Math.sin(a)*r]}
function arcPath(r0,r1,a0,a1){const [x0,y0]=polar(r0,a0),[x1,y1]=polar(r1,a0),[x2,y2]=polar(r1,a1),[x3,y3]=polar(r0,a1);return`M${x0},${y0}L${x1},${y1}A${r1},${r1} 0 0 0 ${x2},${y2}L${x3},${y3}A${r0},${r0} 0 0 1 ${x0},${y0}Z`}
function renderRadar(){const R=168,svg=$("#radar");let h=`<defs><radialGradient id="sweepG" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="scale(${R})"><stop offset="0" stop-color="rgba(226,196,138,0)"/><stop offset="1" stop-color="rgba(226,196,138,.10)"/></radialGradient></defs>`;
  h+=`<path class="sweep" d="M0,0 L${R},0 A${R},${R} 0 0 0 ${polar(R,28)[0]},${polar(R,28)[1]} Z"/>`;
  for(let i=1;i<=4;i++)h+=`<circle class="ring" r="${RINGS[i].r1*R}"/>`;h+=`<circle class="ring lost" r="${LOST_R*R}"/>`;
  SLICES.forEach(s=>{const [x,y]=polar(R*.98,s.a0);h+=`<line class="spoke" x1="0" y1="0" x2="${x}" y2="${y}"/>`;h+=`<path class="sector ${sliceFilter===s.id?"on":""}" data-slice="${s.id}" d="${arcPath(R*.08,R*.99,s.a0,s.a1)}"/>`});
  h+=`<line class="divide" x1="0" y1="${-R}" x2="0" y2="${R}"/>`;
  SLICES.forEach(s=>{const mid=(s.a0+s.a1)/2,[x,y]=polar(R*1.08,mid);const anchor=x<-5?"end":x>5?"start":"middle";const n=S.people.filter(p=>p.slice===s.id).length;
    h+=`<text class="slab ${sliceFilter===s.id?"hot":""}" x="${x}" y="${y+3}" text-anchor="${anchor}" data-slice="${s.id}">${esc(s.short||s.name)} ${n}</text>`});
  for(let i=1;i<=4;i++)h+=`<text class="rlab" x="4" y="${-RINGS[i].r1*R+10}">${RINGS[i].n}</text>`;
  h+=`<text class="side" x="${-R}" y="${-R-14}" text-anchor="start">PERSONAL</text><text class="side" x="${R}" y="${-R-14}" text-anchor="end">PROFESSIONAL</text>`;
  h+=`<circle class="youglow" r="16"/><circle class="you" r="5"/>`;
  S.people.forEach(p=>{const s=SL[p.slice]||SL.friends,ring=RINGS[p.ring]||RINGS[3];const h1=hash(p.id),h2=hash(p.id+"r");
    const ang=s.a0+4+(s.a1-s.a0-8)*h1;const rr=p.lost?LOST_R*R+(h2-.5)*6:(ring.r0+(ring.r1-ring.r0)*h2)*R;const [x,y]=polar(rr,ang);const t=temp(p);const dim=sliceFilter&&sliceFilter!==p.slice;
    h+=`<circle class="dot ${t} ${freshIds.has(p.id)?"new":""}" data-id="${esc(p.id)}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${p.ring===1?5:4}" opacity="${dim?.2:1}"><title>${esc(p.name)}</title></circle>`});
  svg.innerHTML=h;freshIds.clear()}
$("#radar").addEventListener("click",e=>{const d=e.target.closest(".dot");if(d){openEdit(find(d.dataset.id));return}const s=e.target.closest("[data-slice]");if(s){sliceFilter=sliceFilter===s.dataset.slice?null:s.dataset.slice;renderRadarView()}});
$("#slice-clear").onclick=()=>{sliceFilter=null;renderRadarView()};
function renderGaps(){const out=[];const per=S.people.filter(p=>SL[p.slice]?.side==="personal"),pro=S.people.filter(p=>SL[p.slice]?.side==="professional");
  SLICES.forEach(s=>{const n=S.people.filter(p=>p.slice===s.id).length;if(!n)out.push(`<b>${s.name}</b> is empty. ${s.id==="industry"?"Add the people you want to know in consulting and longevity.":s.id==="family"?"Start with the people who raised you.":"Do a brain dump on this part of your life."}`)});
  const core=S.people.filter(p=>p.ring===1);if(!core.length)out.push(`Your <b>Core ring is empty</b>. Who are the 5 people you'd call first?`);
  const coldCore=core.filter(p=>temp(p)!=="warm");if(coldCore.length)out.push(`<b>${coldCore.length} of your Core</b> haven't heard from you recently: ${coldCore.slice(0,3).map(p=>esc(firstName(p.name))).join(", ")}.`);
  const tgt=(S.settings.targetCity||"Boston");const inTgt=S.people.filter(p=>SL[p.slice]?.side==="professional"&&cityOf(p).toLowerCase().startsWith(tgt.toLowerCase())).length;
  out.push(`<b>${inTgt} professional ${inTgt===1?"contact":"contacts"} in ${esc(tgt)}</b>.${inTgt<5?" That's thin for where you want to work.":""}`);
  if(pro.length<per.length/2)out.push(`Professional side is <b>${pro.length}</b> vs personal <b>${per.length}</b>. Build it before you need it.`);
  const noCity=S.people.filter(p=>!coords(p)).length;if(noCity)out.push(`<b>${noCity} people</b> have no city, so they're missing from the Global map.`);
  $("#gaps").innerHTML=out.slice(0,5).map(t=>`<div class="gap"><i class="d"></i><div>${t}</div></div>`).join("")||`<div class="gap"><i class="d"></i><div>No gaps. Go ping someone.</div></div>`}
function renderSliceList(){const head=$("#slice-head"),box=$("#slice-list");if(!sliceFilter){head.hidden=true;box.innerHTML="";$("#r-filter-label").textContent="tap a slice";return}
  const s=SL[sliceFilter];head.hidden=false;$("#slice-title").textContent=s.name;$("#r-filter-label").textContent=s.side;
  const ps=S.people.filter(p=>p.slice===sliceFilter).sort((a,b)=>a.ring-b.ring||a.name.localeCompare(b.name));
  box.innerHTML=ps.length?ps.map(prow).join(""):`<div class="empty"><b>Nobody here yet</b>Brain dump about your ${esc(s.name.toLowerCase())} and they'll appear.</div>`}
function prow(p){const c=cityOf(p);return`<button class="prow" data-edit="${esc(p.id)}"><div class="av ${p.ring===1?"sig":""}">${esc(initials(p.name))}</div><div class="who"><b>${esc(p.name)}</b><span>${esc(p.relation||SL[p.slice]?.name||"")}${c?" · "+esc(c):""}</span></div><i class="state ${temp(p)}" title="${temp(p)}"></i></button>`}
document.addEventListener("click",e=>{const b=e.target.closest("[data-edit]");if(b)openEdit(find(b.dataset.edit))});

/* map */
let land=null,landTried=false;
async function loadLand(){if(landTried)return;landTried=true;try{const r=await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json");const t=await r.json();land=topojson.feature(t,t.objects.land);renderMap()}catch(_){}}
function renderMap(){const svg=$("#map"),W=800,H=420;let h="";const groups={};
  S.people.forEach(p=>{const c=coords(p);if(!c)return;const k=c.join(",");(groups[k]??={lat:c[0],lng:c[1],name:cityOf(p)||"Pinned",people:[]}).people.push(p)});
  const list=Object.values(groups).sort((a,b)=>b.people.length-a.people.length);
  let proj=null;
  if(window.d3&&d3.geoNaturalEarth1){proj=d3.geoNaturalEarth1().fitExtent([[10,10],[W-10,H-10]],{type:"Sphere"});const path=d3.geoPath(proj);
    h+=`<path class="grat" d="${path(d3.geoGraticule10())}"/>`;if(land)h+=`<path class="land" d="${path(land)}"/>`;else loadLand()}
  const P=(lat,lng)=>proj?proj([lng,lat]):[(lng+180)/360*W,(90-lat)/180*H];
  const placed=[];list.forEach(g=>{const [x,y]=P(g.lat,g.lng);const r=4+Math.sqrt(g.people.length)*3;
    let ly=y+3;while(placed.some(q=>Math.abs(q.x-x)<70&&Math.abs(q.y-ly)<13))ly+=13;const lab=placed.length<10;if(lab)placed.push({x,y:ly});
    h+=`<g class="city" data-city="${esc(g.name)}"><circle class="halo" cx="${x}" cy="${y}" r="${r*2.2}"/><circle class="core" cx="${x}" cy="${y}" r="${Math.max(2.5,r*.55)}"/>${lab?`<text x="${x+r+4}" y="${ly}">${esc(g.name)} ${g.people.length}</text>`:""}</g>`});
  svg.innerHTML=h;
  const mx=Math.max(1,...list.map(g=>g.people.length));const noCity=S.people.filter(p=>!coords(p)).length;
  $("#city-list").innerHTML=(list.map(g=>`<div class="cityrow"><b>${esc(g.name)}</b><span class="mono hint">${g.people.length}</span><div class="bar"><i style="width:${g.people.length/mx*100}%"></i></div></div>`).join("")||`<div class="cityrow"><b>No cities yet</b></div>`)
    +(noCity?`<div class="cityrow"><b style="color:var(--mist)">No city yet</b><span class="mono hint">${noCity}</span><button class="pill ghost" id="fix-cities" style="height:32px">Set hometown</button></div>`:"");
  const fx=$("#fix-cities");if(fx)fx.onclick=openSettings}
$("#map").addEventListener("click",e=>{const g=e.target.closest(".city");if(!g)return;const name=g.dataset.city;const ps=S.people.filter(p=>(cityOf(p)||"Pinned")===name);
  openSheet(`<h2>${esc(name)} · ${ps.length}</h2>${ps.map(prow).join("")}<div class="acts"><button class="pill ghost" data-close>Close</button></div>`)});
$$("[data-rm]").forEach(b=>b.onclick=()=>{radarMode=b.dataset.rm;$$("[data-rm]").forEach(x=>x.classList.toggle("on",x===b));$("#radar-pane").hidden=radarMode!=="radar";$("#map-pane").hidden=radarMode!=="map";if(radarMode==="map")renderMap()});
function renderRadarView(){countTo($("#r-total"),S.people.length);
  countTo($("#r-per"),S.people.filter(p=>SL[p.slice]?.side==="personal").length);countTo($("#r-pro"),S.people.filter(p=>SL[p.slice]?.side==="professional").length);
  renderRadar();renderGaps();renderSliceList();if(radarMode==="map")renderMap()}

/* ---------- BRAIN DUMP ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null,wanted=false,t0=0,tick=0,elapsed=0;
const ta=$("#transcript");
try{ta.value=localStorage.getItem("keith.draftDump")||""}catch(_){}
ta.addEventListener("input",()=>{try{localStorage.setItem("keith.draftDump",ta.value)}catch(_){}});
function appendText(t){t=t.trim();if(!t)return;const cur=ta.value.replace(/\s+$/,"");ta.value=(cur?cur+(/[.!?]$/.test(cur)?" ":". "):"")+t.charAt(0).toUpperCase()+t.slice(1);ta.scrollTop=ta.scrollHeight;try{localStorage.setItem("keith.draftDump",ta.value)}catch(_){}}
function fmt(ms){const s=Math.floor(ms/1000);return pad(Math.floor(s/60))+":"+pad(s%60)}
function startRec(){if(!SR){toast("Live listening needs Chrome. Use your keyboard's mic in the box instead.");ta.focus();return}
  wanted=true;t0=Date.now()-elapsed;$("#mic").classList.add("rec");$("#mic-stage").classList.add("rec-on");$("#mic").setAttribute("aria-label","Stop listening");$('.dock button[data-v="dump"]').classList.add("rec-dot");
  clearInterval(tick);tick=setInterval(()=>{elapsed=Date.now()-t0;$("#timer").innerHTML=`listening · <b>${fmt(elapsed)}</b>`},500);boot()}
function boot(){if(!wanted)return;try{rec=new SR();rec.lang=S.settings.lang||"en-IN";rec.continuous=true;rec.interimResults=true;
  rec.onresult=e=>{let interim="";for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)appendText(r[0].transcript);else interim+=r[0].transcript}$("#interim").textContent=interim};
  rec.onerror=e=>{if(e.error==="not-allowed"||e.error==="service-not-allowed"){stopRec();toast("Mic blocked. Allow it in the address bar, then tap again.")}};
  rec.onend=()=>{$("#interim").textContent="";if(wanted)setTimeout(boot,250)};
  rec.start()}catch(_){if(wanted)setTimeout(boot,600)}}
function stopRec(){wanted=false;try{rec&&rec.stop()}catch(_){}clearInterval(tick);$("#mic").classList.remove("rec");$("#mic-stage").classList.remove("rec-on");$("#mic").setAttribute("aria-label","Start listening");$('.dock button[data-v="dump"]').classList.remove("rec-dot");
  $("#timer").innerHTML=`paused · <b>${fmt(elapsed)}</b> · tap to keep going`}
$("#mic").onclick=()=>wanted?stopRec():startRec();
function saveDump(silent){const text=ta.value.trim();if(!text){if(!silent)toast("Nothing to save yet.");return null}
  const d={id:"d"+Date.now(),date:new Date().toISOString(),text,secs:Math.round(elapsed/1000),sorted:false};S.dumps.unshift(d);persist();renderDumps();if(!silent)toast("Dump saved.");return d}
$("#save-dump").onclick=()=>{if(wanted)stopRec();if(saveDump()){ta.value="";elapsed=0;try{localStorage.removeItem("keith.draftDump")}catch(_){}$("#timer").innerHTML="tap to start · <b>00:00</b>"}};
$("#clear-dump").onclick=e=>{const b=e.currentTarget;if(!ta.value.trim())return;if(b.dataset.armed){if(wanted)stopRec();ta.value="";elapsed=0;try{localStorage.removeItem("keith.draftDump")}catch(_){}b.textContent="Clear";delete b.dataset.armed;$("#timer").innerHTML="tap to start · <b>00:00</b>"}else{b.dataset.armed="1";b.textContent="Tap again to clear";setTimeout(()=>{b.textContent="Clear";delete b.dataset.armed},3000)}};
$("#sort-btn").onclick=async()=>{if(wanted)stopRec();const text=ta.value.trim();if(!text){toast("Talk first, then sort.");return}
  const d=saveDump(true);ta.value="";elapsed=0;try{localStorage.removeItem("keith.draftDump")}catch(_){}$("#timer").innerHTML="tap to start · <b>00:00</b>";sortDump(d)};
async function sortDump(d){if(!d)return;
  if(hasKey()){const b=$("#sort-btn");b.disabled=true;b.textContent="Keith is reading…";
    try{const out=parseJSON(await claude(extractPrompt(d.text)));const list=(out&&out.people||[]).filter(x=>x&&x.name);if(!list.length)toast("No people found in that dump.");else openReview(list,d)}catch(e){toast(errMsg(e));freeSort(d)}
    b.disabled=false;b.textContent="Sort onto radar";return}
  freeSort(d)}
function freeSort(d){const prompt=extractPrompt(d.text);
  openSheet(`<h2>Sort with Claude</h2><p class="hint" style="margin-top:-6px">No API key yet, so we hand it to your Claude app. Takes 20 seconds.</p>
  <div class="step"><span class="n">1</span><div style="flex:1"><div>Copy the dump with Keith's instructions.</div><div class="acts" style="margin-top:8px"><button class="pill gold" id="fs-copy">Copy for Claude</button><a class="pill" href="https://claude.ai/new" target="_blank" rel="noopener">Open Claude</a></div></div></div>
  <div class="step"><span class="n">2</span><div>Paste it into a Claude chat and send.</div></div>
  <div class="step"><span class="n">3</span><div style="flex:1">Copy Claude's whole reply and paste it here.<div class="f" style="margin-top:8px"><textarea id="fs-reply" placeholder='{"people":[ … ]}'></textarea></div></div></div>
  <div class="acts"><button class="pill solid" id="fs-go">Read reply</button><button class="pill ghost" data-close>Later</button></div>`);
  $("#fs-copy").onclick=async()=>{toast(await copy(prompt)?"Copied. Paste it into Claude.":"Copy failed. Long-press to copy instead.")};
  $("#fs-go").onclick=()=>{const j=parseJSON($("#fs-reply").value);const list=(j&&j.people||[]).filter(x=>x&&x.name);if(!list.length){toast("Couldn't read that. Paste Claude's full reply.");return}openReview(list,d)}}
function renderDumps(){$("#dump-count").textContent=S.dumps.length?S.dumps.length+" saved":"";
  $("#dump-list").innerHTML=S.dumps.length?S.dumps.slice(0,30).map(d=>{const dt=new Date(d.date);return`<div class="dump-row"><div class="t"><b>${dt.toLocaleDateString(undefined,{month:"short",day:"numeric"})} · ${d.secs?fmt(d.secs*1000):d.text.split(/\s+/).length+" words"}${d.sorted?' <span class="chip sig" style="padding:1px 8px;margin-left:6px">sorted</span>':""}</b><span>${esc(d.text.slice(0,90))}</span></div><div style="display:flex;gap:6px;flex:none"><button class="pill" style="height:34px;padding:0 12px" data-dsort="${d.id}">${d.sorted?"Re-sort":"Sort"}</button><button class="pill ghost" style="height:34px;padding:0 10px" data-dopen="${d.id}">Read</button></div></div>`}).join("")
    :`<div class="dump-row"><div class="t"><span>Your saved dumps show up here.</span></div></div>`}
$("#dump-list").addEventListener("click",e=>{const s=e.target.closest("[data-dsort]"),o=e.target.closest("[data-dopen]");
  if(s)sortDump(S.dumps.find(d=>d.id===s.dataset.dsort));
  if(o){const d=S.dumps.find(x=>x.id===o.dataset.dopen);openSheet(`<h2>${new Date(d.date).toLocaleString()}</h2><p style="white-space:pre-wrap;color:var(--haze)">${esc(d.text)}</p><div class="acts"><button class="pill" id="dd-copy">Copy</button><button class="pill ghost" id="dd-del" style="color:#EE8A6E">Delete</button><button class="pill ghost" data-close>Close</button></div>`);
    $("#dd-copy").onclick=async()=>toast(await copy(d.text)?"Copied.":"Copy failed.");
    $("#dd-del").onclick=e2=>{const b=e2.currentTarget;if(b.dataset.armed){S.dumps=S.dumps.filter(x=>x.id!==d.id);persist();renderDumps();closeSheet()}else{b.dataset.armed="1";b.textContent="Tap again to delete"}}}});

/* review extracted people */
const sliceOpts=v=>SLICES.map(s=>`<option value="${s.id}" ${s.id===v?"selected":""}>${s.side==="personal"?"Personal":"Pro"} · ${s.name}</option>`).join("");
const ringOpts=v=>[1,2,3,4].map(r=>`<option value="${r}" ${+v===r?"selected":""}>${RINGS[r].n}</option>`).join("");
function openReview(list,d){const byName=n=>S.people.find(p=>p.name.toLowerCase()===String(n||"").toLowerCase());
  list.forEach(x=>{const m=byName(x.match)||byName(x.name);x._m=m&&m.id;if(!SL[x.slice])x.slice=m?m.slice:"friends";x.ring=[1,2,3,4].includes(+x.ring)?+x.ring:(m?m.ring:3)});
  const nNew=list.filter(x=>!x._m).length;
  openSheet(`<h2>Found ${list.length} ${list.length===1?"person":"people"}</h2><p class="hint" style="margin-top:-6px">${nNew} new, ${list.length-nNew} updates. Fix anything wrong, untick what you don't want.</p>
  ${list.map((x,i)=>`<div class="rv"><input type="checkbox" checked data-i="${i}" aria-label="Keep ${esc(x.name)}"><div style="min-width:0;flex:1"><b>${esc(x.name)}</b><span class="tag ${x._m?"":"new"}">${x._m?"update":"new"}</span>
    <div class="rel">${esc(x.relation||"")}${x.city?" · "+esc(x.city):""}</div>
    <div><select data-s="${i}" aria-label="Slice">${sliceOpts(x.slice)}</select><select data-r="${i}" aria-label="Ring">${ringOpts(x.ring)}</select></div>
    ${x.story?`<p>${esc(x.story)}</p>`:""}</div></div>`).join("")}
  <div class="acts" style="margin-top:14px"><button class="pill solid" id="rv-save">Add to radar</button><button class="pill ghost" data-close>Cancel</button></div>`);
  $("#rv-save").onclick=()=>{let n=0;
    $$(".rv").forEach((row,i)=>{if(!row.querySelector("input[type=checkbox]").checked)return;const x=list[i];
      const slice=row.querySelector("[data-s]").value,ring=+row.querySelector("[data-r]").value;
      const clean={slice,ring,relation:String(x.relation||"").slice(0,120),city:String(x.city||"").slice(0,60),lat:x.lat??null,lng:x.lng??null,story:String(x.story||"").slice(0,800),toTell:String(x.toTell||"").slice(0,400),give:String(x.give||"").slice(0,300),lost:!!x.lost};
      const m=x._m&&find(x._m);
      if(m){const story=m.story&&clean.story&&!m.story.includes(clean.story)?m.story+" "+clean.story:(m.story||clean.story);
        upsert({...m,slice,ring,story:story.slice(0,1500),city:m.city||clean.city,lat:m.lat??clean.lat,lng:m.lng??clean.lng,toTell:m.toTell||clean.toTell,give:m.give||clean.give,relation:m.relation||clean.relation});freshIds.add(m.id)}
      else{let id=slug(x.name);if(find(id))id+="-"+Math.random().toString(36).slice(2,6);upsert({id,name:String(x.name).slice(0,80),...clean,contact:"",lastContact:null,snoozeUntil:null,log:[],createdAt:today()});freshIds.add(id)}n++});
    if(d){d.sorted=true;persist()}closeSheet();renderAll();show("radar");toast(`${n} ${n===1?"person":"people"} on your radar.`)}}

/* ---------- TODAY ---------- */
let showAll=false;
function defaultGive(p){const s=p.slice;if(s==="family")return"Call, don't text. Ask about their week first.";if(s==="mentors")return"Share one win they made possible. Ask how you can help.";
  if(s==="childhood")return"Tell them where you are now and thank them for one specific thing.";if(SL[s]?.side==="professional")return"Send an article, intro or idea that helps them. No ask.";return"Send a memory you share. Suggest a call."}
function templateDraft(p){const f=firstName(p.name),t=p.toTell?" "+p.toTell:"";
  if(/ma'am|sir/i.test(p.name))return`Hi ${p.name}, this is Dhiyanesh. I think about your class more than you'd guess.${t||" I'm at Johns Hopkins now doing my masters."} Thank you for everything. Would love to call you sometime.`;
  if(p.slice==="family")return`Hey ${f}, thinking of you. How's your week going? Let's call this weekend.`;
  if(SL[p.slice]?.side==="professional")return`Hi ${f}, Dhiyanesh here. Saw something today that made me think of you. How are things on your side? Would love 15 minutes to catch up when you're free.`;
  return`Hey ${f}, it's Dan. It's been too long.${t} How are you? Let's talk soon.`}
function renderToday(){const list=dueList(),n=showAll?list.length:Math.min(S.settings.daily,list.length);countTo($("#h-due"),n);
  $("#h-law").innerHTML=`<b>${esc(LAWS[new Date().getDate()%LAWS.length])}</b>`;
  const warm=S.people.filter(p=>temp(p)==="warm").length;$("#h-chips").innerHTML=`<span class="chip sig"><i class="dot"></i>${warm} warm</span><span class="chip">${list.length} due</span>`;
  $("#today-list").innerHTML=!S.people.length?`<div class="empty"><b>No one yet</b>Do a brain dump and your people land here.</div>`:!list.length?`<div class="empty"><b>You're caught up</b>Come back tomorrow, or dump another chapter of your life.</div>`
    :list.slice(0,n).map(({p,d})=>{const dr=S.drafts[p.id]||"";return`<article class="glass card rise"><div class="row"><div style="min-width:0"><div class="name">${esc(p.name)}</div><div class="rel">${esc(p.relation||SL[p.slice]?.name||"")}${cityOf(p)?" · "+esc(cityOf(p)):""}</div></div>
      <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex:none"><span class="chip sig">${RINGS[p.ring].n}</span><span class="chip">${d.never?"never logged":ago(d.since)}</span></div></div>
      ${p.story?`<p class="story">${esc(p.story)}</p>`:""}${p.toTell?`<p class="tell"><span class="label">Tell them</span>${esc(p.toTell)}</p>`:""}
      <p class="tell" style="color:var(--haze)"><span class="label" style="color:var(--haze)">Give first</span>${esc(p.give||defaultGive(p))}</p>
      <textarea class="draft" data-draft="${esc(p.id)}" placeholder="Your message" aria-label="Message to ${esc(p.name)}">${esc(dr)}</textarea>
      <div class="acts"><button class="pill gold" data-act="draft" data-id="${esc(p.id)}">${dr?"Redraft":"Draft it"}</button><button class="pill" data-act="copy" data-id="${esc(p.id)}">Copy</button>
      <a class="pill" data-wa="${esc(p.id)}" href="${waLink(p,dr)}" target="_blank" rel="noopener">WhatsApp</a>${SL[p.slice]?.side==="professional"?`<a class="pill" href="${liLink(p)}" target="_blank" rel="noopener">LinkedIn</a>`:""}
      <button class="pill solid" data-act="done" data-id="${esc(p.id)}">Pinged ✓</button><button class="pill ghost" data-act="snooze" data-id="${esc(p.id)}">Next week</button></div></article>`}).join("");
  const extra=list.length-n;$("#more-wrap").hidden=!(extra>0||(showAll&&list.length>S.settings.daily));$("#more-btn").textContent=showAll?"Show only "+S.settings.daily:`Show ${extra} more`}
$("#more-btn").onclick=()=>{showAll=!showAll;renderToday()};
document.addEventListener("input",e=>{const id=e.target.dataset&&e.target.dataset.draft;if(!id)return;S.drafts[id]=e.target.value;persist();const a=document.querySelector(`[data-wa="${CSS.escape(id)}"]`),p=find(id);if(a&&p)a.href=waLink(p,e.target.value)});
document.addEventListener("click",async e=>{const b=e.target.closest("[data-act]");if(!b)return;const p=find(b.dataset.id);if(!p)return;const act=b.dataset.act;const ta2=document.querySelector(`[data-draft="${CSS.escape(p.id)}"]`);
  if(act==="draft"){let t;if(hasKey()){b.disabled=true;b.textContent="Drafting…";try{t=(await claude(`Write one short WhatsApp message from Dhiyanesh (friends call him Dan) to ${p.name}. Who they are: ${p.relation||SL[p.slice]?.name}. Story: ${p.story||"none"}. What he wants to tell them: ${p.toTell||"nothing specific"}. Give-first idea: ${p.give||defaultGive(p)}. Last contact: ${p.lastContact?ago(daysSince(p.lastContact)):"long ago"}. He's doing an MS in Management at Johns Hopkins Carey in Baltimore, from Tamil Nadu, biotech background, aiming for healthcare strategy consulting. Lead with them. Give before asking. Sir or ma'am for teachers and elders. Casual and warm, short direct sentences, very few commas, no em dashes, no hyphens. 2 to 4 sentences. Reply with only the message.`,300)).trim()}catch(err){toast(errMsg(err))}b.disabled=false}
    if(!t)t=templateDraft(p);S.drafts[p.id]=t;persist();if(ta2)ta2.value=t;b.textContent="Redraft";const a=document.querySelector(`[data-wa="${CSS.escape(p.id)}"]`);if(a)a.href=waLink(p,t);return}
  if(act==="copy"){const t=S.drafts[p.id]||"";if(!t){toast("Nothing to copy yet.");return}toast(await copy(t)?"Copied.":"Copy failed.");return}
  if(act==="done"){const log=(p.log||[]).slice(-29);log.push({date:today(),note:(S.drafts[p.id]||"Pinged").slice(0,280)});upsert({...p,lastContact:today(),snoozeUntil:null,log});delete S.drafts[p.id];persist();renderAll();toast(`Logged. ${firstName(p.name)} is warm.`);return}
  if(act==="snooze"){upsert({...p,snoozeUntil:addDays(7)});renderAll();toast("Moved to next week.")}});

/* ---------- PEOPLE ---------- */
let filter="all",q="";
function renderPeople(){const opts=[["all","All"],["personal","Personal"],["professional","Professional"],...SLICES.map(s=>[s.id,s.short||s.name]),["cold","Going cold"],["lost","Lost"]];
  $("#filters").innerHTML=opts.map(([k,l])=>`<button class="chip ${filter===k?"on":""}" data-filter="${k}">${esc(l)}</button>`).join("");
  const qq=q.trim().toLowerCase();const ps=S.people.filter(p=>{if(qq&&!(p.name+" "+(p.relation||"")+" "+cityOf(p)+" "+(p.story||"")).toLowerCase().includes(qq))return false;
    if(filter==="all")return true;if(filter==="lost")return p.lost;if(filter==="cold")return temp(p)==="cold"&&!p.lost;if(filter==="personal"||filter==="professional")return SL[p.slice]?.side===filter;return p.slice===filter});
  if(!ps.length){$("#people-list").innerHTML=`<div class="empty"><b>${S.people.length?"No matches":"Nobody yet"}</b>${S.people.length?"Try another filter.":"Do a brain dump to fill this."}</div>`;return}
  $("#people-list").innerHTML=SLICES.map(s=>{const g=ps.filter(p=>p.slice===s.id).sort((a,b)=>a.ring-b.ring||a.name.localeCompare(b.name));return g.length?`<div class="group"><div class="label">${s.side} · ${esc(s.name)} · ${g.length}</div>${g.map(prow).join("")}</div>`:""}).join("")}
$("#search").oninput=e=>{q=e.target.value;renderPeople()};
$("#filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(b){filter=b.dataset.filter;renderPeople()}});
$("#add-btn").onclick=()=>openEdit(null);
function openEdit(p){const n=!p;p=p||{name:"",relation:"",slice:sliceFilter||"friends",ring:3,city:"",story:"",toTell:"",give:"",contact:"",lastContact:null,lost:false,log:[]};
  openSheet(`<h2>${n?"Add person":esc(p.name)}</h2><form id="ed">
  <div class="f"><label class="label" for="f-name">Name</label><input id="f-name" required value="${esc(p.name)}"></div>
  <div class="f"><label class="label" for="f-rel">Who they are to you</label><input id="f-rel" value="${esc(p.relation)}" placeholder="English teacher, Spring Mount"></div>
  <div class="g2"><div class="f"><label class="label" for="f-sl">Slice</label><select id="f-sl">${sliceOpts(p.slice)}</select></div><div class="f"><label class="label" for="f-city">City</label><input id="f-city" value="${esc(p.city||"")}" placeholder="${esc(p.slice==="childhood"&&S.settings.hometown?S.settings.hometown:"Baltimore")}"></div></div>
  <div class="f"><span class="label">Ring</span><div class="seg">${[1,2,3,4].map(r=>`<label><input type="radio" name="ring" value="${r}" ${+p.ring===r?"checked":""}><span>${RINGS[r].n} · ${RINGS[r].d}d</span></label>`).join("")}</div></div>
  <div class="g2"><div class="f"><label class="label" for="f-con">WhatsApp number</label><input id="f-con" value="${esc(p.contact||"")}" placeholder="+91…"></div><div class="f"><label class="label" for="f-last">Last contact</label><input id="f-last" type="date" value="${esc(p.lastContact||"")}"></div></div>
  <div class="f"><label class="label" for="f-story">Your story with them</label><textarea id="f-story">${esc(p.story||"")}</textarea></div>
  <div class="f"><label class="label" for="f-tell">What you want to tell them</label><input id="f-tell" value="${esc(p.toTell||"")}"></div>
  <div class="f"><label class="label" for="f-give">Give-first idea</label><input id="f-give" value="${esc(p.give||"")}"></div>
  <label class="cb"><input type="checkbox" id="f-lost" ${p.lost?"checked":""}> Lost touch, track them down</label>
  ${!n&&(p.log||[]).length?`<div class="f"><span class="label">Ping log</span><div class="log">${p.log.slice().reverse().map(l=>`<div><span class="mono">${esc(l.date)}</span><span>${esc(l.note)}</span></div>`).join("")}</div></div>`:""}
  <div class="acts">${!n&&SL[p.slice]?.side==="professional"?`<a class="pill" href="${liLink(p)}" target="_blank" rel="noopener">LinkedIn</a>`:""}<button class="pill solid" type="submit">Save</button><button class="pill ghost" type="button" data-close>Close</button>${n?"":`<button class="pill ghost" type="button" id="del" style="margin-left:auto;color:#EE8A6E">Delete</button>`}</div></form>`);
  $("#ed").onsubmit=ev=>{ev.preventDefault();const name=$("#f-name").value.trim();if(!name)return;let id=p.id;if(!id){id=slug(name);if(find(id))id+="-"+Math.random().toString(36).slice(2,6);freshIds.add(id)}
    const city=$("#f-city").value.trim();const ring=+(document.querySelector('input[name="ring"]:checked')||{}).value||3;
    upsert({...p,id,name,relation:$("#f-rel").value.trim(),slice:$("#f-sl").value,ring,city,lat:city!==p.city?null:p.lat,lng:city!==p.city?null:p.lng,contact:$("#f-con").value.trim(),lastContact:$("#f-last").value||null,story:$("#f-story").value.trim(),toTell:$("#f-tell").value.trim(),give:$("#f-give").value.trim(),lost:$("#f-lost").checked,log:p.log||[],createdAt:p.createdAt||today()});
    closeSheet();renderAll();toast("Saved "+firstName(name)+".")};
  const del=$("#del");if(del)del.onclick=()=>{if(del.dataset.armed){S.people=S.people.filter(x=>x.id!==p.id);persist();closeSheet();renderAll();toast("Deleted.")}else{del.dataset.armed="1";del.textContent="Tap again to delete"}}}

/* ---------- settings / backup ---------- */
function openSettings(){openSheet(`<h2>Settings</h2>
  <div class="g2"><div class="f"><label class="label" for="s-home">Hometown</label><input id="s-home" value="${esc(S.settings.hometown)}" placeholder="Tiruppur"></div><div class="f"><label class="label" for="s-tgt">Target city</label><input id="s-tgt" value="${esc(S.settings.targetCity||"Boston")}"></div></div>
  <p class="hint" style="margin:-4px 0 12px">Childhood people without a city get your hometown on the map. Gaps track your professional network in the target city.</p>
  <div class="g2"><div class="f"><label class="label" for="s-lang">Listening accent</label><select id="s-lang">${[["en-IN","English (India)"],["en-US","English (US)"],["en-GB","English (UK)"],["ta-IN","Tamil"]].map(([v,l])=>`<option value="${v}" ${S.settings.lang===v?"selected":""}>${l}</option>`).join("")}</select></div><div class="f"><label class="label" for="s-daily">Pings per day</label><input id="s-daily" type="number" min="1" max="20" value="${S.settings.daily}"></div></div>
  <div class="f"><label class="label" for="s-key">Claude API key (optional)</label><input id="s-key" type="password" value="${esc(S.settings.key)}" placeholder="sk-ant-…"><span class="hint">With a key, Sort is one tap and drafts sound like you. Stored only in this browser. console.anthropic.com</span></div>
  <div class="f"><label class="label" for="s-model">Model</label><input id="s-model" value="${esc(S.settings.model)}"></div>
  <div class="acts"><button class="pill solid" id="s-save">Save</button><button class="pill" id="s-import">Import backup</button><input type="file" id="s-file" accept=".json,application/json" hidden><button class="pill ghost" id="s-reset" style="margin-left:auto;color:#EE8A6E">Reset all</button></div>`);
  $("#s-save").onclick=()=>{Object.assign(S.settings,{hometown:$("#s-home").value.trim(),targetCity:$("#s-tgt").value.trim()||"Boston",lang:$("#s-lang").value,daily:Math.max(1,+$("#s-daily").value||3),key:$("#s-key").value.trim(),model:$("#s-model").value.trim()||"claude-sonnet-5-5"});persist();closeSheet();renderAll();toast("Saved.")};
  $("#s-import").onclick=()=>$("#s-file").click();
  $("#s-file").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(!Array.isArray(j.people))throw 0;
    const keep=S.settings;S={people:j.people.map(migrate),dumps:j.dumps||[],drafts:j.drafts||{},settings:{...DEF_SETTINGS,...(j.settings||{}),key:keep.key||((j.settings||{}).key)||""}};persist();closeSheet();renderAll();toast(`Loaded ${S.people.length} people.`)}catch(_){toast("That file isn't a KEITH backup.")}};
  $("#s-reset").onclick=e=>{const b=e.currentTarget;if(b.dataset.armed){localStorage.removeItem(KEY);localStorage.removeItem("keith.v2");load();closeSheet();renderAll();toast("Reset.")}else{b.dataset.armed="1";b.textContent="Tap again to wipe everything"}}}
$("#btn-settings").onclick=openSettings;
$("#btn-export").onclick=()=>{const out={...S,settings:{...S.settings,key:""}};const blob=new Blob([JSON.stringify(out,null,1)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="keith-backup-"+today()+".json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast("Backup downloaded.")};

/* ---------- boot ---------- */
function renderAll(){renderRadarView();renderToday();renderPeople();renderDumps()}
load();renderAll();let v0="radar";try{v0=localStorage.getItem("keith.view")||"radar"}catch(_){}if(!["radar","dump","today","people"].includes(v0))v0="radar";show(v0);
if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
})();
