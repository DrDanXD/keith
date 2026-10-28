/* KEITH · personal relationship manager. Runs fully in the browser. Data stays on this device. */
(function(){
"use strict";
const CHAPTERS=["Family","Neighborhood","Sai Baba","Century Foundation","Spring Mount","Chaitanya","VIT","Bangalore","Work","JHU","Baltimore","Life"];
const CIRCLES=["family","mentor","teacher","friend","classmate","colleague","wellwisher","love"];
const CADENCE={1:30,2:90,3:180};
const TIER={1:"monthly",2:"quarterly",3:"twice a year"};
const LAWS=["Build it before you need it.","Don't keep score. Generosity is the currency.","Ping constantly. Relationships die of neglect, not conflict.","Be the connector. The best ping helps them.","Gratitude is a ping. Tell people what they made possible.","Never eat alone. Turn the call into a coffee.","Follow up or fail. A warm thread goes cold in weeks."];
const CHAPTER_HINT={
 "Family":"parents, sister, grandparents, cousins, aunts and uncles, who raised him",
 "Neighborhood":"the neighborhood he grew up in: neighbors, early mentors, childhood friends",
 "Sai Baba":"pre-KG at Sai Baba school: earliest memories, first friends and teachers",
 "Century Foundation":"Century Foundation school, grades 1 to 5: friends, teachers, the day he left",
 "Spring Mount":"Spring Mount school, grades 5 to 10: teachers, seniors, classmates, sports, the principal",
 "Chaitanya":"Chaitanya, grades 11 and 12: exam years, friends, teachers who pushed him",
 "VIT":"VIT Vellore B.Tech biotech: lab mentors, faculty, Riviera and Gravitas teams, startup cofounders",
 "Bangalore":"the Bangalore startup year and Draper Startup House: founders, community people, mentors",
 "Work":"CMC, IISc, Biocon Biologics, Biopeak Health, caddie days, his clothing brand: bosses, mentors, colleagues",
 "JHU":"Johns Hopkins Carey: professors, cohort reps, classmates, advisors",
 "Baltimore":"life in Baltimore: new friends, local people, communities",
 "Life":"the big ones: the most important person in his life, first love, well-wishers, people he owes a thank you"};
const SCRIPT={
 "Family":["Let's start at home. Who raised you, and what is one thing about them you'd never want to forget?","Tell me about your sister. What's a memory with her that still makes you smile?","Who in your extended family quietly looked out for you? Grandparents, an aunt, an uncle?","If you could tell one family member something today you've never said, who and what?"],
 "Neighborhood":["Picture the street you grew up on. Who was the first neighbor that comes to mind?","Was there an older person nearby who treated you like you mattered? What did they do?","Who did you play with every evening? Where are they now?","Who from that street have you lost touch with and would love to find again?"],
 "Sai Baba":["Your earliest school memory. What do you see?","Was there a teacher who was kind to you when you were tiny?","Any friend from those years whose name you still remember?"],
 "Century Foundation":["Grades 1 to 5. Who was your first real friend there?","Which teacher saw something in you? Tell me about one moment with them.","Tell me about the day you left Century Foundation. Who was there?","Who from that school would be proud to hear where you are now?"],
 "Spring Mount":["Spring Mount. Which teacher changed how you think?","Who were the seniors you looked up to? What did they show you?","Which classmates are you still close to, and which ones do you keep meaning to call?","Who taught you a sport or a skill there? What did that give you?","Is there a parent of a friend who became a mentor to you?"],
 "Chaitanya":["The exam years. Who got you through them?","Was there a teacher who pushed you harder than the rest? How did that feel then and now?","Which friend from those two years do you still think about?"],
 "VIT":["VIT. Who was the first professor who treated you like a researcher, not a student?","Tell me about the people you built things with. Balmin, Zybotex, the fest teams. Who stood out?","Who in the lab or faculty opened a door for you? What was the door?","Who from VIT is doing something now that you admire?"],
 "Bangalore":["Draper Startup House. Who was the first founder who took you seriously?","Who taught you the most that year, even in one conversation?","Which people from that community would you like to keep warm?"],
 "Work":["Think about every boss you've had. Who was the best one, and why?","At Biocon or Biopeak, who went out of their way for you?","Caddie days. Who did you meet on the course that stayed with you?","Which former colleague would you call first if you needed advice today?"],
 "JHU":["Carey so far. Which professor do you want to know you by name?","Who in your cohort has already become a real friend?","Who at Hopkins could be a mentor if you asked?"],
 "Baltimore":["Outside school, who have you met in Baltimore that you'd like to see again?","Any local person who was kind to you when you were new here?"],
 "Life":["The most important person in your life. Tell me about them.","Your first love. What did they teach you about yourself?","Who believed in you before you believed in yourself?","Who do you owe a thank you that you've never said out loud?","If you could have dinner with three people from your past tonight, who?"]};

const $=s=>document.querySelector(s);const $$=s=>document.querySelectorAll(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const ymd=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const today=()=>ymd(new Date());
function daysSince(s){const [y,m,d]=s.split("-").map(Number);const a=new Date(y,m-1,d);const b=new Date();b.setHours(0,0,0,0);return Math.round((b-a)/864e5)}
function addDays(n){const d=new Date();d.setDate(d.getDate()+n);return ymd(d)}
function slug(s){return (String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"p").slice(0,60)}
function ago(n){if(n<=0)return"today";if(n===1)return"yesterday";if(n<60)return n+" days ago";if(n<730)return Math.round(n/30)+" months ago";return Math.round(n/365)+" years ago"}
function initials(n){return n.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("")}

/* ---------- store ---------- */
const KEY="keith.v2";
let S;
function load(){try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}
  if(!S||!Array.isArray(S.people)){S={people:(window.KEITH_SEED||[]).map(p=>({...p})),turns:[],chapter:"Family",chaptersDone:[],extractedUpTo:0,scriptIdx:{},drafts:{},
    settings:{key:"",model:"claude-sonnet-5-5",voice:"",daily:3,goal:30,handsFree:true,speak:true}};persist()}
  S.settings=Object.assign({key:"",model:"claude-sonnet-5-5",voice:"",daily:3,goal:30,handsFree:true,speak:true},S.settings||{});
  S.drafts=S.drafts||{};S.scriptIdx=S.scriptIdx||{};}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast("Couldn't save. Storage may be full.")}}
const hasKey=()=>!!(S.settings.key&&S.settings.key.trim());
const find=id=>S.people.find(p=>p.id===id);
function upsert(p){const i=S.people.findIndex(x=>x.id===p.id);if(i<0)S.people.push(p);else S.people[i]=p;persist()}

/* ---------- relationship math ---------- */
const cad=p=>CADENCE[p.tier]||90;
function due(p){if(p.lost)return null;if(p.snoozeUntil&&p.snoozeUntil>today())return{due:false,snoozed:true};
  if(!p.lastContact)return{due:true,never:true,overdue:cad(p),since:null};const since=daysSince(p.lastContact);return{due:since>=cad(p),overdue:since-cad(p),since}}
function temp(p){if(p.lost)return"lost";if(!p.lastContact)return"cold";const s=daysSince(p.lastContact);if(s<cad(p))return"warm";if(s<cad(p)*2)return"cool";return"cold"}
const score=(p,d)=>d.overdue/cad(p)+(4-(p.tier||2))*.4+(p.toTell?.5:0);
const dueList=()=>S.people.map(p=>({p,d:due(p)})).filter(x=>x.d&&x.d.due).sort((a,b)=>score(b.p,b.d)-score(a.p,a.d));
function defaultGive(p){const c=p.circle;
  if(c==="teacher")return"Tell them what you're doing now and thank them for one specific thing.";
  if(c==="mentor")return"Share one win they helped make possible. Ask how you can help them.";
  if(c==="family")return"Call, don't text. Ask about their week before yours.";
  if(p.type==="professional"||c==="colleague")return"Send an article, intro or idea that helps them. No ask.";
  if(c==="wellwisher")return"Tell them where you are now. They'll want to know.";
  return"Send a memory you share. Suggest a call."}
function templateDraft(p){const first=p.name.replace(/\s*\(.*\)/,"").split(" ")[0];const t=p.toTell?" "+p.toTell:"";
  if(p.circle==="teacher")return`Hi ${p.name}, this is Dhiyanesh. I think about your class more than you'd guess.${t||" I'm at Johns Hopkins now doing my masters."} Thank you for everything. Would love to call you sometime.`;
  if(p.circle==="family")return`Hey ${first}, thinking of you. How's your week going? Let's call this weekend.`;
  if(p.type==="professional")return`Hi ${first}, Dhiyanesh here. Saw something today that made me think of you${p.story?" and our time together":""}. How are things on your side? Would love to catch up for 15 minutes when you're free.`;
  return`Hey ${first}, it's Dan. It's been too long.${p.story?" Was just remembering "+p.story.split(".")[0].toLowerCase()+".":""} How are you? Let's talk soon.`}

/* ---------- UI helpers ---------- */
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),2600)}
function openSheet(html){$("#sheet-root").innerHTML=`<div class="scrim" id="scrim"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  $("#scrim").addEventListener("click",e=>{if(e.target.id==="scrim"||e.target.closest("[data-close]"))closeSheet()});}
function closeSheet(){$("#sheet-root").innerHTML=""}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeSheet()});
function waLink(p,msg){const d=String(p.contact||"").replace(/[^\d]/g,"");const t=encodeURIComponent(msg||"");return d.length>=8?`https://wa.me/${d}?text=${t}`:`https://wa.me/?text=${t}`}
const liLink=p=>"https://www.linkedin.com/search/results/people/?keywords="+encodeURIComponent(p.name.replace(/\s*\(.*\)/,""));

/* ---------- Claude ---------- */
async function claude(opts){
  if(!hasKey())throw{code:"no_key"};
  const body={model:S.settings.model||"claude-sonnet-5-5",max_tokens:opts.max_tokens||800,messages:opts.messages};
  if(opts.system)body.system=opts.system;if(opts.tools)body.tools=opts.tools;
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":S.settings.key.trim(),"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify(body)});
  if(!r.ok){let m="";try{m=(await r.json()).error.message}catch(_){ }throw{code:"http",status:r.status,message:m}}
  return r.json();}
const textOf=res=>(res.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n").trim();
function parseJSON(t){try{return JSON.parse(t)}catch(_){const m=t.match(/```(?:json)?\s*([\s\S]*?)```/);if(m){try{return JSON.parse(m[1])}catch(__){}}const a=t.indexOf("{"),b=t.lastIndexOf("}");if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1))}catch(___){}}return null}}
function errMsg(e){if(!e)return"Something went wrong.";if(e.code==="no_key")return"Add your Claude API key in settings to unlock this.";
  if(e.status===401)return"That API key was rejected. Check it in settings.";if(e.status===404||/model/i.test(e.message||""))return"Model not found. Change the model name in settings.";
  if(e.status===429)return"Rate limited. Give it a minute.";if(e.status===400&&/credit|billing/i.test(e.message||""))return"Your Anthropic account needs credits.";return e.message||"Couldn't reach Claude. Try again."}

/* ---------- voice ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null,listening=false,speaking=false;
function voices(){try{return speechSynthesis.getVoices()}catch(_){return[]}}
function pickVoice(){const vs=voices();if(!vs.length)return null;if(S.settings.voice){const v=vs.find(v=>v.name===S.settings.voice);if(v)return v}
  const pref=["Samantha","Google UK English Female","Karen","Moira","Daniel","Google US English","Microsoft Aria Online (Natural) - English (United States)"];
  for(const n of pref){const v=vs.find(v=>v.name===n);if(v)return v}return vs.find(v=>/^en/i.test(v.lang))||vs[0]}
function speak(text,onEnd){try{if(!S.settings.speak||!window.speechSynthesis){onEnd&&onEnd();return}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);const v=pickVoice();if(v)u.voice=v;u.rate=.98;u.pitch=1;
  speaking=true;setOrb("talking","keith is speaking");u.onend=u.onerror=()=>{speaking=false;setOrb("","tap the mic");onEnd&&onEnd()};speechSynthesis.speak(u)}catch(_){onEnd&&onEnd()}}
function setOrb(cls,label){const o=$("#orb");o.className="orb"+(cls?" "+cls:"");$("#orb-state").textContent=label}
function startListening(){
  if(!SR){toast("Voice input needs Chrome or Safari. Type instead.");return}
  if(listening)return;try{speechSynthesis.cancel()}catch(_){}
  rec=new SR();rec.lang="en-IN";rec.interimResults=true;rec.continuous=false;let finalText="";
  const live=document.createElement("div");live.className="msg u live";live.textContent="…";$("#thread").appendChild(live);
  rec.onresult=e=>{let interim="";for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=t;else interim+=t}live.textContent=(finalText+interim)||"…"};
  rec.onerror=e=>{listening=false;live.remove();$("#mic").classList.remove("on");setOrb("","tap the mic");if(e.error==="not-allowed")toast("Microphone blocked. Allow it in the browser address bar.");else if(e.error!=="aborted"&&e.error!=="no-speech")toast("Didn't catch that. Try again.")};
  rec.onend=()=>{listening=false;$("#mic").classList.remove("on");live.remove();const v=finalText.trim();if(v){sendTurn(v)}else setOrb("","tap the mic")};
  try{rec.start();listening=true;$("#mic").classList.add("on");setOrb("listening","listening")}catch(_){listening=false;live.remove();toast("Couldn't start the microphone.")}}
function stopListening(){try{rec&&rec.stop()}catch(_){}}
$("#mic").onclick=()=>{if(listening)stopListening();else if(speaking){try{speechSynthesis.cancel()}catch(_){}speaking=false;startListening()}else startListening()};

/* ---------- Keith conversation ---------- */
let busy=false;
function systemPrompt(){const known=S.people.map(p=>p.name).slice(0,200).join(", ");
  return `You are Keith, a warm, curious, unhurried life-story interviewer, inspired by Keith Ferrazzi's Never Eat Alone. You are talking by voice with Dhiyanesh (friends call him Dan), 21, from Tamil Nadu, now doing an MS in Management at Johns Hopkins Carey in Baltimore. Biotech background from VIT Vellore, a startup year in Bangalore, internships at CMC, IISc, Biocon and Biopeak, once a golf caddie, runs a clothing brand, building a longevity company, aiming for healthcare strategy consulting.
Your job: help him map every person who shaped him, personal and professional, so he keeps them for life. His belief: network is net worth. People are what you earn in a lifetime, not money.
People already on his cards: ${known||"none yet"}.
How you talk: like a thoughtful friend over coffee. One question at a time. One to three short sentences. React to what he said before asking the next thing. Draw out names, what the person did for him, one specific memory, where they are now, and what he'd want to say to them today. Ask how he could give back to them. Gently go deeper over time: patterns, who he avoids, what he's grateful for. Never lecture, never list. If he mixes in Tamil, that's fine. When a chapter feels covered, say so and suggest the next one.
Current chapter: ${S.chapter}. It covers ${CHAPTER_HINT[S.chapter]||"this part of his life"}.`}
function renderThread(extra){const t=$("#thread");const items=S.turns.slice(-30).map(x=>x.role==="user"&&x.content.startsWith("[CHAPTER]")?`<div class="msg sys">${esc(x.content.replace("[CHAPTER]","chapter ·"))}</div>`:`<div class="msg ${x.role==="user"?"u":"k"}">${esc(x.content)}</div>`);
  if(extra)items.push(extra);if(!items.length)items.push(`<div class="empty"><b>Start anywhere</b>Pick a chapter. Keith asks about the people in it, one question at a time.</div>`);t.innerHTML=items.join("");
  if(view==="keith")window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"})}
function renderChapters(){$("#chapters").innerHTML=CHAPTERS.map(c=>`<button class="chip ${S.chapter===c?"on":""}" data-ch="${esc(c)}">${esc(c)}${S.chaptersDone.includes(c)?' <span class="ok">✓</span>':""}</button>`).join("")}
$("#chapters").addEventListener("click",e=>{const b=e.target.closest("[data-ch]");if(b&&!busy){S.chapter=b.dataset.ch;S.turns.push({role:"user",content:"[CHAPTER] "+S.chapter});persist();renderChapters();askKeith()}});
async function sendTurn(text){if(busy)return;S.turns.push({role:"user",content:text});persist();renderThread();await askKeith()}
async function askKeith(){
  busy=true;$("#send-btn").disabled=true;setOrb("thinking","keith is thinking");
  let reply="";
  if(hasKey()){
    try{const msgs=S.turns.slice(-40).map(t=>({role:t.role,content:t.content.startsWith("[CHAPTER]")?"Let's talk about this chapter: "+t.content.slice(9).trim():t.content}));
      if(!msgs.length||msgs[msgs.length-1].role!=="user")msgs.push({role:"user",content:"Go on."});
      const res=await claude({system:systemPrompt(),messages:msgs,max_tokens:300});reply=textOf(res)}
    catch(e){toast(errMsg(e));reply=scriptedReply()}}
  else reply=scriptedReply();
  S.turns.push({role:"assistant",content:reply});persist();busy=false;$("#send-btn").disabled=false;renderThread();
  speak(reply,()=>{if(S.settings.handsFree&&view==="keith"&&S.settings.speak)startListening()});}
function scriptedReply(){const q=SCRIPT[S.chapter]||SCRIPT.Life;const i=S.scriptIdx[S.chapter]||0;
  if(i>=q.length){return"I think we've covered "+S.chapter+" well. Tap Pull out people, then pick the next chapter."}
  S.scriptIdx[S.chapter]=i+1;const ack=i===0?"":["Thank you for that. ","Got it. ","That's a good one. ","I'm writing that down. "][i%4];return ack+q[i]}
$("#send-btn").onclick=()=>{const v=$("#answer").value.trim();if(busy)return;if(!v){if(!S.turns.length){S.turns.push({role:"user",content:"[CHAPTER] "+S.chapter});persist();askKeith()}return}$("#answer").value="";sendTurn(v)};
$("#answer").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#send-btn").click()}});

/* extraction */
$("#extract-btn").onclick=async()=>{
  const from=Math.min(S.extractedUpTo||0,S.turns.length);const slice=S.turns.slice(from);
  const said=slice.filter(t=>t.role==="user"&&!t.content.startsWith("[CHAPTER]"));
  if(!said.length){toast("Tell Keith about someone first.");return}
  const btn=$("#extract-btn");
  if(!hasKey()){openManualExtract(said);return}
  btn.disabled=true;btn.textContent="Reading…";
  const transcript=slice.map(t=>t.role==="user"?(t.content.startsWith("[CHAPTER]")?"--- "+t.content+" ---":"DAN: "+t.content):"KEITH: "+t.content).join("\n").slice(-50000);
  const prompt=`From this interview transcript, list every real person Dan mentions (not Keith, not Dan, not famous people he only name-drops).
Existing cards (set "match" to the exact existing name if it's the same person, else null): ${S.people.map(p=>p.name).join(" | ")||"none"}
Chapters: ${CHAPTERS.join(", ")}. Circles: ${CIRCLES.join(", ")}. Tier: 1 closest (monthly), 2 important (quarterly), 3 wider circle (twice a year).
Reply with only JSON: {"people":[{"name":"","match":null,"relation":"short role","chapter":"","circle":"","type":"personal|professional","tier":2,"story":"1 to 2 sentences in Dan's own details","toTell":"","give":"one concrete give-first idea","lost":false}]}
lost is true only if Dan says he lost touch or can't reach them.

TRANSCRIPT:
${transcript}`;
  try{const res=await claude({messages:[{role:"user",content:prompt}],max_tokens:2500});const out=parseJSON(textOf(res));
    const list=(out&&Array.isArray(out.people)?out.people:[]).filter(x=>x&&x.name);if(!list.length)toast("Keith didn't find new people here.");else openReview(list)}
  catch(e){toast(errMsg(e))}
  btn.disabled=false;btn.textContent="Pull out people"};
function openManualExtract(said){
  openSheet(`<h2>Who did you mention?</h2><p class="hint" style="margin:-6px 0 12px">Without a Claude key, Keith can't read names out of your story yet. Type them, one per line, like <code>Fatima ma'am, English teacher</code>.</p>
  <div class="f"><textarea id="mx" placeholder="Name, who they are to you"></textarea></div>
  <div class="hint" style="margin-bottom:12px">What you said: “${esc(said.map(s=>s.content).join(" ").slice(0,240))}…”</div>
  <div class="acts"><button class="pill solid" id="mx-go">Make cards</button><button class="pill ghost" data-close>Cancel</button></div>`);
  $("#mx-go").onclick=()=>{const lines=$("#mx").value.split("\n").map(l=>l.trim()).filter(Boolean);if(!lines.length)return;
    const list=lines.map(l=>{const [n,...r]=l.split(",");return{name:n.trim(),relation:r.join(",").trim(),chapter:S.chapter,circle:"friend",type:"personal",tier:2,story:said.map(s=>s.content).join(" ").slice(0,300),toTell:"",give:"",lost:false}});
    closeSheet();openReview(list)}}
function openReview(list){
  const byName=n=>S.people.find(p=>p.name.toLowerCase()===String(n||"").toLowerCase());
  list.forEach(x=>{const m=byName(x.match)||byName(x.name);x._m=m&&m.id});
  openSheet(`<h2>Keith found ${list.length} ${list.length===1?"person":"people"}</h2>
  ${list.map((x,i)=>`<label class="rv"><input type="checkbox" checked data-i="${i}"><div style="min-width:0"><b>${esc(x.name)}</b><span class="tag ${x._m?"":"new"}">${x._m?"update":"new"}</span><div class="rel">${esc(x.relation||"")} · ${esc(x.chapter||S.chapter)} · T${esc(x.tier||2)}</div>${x.story?`<p>${esc(x.story)}</p>`:""}</div></label>`).join("")}
  <div class="acts" style="margin-top:14px"><button class="pill solid" id="rv-save">Save cards</button><button class="pill ghost" data-close>Cancel</button></div>`);
  $("#rv-save").onclick=()=>{const picks=[...$$(".rv input:checked")].map(i=>list[+i.dataset.i]);let n=0;
    for(const x of picks){const clean={relation:String(x.relation||"").slice(0,120),chapter:CHAPTERS.includes(x.chapter)?x.chapter:S.chapter,circle:CIRCLES.includes(x.circle)?x.circle:"friend",type:x.type==="professional"?"professional":"personal",tier:[1,2,3].includes(+x.tier)?+x.tier:2,story:String(x.story||"").slice(0,800),toTell:String(x.toTell||"").slice(0,400),give:String(x.give||"").slice(0,300),lost:!!x.lost};
      const m=x._m&&find(x._m);
      if(m){const story=m.story&&clean.story&&!m.story.includes(clean.story)?m.story+" "+clean.story:(m.story||clean.story);upsert({...m,story:story.slice(0,1500),toTell:m.toTell||clean.toTell,give:m.give||clean.give,relation:m.relation||clean.relation});n++}
      else{let id=slug(x.name);if(find(id))id+="-"+Math.random().toString(36).slice(2,6);upsert({id,name:String(x.name).slice(0,80),...clean,contact:"",lastContact:null,snoozeUntil:null,log:[],createdAt:today()});n++}}
    S.extractedUpTo=S.turns.length;if(!S.chaptersDone.includes(S.chapter))S.chaptersDone.push(S.chapter);persist();closeSheet();render();toast(`Saved ${n} ${n===1?"card":"cards"}.`)}}

/* ---------- Today ---------- */
let showAll=false;
function renderToday(){
  const list=dueList();const n=showAll?list.length:Math.min(S.settings.daily,list.length);
  countTo($("#h-due"),n);
  $("#h-sub").innerHTML=`<b>${esc(LAWS[new Date().getDate()%LAWS.length])}</b>`;
  const warm=S.people.filter(p=>temp(p)==="warm").length,lost=S.people.filter(p=>p.lost).length;
  $("#h-chips").innerHTML=`<span class="chip sig"><i class="dot"></i>${warm} warm</span><span class="chip">${list.length} due</span>${lost?`<span class="chip">${lost} to find</span>`:""}`;
  const box=$("#today-list");
  if(!S.people.length)box.innerHTML=`<div class="empty"><b>No one here yet</b>Open Keith and tell him one chapter of your life.</div>`;
  else if(!list.length)box.innerHTML=`<div class="empty"><b>You're caught up</b>Everyone due has been pinged. Tell Keith another chapter or come back tomorrow.</div>`;
  else box.innerHTML=list.slice(0,n).map(({p,d})=>card(p,d)).join("");
  const extra=list.length-n;$("#more-wrap").hidden=!(extra>0||(showAll&&list.length>S.settings.daily));$("#more-btn").textContent=showAll?"Show only today's "+S.settings.daily:`Show ${extra} more`;
  const ls=S.people.filter(p=>p.lost);
  $("#lost-list").innerHTML=ls.length?ls.map(p=>`<div class="prow"><div class="av">${esc(initials(p.name))}</div><div class="who"><b>${esc(p.name)}</b><span>${esc(p.relation||"")}</span></div>
    <a class="pill" style="height:34px;padding:0 12px" href="${liLink(p)}" target="_blank" rel="noopener">Search</a><button class="pill" style="height:34px;padding:0 12px" data-act="found" data-id="${esc(p.id)}">Found</button></div>`).join("")
    :`<div class="empty" style="padding:14px">Nobody marked as lost touch.</div>`}
function card(p,d){const draft=S.drafts[p.id]||"";const status=d.never?"never logged":ago(d.since);
  return `<article class="glass card" data-id="${esc(p.id)}">
  <div class="row"><div style="min-width:0"><div class="name">${esc(p.name)}</div><div class="rel">${esc(p.relation||p.circle||"")}${p.chapter&&!(p.relation||"").includes(p.chapter)?" · "+esc(p.chapter):""}</div></div>
    <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex:none"><span class="chip sig">T${p.tier||2} · ${TIER[p.tier||2]}</span><span class="chip">${esc(status)}</span></div></div>
  ${p.story?`<p class="story">${esc(p.story)}</p>`:""}
  ${p.toTell?`<p class="tell"><span class="label">Tell them</span>${esc(p.toTell)}</p>`:""}
  <p class="tell"><span class="label" style="color:var(--haze)">Give first</span><span style="color:var(--haze)">${esc(p.give||defaultGive(p))}</span></p>
  <textarea class="draft" data-draft="${esc(p.id)}" placeholder="Your message" aria-label="Message to ${esc(p.name)}">${esc(draft)}</textarea>
  <div class="acts"><button class="pill gold" data-act="draft" data-id="${esc(p.id)}">${draft?"Redraft":"Draft it"}</button><button class="pill" data-act="copy" data-id="${esc(p.id)}">Copy</button>
    <a class="pill" data-wa="${esc(p.id)}" href="${waLink(p,draft)}" target="_blank" rel="noopener">WhatsApp</a>${p.type==="professional"?`<a class="pill" href="${liLink(p)}" target="_blank" rel="noopener">LinkedIn</a>`:""}
    <button class="pill solid" data-act="done" data-id="${esc(p.id)}">Pinged ✓</button><button class="pill ghost" data-act="snooze" data-id="${esc(p.id)}">Next week</button></div></article>`}
function countTo(el,n){const from=+el.textContent||0;if(matchMedia("(prefers-reduced-motion: reduce)").matches||from===n){el.textContent=n;return}
  const t0=performance.now();const dur=600;(function f(t){const k=Math.min(1,(t-t0)/dur);const e=1-Math.pow(1-k,3);el.textContent=Math.round(from+(n-from)*e);if(k<1)requestAnimationFrame(f)})(t0)}
document.addEventListener("input",e=>{const id=e.target.dataset&&e.target.dataset.draft;if(!id)return;S.drafts[id]=e.target.value;persist();const a=document.querySelector(`[data-wa="${CSS.escape(id)}"]`),p=find(id);if(a&&p)a.href=waLink(p,e.target.value)});
document.addEventListener("click",async e=>{const b=e.target.closest("[data-act]");if(!b)return;const p=find(b.dataset.id);if(!p)return;const act=b.dataset.act;
  if(act==="draft")return draftFor(p,b);
  if(act==="copy"){const txt=S.drafts[p.id]||"";if(!txt){toast("Nothing to copy yet.");return}try{await navigator.clipboard.writeText(txt);toast("Copied.")}catch(_){const ta=document.querySelector(`[data-draft="${CSS.escape(p.id)}"]`);ta&&ta.select();toast("Selected. Copy from the box.")}return}
  if(act==="done"){const log=(p.log||[]).slice(-29);log.push({date:today(),note:(S.drafts[p.id]||"Pinged").slice(0,280)});upsert({...p,lastContact:today(),snoozeUntil:null,log});delete S.drafts[p.id];persist();render();toast(`Logged. Next ping in about ${cad(p)} days.`);return}
  if(act==="snooze"){upsert({...p,snoozeUntil:addDays(7)});render();toast("Moved to next week.");return}
  if(act==="found"){upsert({...p,lost:false});render();toast(p.name+" is back in rotation.");return}});
async function draftFor(p,btn){const ta=document.querySelector(`[data-draft="${CSS.escape(p.id)}"]`);
  if(!hasKey()){const t=templateDraft(p);S.drafts[p.id]=t;persist();if(ta)ta.value=t;btn.textContent="Redraft";const a=document.querySelector(`[data-wa="${CSS.escape(p.id)}"]`);if(a)a.href=waLink(p,t);toast("Template draft. Add a Claude key for a real one.");return}
  btn.disabled=true;const old=btn.textContent;btn.textContent="Drafting…";
  const prompt=`Write one short WhatsApp message from Dhiyanesh (friends call him Dan) to ${p.name}.
Who they are to him: ${p.relation||p.circle||"someone from his past"} (${p.chapter||"his life"}). Story together: ${p.story||"not recorded"}. What he wants to tell them: ${p.toTell||"nothing specific"}. Give-first idea: ${p.give||defaultGive(p)}. Last contact: ${p.lastContact?ago(daysSince(p.lastContact)):"a long time ago or never"}.
About him now: MS Management at Johns Hopkins Carey in Baltimore, from Tamil Nadu, biotech background, aiming for healthcare strategy consulting, building a longevity startup.
Rules (Never Eat Alone): lead with them. Give before asking. No ask except a call or coffee. One specific shared memory if the story has one. Respectful to teachers and elders (sir, ma'am). His voice: casual, warm, short direct sentences, very few commas, no em dashes, no hyphens, never "hope this finds you well". 2 to 4 sentences. Reply with only the message.`;
  try{const res=await claude({messages:[{role:"user",content:prompt}],max_tokens:300});const t=textOf(res);S.drafts[p.id]=t;persist();if(ta)ta.value=t;const a=document.querySelector(`[data-wa="${CSS.escape(p.id)}"]`);if(a)a.href=waLink(p,t)}
  catch(e){toast(errMsg(e))}
  btn.disabled=false;btn.textContent=S.drafts[p.id]?"Redraft":old}
$("#more-btn").onclick=()=>{showAll=!showAll;renderToday()};

/* ---------- People ---------- */
let filter="all",q="";
function renderPeople(){countTo($("#h-people"),S.people.length);
  const opts=[["all","All"],["family","Family"],["mentor","Mentors"],["teacher","Teachers"],["friend","Friends"],["professional","Professional"],["cold","Going cold"],["lost","Lost touch"]];
  $("#filters").innerHTML=opts.map(([k,l])=>`<button class="chip ${filter===k?"on":""}" data-filter="${k}">${l}</button>`).join("");
  const qq=q.trim().toLowerCase();const ps=S.people.filter(p=>{if(qq&&!(p.name+" "+(p.relation||"")+" "+(p.chapter||"")+" "+(p.story||"")+" "+(p.company||"")).toLowerCase().includes(qq))return false;
    if(filter==="all")return true;if(filter==="lost")return p.lost;if(filter==="cold")return temp(p)==="cold"&&!p.lost;if(filter==="professional")return p.type==="professional";if(filter==="friend")return p.circle==="friend"||p.circle==="classmate";return p.circle===filter});
  const box=$("#people-list");if(!ps.length){box.innerHTML=`<div class="empty"><b>${S.people.length?"No matches":"Your Rolodex is empty"}</b>${S.people.length?"Try another search.":"Add someone or tell Keith a chapter."}</div>`;return}
  const groups={};ps.forEach(p=>{(groups[p.chapter||"Life"]??=[]).push(p)});const order=[...CHAPTERS,...Object.keys(groups).filter(c=>!CHAPTERS.includes(c))];
  box.innerHTML=order.filter(c=>groups[c]).map(c=>`<div class="group"><div class="label">${esc(c)} · ${groups[c].length}</div>${groups[c].sort((a,b)=>(a.tier||2)-(b.tier||2)||a.name.localeCompare(b.name)).map(p=>`<button class="prow" data-edit="${esc(p.id)}"><div class="av ${p.tier===1?"sig":""}">${esc(initials(p.name))}</div><div class="who"><b>${esc(p.name)}</b><span>${esc(p.relation||p.circle||"")}${p.company?" · "+esc(p.company):""}</span></div><i class="state ${temp(p)}" title="${temp(p)}"></i></button>`).join("")}</div>`).join("")}
$("#search").oninput=e=>{q=e.target.value;renderPeople()};
$("#filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(b){filter=b.dataset.filter;renderPeople()}});
$("#people-list").addEventListener("click",e=>{const b=e.target.closest("[data-edit]");if(b)openEdit(find(b.dataset.edit))});
$("#add-btn").onclick=()=>openEdit(null);
const opt=(list,v)=>list.map(x=>`<option ${x===v?"selected":""}>${esc(x)}</option>`).join("");
function openEdit(p){const n=!p;p=p||{name:"",relation:"",chapter:"Life",circle:"friend",type:"personal",tier:2,story:"",toTell:"",give:"",contact:"",company:"",role:"",linkedin:"",lastContact:null,lost:false,log:[]};
  openSheet(`<h2>${n?"Add person":esc(p.name)}</h2><form id="ed">
  <div class="f"><label class="label" for="f-name">Name</label><input id="f-name" required value="${esc(p.name)}"></div>
  <div class="f"><label class="label" for="f-rel">Who they are to you</label><input id="f-rel" value="${esc(p.relation)}" placeholder="English teacher, Spring Mount"></div>
  <div class="g2"><div class="f"><label class="label" for="f-ch">Chapter</label><select id="f-ch">${opt(CHAPTERS,p.chapter)}</select></div><div class="f"><label class="label" for="f-ci">Circle</label><select id="f-ci">${opt(CIRCLES,p.circle)}</select></div></div>
  <div class="f"><label class="label">Tier</label><div class="seg">${[1,2,3].map(t=>`<label><input type="radio" name="tier" value="${t}" ${p.tier===t?"checked":""}><span>${t} · ${TIER[t]}</span></label>`).join("")}</div></div>
  <div class="f"><label class="label">Type</label><div class="seg">${["personal","professional"].map(t=>`<label><input type="radio" name="type" value="${t}" ${p.type===t?"checked":""}><span>${t}</span></label>`).join("")}</div></div>
  <div id="pro-fields" ${p.type==="professional"?"":"hidden"}>
    <div class="g2"><div class="f"><label class="label" for="f-co">Company</label><input id="f-co" value="${esc(p.company||"")}"></div><div class="f"><label class="label" for="f-ro">Role</label><input id="f-ro" value="${esc(p.role||"")}"></div></div>
    <div class="f"><label class="label" for="f-li">LinkedIn</label><input id="f-li" value="${esc(p.linkedin||"")}" placeholder="https://linkedin.com/in/…"></div>
    <div class="acts" style="margin:-4px 0 12px"><button class="pill" type="button" id="enrich">Look them up on the web</button></div>
    <div id="enrich-out"></div>
  </div>
  <div class="g2"><div class="f"><label class="label" for="f-con">WhatsApp number</label><input id="f-con" value="${esc(p.contact)}" placeholder="+91…"></div><div class="f"><label class="label" for="f-last">Last contact</label><input id="f-last" type="date" value="${esc(p.lastContact||"")}"></div></div>
  <div class="f"><label class="label" for="f-story">Your story with them</label><textarea id="f-story">${esc(p.story)}</textarea></div>
  <div class="f"><label class="label" for="f-tell">What you want to tell them</label><input id="f-tell" value="${esc(p.toTell)}"></div>
  <div class="f"><label class="label" for="f-give">Give-first idea</label><input id="f-give" value="${esc(p.give)}"></div>
  <label class="cb"><input type="checkbox" id="f-lost" ${p.lost?"checked":""}> Lost touch, track them down</label>
  ${!n&&(p.log||[]).length?`<div class="f"><span class="label">Ping log</span><div class="log">${p.log.slice().reverse().map(l=>`<div><span class="mono">${esc(l.date)}</span><span>${esc(l.note)}</span></div>`).join("")}</div></div>`:""}
  <div class="acts"><button class="pill solid" type="submit">Save</button><button class="pill ghost" type="button" data-close>Close</button>${n?"":`<button class="pill ghost" type="button" id="del" style="margin-left:auto;color:#EE8A6E">Delete</button>`}</div></form>`);
  $$('input[name="type"]').forEach(r=>r.onchange=()=>{$("#pro-fields").hidden=r.value!=="professional"||!r.checked});
  $("#enrich").onclick=()=>enrich({name:$("#f-name").value,relation:$("#f-rel").value,company:$("#f-co").value,story:$("#f-story").value});
  $("#ed").onsubmit=ev=>{ev.preventDefault();const name=$("#f-name").value.trim();if(!name)return;let id=p.id;if(!id){id=slug(name);if(find(id))id+="-"+Math.random().toString(36).slice(2,6)}
    const tier=+(document.querySelector('input[name="tier"]:checked')||{}).value||2;const type=(document.querySelector('input[name="type"]:checked')||{}).value||"personal";
    upsert({...p,id,name,relation:$("#f-rel").value.trim(),chapter:$("#f-ch").value,circle:$("#f-ci").value,type,tier,company:$("#f-co").value.trim(),role:$("#f-ro").value.trim(),linkedin:$("#f-li").value.trim(),
      lastContact:$("#f-last").value||null,contact:$("#f-con").value.trim(),story:$("#f-story").value.trim(),toTell:$("#f-tell").value.trim(),give:$("#f-give").value.trim(),lost:$("#f-lost").checked,log:p.log||[],createdAt:p.createdAt||today()});
    closeSheet();render();toast("Saved "+name+".")};
  const del=$("#del");if(del)del.onclick=()=>{if(del.dataset.armed){S.people=S.people.filter(x=>x.id!==p.id);persist();closeSheet();render();toast("Deleted.")}else{del.dataset.armed="1";del.textContent="Tap again to delete"}}}

/* web enrichment with confirmation */
async function enrich(info){const out=$("#enrich-out");if(!info.name.trim()){toast("Add a name first.");return}
  if(!hasKey()){out.innerHTML=`<div class="found"><p>Web lookup needs a Claude API key. Add it in settings.</p></div>`;return}
  out.innerHTML=`<div class="found"><p>Searching the web…</p></div>`;
  const prompt=`Find the professional profile of this person. Name: ${info.name}. Context: ${info.relation||""}. ${info.company?"Company hint: "+info.company+".":""} ${info.story?"Background: "+info.story:""}
Use web search. Then reply with only JSON: {"found":true|false,"company":"","role":"","location":"","linkedin":"","summary":"2 sentences on what they do now","confidence":"high|medium|low","why":"what matched"}. If you can't find a confident match, set found false and say why.`;
  try{const res=await claude({messages:[{role:"user",content:prompt}],max_tokens:1200,tools:[{type:"web_search_20250305",name:"web_search",max_uses:4}]});
    const j=parseJSON(textOf(res));if(!j||!j.found){out.innerHTML=`<div class="found"><b>No confident match</b><p>${esc((j&&j.why)||"Try adding a company or city in the story field.")}</p></div>`;return}
    out.innerHTML=`<div class="found"><b>${esc(j.role||"")}${j.company?" at "+esc(j.company):""}</b><p>${esc(j.summary||"")}${j.location?" · "+esc(j.location):""}</p><p class="label" style="margin-top:6px">${esc(j.confidence||"")} confidence · ${esc(j.why||"")}</p>
      <div class="acts" style="margin-top:10px"><button class="pill solid" type="button" id="en-yes">Yes, that's them</button><button class="pill ghost" type="button" id="en-no">Not them</button></div></div>`;
    $("#en-yes").onclick=()=>{if(j.company)$("#f-co").value=j.company;if(j.role)$("#f-ro").value=j.role;if(j.linkedin)$("#f-li").value=j.linkedin;if(j.summary){const s=$("#f-story");s.value=(s.value?s.value+" ":"")+"Now: "+j.summary}out.innerHTML="";toast("Filled in. Save to keep it.")};
    $("#en-no").onclick=()=>{out.innerHTML=""}}
  catch(e){out.innerHTML=`<div class="found"><p>${esc(errMsg(e))}</p></div>`}}

/* contacts import (CSV or vCard) */
$("#import-btn").onclick=()=>$("#import-file").click();
$("#import-file").onchange=async e=>{const f=e.target.files[0];if(!f)return;const txt=await f.text();let rows=[];
  if(/BEGIN:VCARD/i.test(txt)){txt.split(/BEGIN:VCARD/i).slice(1).forEach(v=>{const fn=(v.match(/^FN[^:]*:(.+)$/mi)||[])[1];const tel=(v.match(/^TEL[^:]*:(.+)$/mi)||[])[1];if(fn)rows.push({name:fn.trim(),phone:(tel||"").trim()})})}
  else{const lines=txt.split(/\r?\n/).filter(Boolean);const h=lines[0].split(",").map(s=>s.replace(/"/g,"").trim().toLowerCase());const ni=h.findIndex(x=>/^(name|full name|display name)$/.test(x)),fi=h.findIndex(x=>/first/.test(x)),la=h.findIndex(x=>/last/.test(x)),pi=h.findIndex(x=>/phone|mobile/.test(x));
    lines.slice(1).forEach(l=>{const c=l.split(",").map(s=>s.replace(/"/g,"").trim());const name=ni>=0?c[ni]:[c[fi],c[la]].filter(Boolean).join(" ");if(name)rows.push({name,phone:pi>=0?c[pi]:""})})}
  e.target.value="";if(!rows.length){toast("Couldn't read any contacts from that file.");return}
  let matched=0;const norm=s=>s.toLowerCase().replace(/\s*\(.*\)/,"").replace(/\b(sir|ma'am|maam)\b/g,"").trim();
  rows.forEach(r=>{const p=S.people.find(p=>norm(p.name)===norm(r.name)||norm(r.name).includes(norm(p.name))&&norm(p.name).length>3);if(p&&r.phone&&!p.contact){p.contact=r.phone;matched++}});
  persist();render();toast(`${rows.length} contacts read. Filled numbers for ${matched} people.`)};

/* ---------- Tracker ---------- */
function renderTrack(){const warm=S.people.filter(p=>temp(p)==="warm").length,cool=S.people.filter(p=>temp(p)==="cool").length,cold=S.people.filter(p=>temp(p)==="cold").length,lost=S.people.filter(p=>p.lost).length;
  countTo($("#t-warm"),warm);$("#t-sub").innerHTML=`<b>${S.people.length} people</b> across ${new Set(S.people.map(p=>p.chapter)).size} chapters`;
  countTo($("#t-pro"),S.people.filter(p=>p.type==="professional").length);countTo($("#t-per"),S.people.filter(p=>p.type!=="professional").length);
  const counts=CHAPTERS.map(c=>S.people.filter(p=>p.chapter===c).length);const mx=Math.max(1,...counts);const hi=counts.indexOf(mx);
  $("#t-bars").innerHTML=counts.map((n,i)=>`<i class="${i===hi?"hi":""}" style="height:${Math.max(4,n/mx*100)}%" title="${CHAPTERS[i]}: ${n}"></i>`).join("");
  $("#t-bars-l").innerHTML=`<span>${CHAPTERS[0]}</span><span>${CHAPTERS[hi]} · ${mx}</span><span>${CHAPTERS[CHAPTERS.length-1]}</span>`;
  const tot=Math.max(1,S.people.length);const ring=(n,l,sig)=>{const r=42,c=2*Math.PI*r,k=n/tot;return`<div class="g ${sig?"sig":""}"><svg viewBox="0 0 100 100"><circle class="t" cx="50" cy="50" r="${r}"/><circle class="a" cx="50" cy="50" r="${r}" stroke-dasharray="${(c*k).toFixed(1)} ${c.toFixed(1)}"/></svg><div class="n mono">${n}</div><div class="l">${l}</div></div>`};
  $("#t-rings").innerHTML=ring(warm,"warm",true)+ring(cool,"cooling")+ring(cold+lost,"cold");
  const m=today().slice(0,7);const pings=S.people.reduce((a,p)=>a+(p.log||[]).filter(l=>String(l.date).startsWith(m)).length,0);countTo($("#t-pings"),pings);$("#t-goal").textContent=S.settings.goal;$("#t-rule").style.left=Math.min(100,pings/S.settings.goal*100)+"%"}

/* ---------- settings / export ---------- */
$("#btn-settings").onclick=()=>{const vs=voices();
  openSheet(`<h2>Settings</h2>
  <div class="f"><label class="label" for="s-key">Claude API key</label><input id="s-key" type="password" value="${esc(S.settings.key)}" placeholder="sk-ant-…"><span class="hint">Stored only on this device. Get one at console.anthropic.com. Without it Keith uses scripted questions and template drafts.</span></div>
  <div class="f"><label class="label" for="s-model">Model</label><input id="s-model" value="${esc(S.settings.model)}"></div>
  <div class="f"><label class="label" for="s-voice">Keith's voice</label><select id="s-voice"><option value="">Auto (best available)</option>${vs.filter(v=>/^en/i.test(v.lang)).map(v=>`<option value="${esc(v.name)}" ${v.name===S.settings.voice?"selected":""}>${esc(v.name)} · ${esc(v.lang)}</option>`).join("")}</select><div class="acts" style="margin-top:6px"><button class="pill" type="button" id="s-test">Hear Keith</button></div></div>
  <label class="cb"><input type="checkbox" id="s-speak" ${S.settings.speak?"checked":""}> Keith speaks his questions</label>
  <label class="cb"><input type="checkbox" id="s-hf" ${S.settings.handsFree?"checked":""}> Hands free: mic opens after Keith speaks</label>
  <div class="g2"><div class="f"><label class="label" for="s-daily">Pings per day</label><input id="s-daily" type="number" min="1" max="20" value="${S.settings.daily}"></div><div class="f"><label class="label" for="s-goal">Monthly goal</label><input id="s-goal" type="number" min="1" value="${S.settings.goal}"></div></div>
  <div class="acts"><button class="pill solid" id="s-save">Save</button><button class="pill" id="s-import">Import backup</button><input type="file" id="s-file" accept=".json" hidden><button class="pill ghost" id="s-reset" style="margin-left:auto;color:#EE8A6E">Reset all</button></div>`);
  $("#s-test").onclick=()=>{S.settings.voice=$("#s-voice").value;const was=S.settings.speak;S.settings.speak=true;speak("Hi Dan. I'm Keith. Tell me about someone who shaped you.");S.settings.speak=was};
  $("#s-save").onclick=()=>{Object.assign(S.settings,{key:$("#s-key").value.trim(),model:$("#s-model").value.trim()||"claude-sonnet-5-5",voice:$("#s-voice").value,speak:$("#s-speak").checked,handsFree:$("#s-hf").checked,daily:Math.max(1,+$("#s-daily").value||3),goal:Math.max(1,+$("#s-goal").value||30)});persist();closeSheet();render();toast("Saved.")};
  $("#s-import").onclick=()=>$("#s-file").click();$("#s-file").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(!Array.isArray(j.people))throw 0;S=j;persist();load();closeSheet();render();toast("Backup restored.")}catch(_){toast("That file isn't a KEITH backup.")}};
  $("#s-reset").onclick=()=>{const b=$("#s-reset");if(b.dataset.armed){localStorage.removeItem(KEY);load();closeSheet();render();toast("Reset to the starter list.")}else{b.dataset.armed="1";b.textContent="Tap again to reset"}}};
$("#btn-export").onclick=()=>{const blob=new Blob([JSON.stringify(S,null,1)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="keith-backup-"+today()+".json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast("Backup downloaded.")};

/* ---------- views ---------- */
let view="today";
function show(v){view=v;["today","keith","people","track"].forEach(k=>$("#v-"+k).hidden=k!==v);$$(".dock button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));try{localStorage.setItem("keith.view",v)}catch(_){}
  window.scrollTo({top:0});if(v!=="keith"){stopListening();try{speechSynthesis.cancel()}catch(_){}speaking=false;setOrb("","tap the mic")}else renderThread()}
$$(".dock button").forEach(b=>b.onclick=()=>show(b.dataset.v));
function render(){renderToday();renderPeople();renderTrack();renderChapters();if(!busy)renderThread();
  const note=$("#note");if(!hasKey()){note.hidden=false;note.innerHTML=`Free mode. Keith asks scripted questions and writes template drafts. Add a Claude API key in settings when you're ready for the real Keith.`}else note.hidden=true}

/* ---------- boot ---------- */
load();render();let v="today";try{v=localStorage.getItem("keith.view")||"today"}catch(_){}show(v);
if(window.speechSynthesis)speechSynthesis.onvoiceschanged=()=>{};
if("serviceWorker" in navigator&&location.protocol.startsWith("http")){navigator.serviceWorker.register("sw.js").catch(()=>{})}
})();
