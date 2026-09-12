const $=id=>document.getElementById(id);
const KEY="isee_quest_v2";
let words=[], state=load(), quiz=null;

function load(){return JSON.parse(localStorage.getItem(KEY)||'{"xp":0,"streak":0,"lastStudy":"","totalRight":0,"totalWrong":0,"sessions":0,"daily":{},"words":{},"settings":{"sound":true,"celebrate":true}}')}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function today(){return new Date().toISOString().slice(0,10)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function mastery(w){let p=state.words[w.word]||{r:0,w:0,streak:0};let n=p.r+p.w;return n?Math.max(0,Math.min(5,Math.round(p.r/n*4+Math.min(p.streak,2)*.5))):0}
function masteredCount(){return words.filter(w=>mastery(w)>=4).length}
function level(){let m=masteredCount();return Math.min(5,Math.floor(m/60)+1)}
function dailyCount(){return state.daily[today()]||0}

async function init(){
  words=await (await fetch("vocabulary.json")).json();
  bind(); renderHome();
}
function bind(){
  document.querySelectorAll("[data-screen]").forEach(b=>b.onclick=()=>show(b.dataset.screen));
  $("dailyBtn").onclick=()=>start("daily");$("reviewBtn").onclick=()=>start("review");$("browseBtn").onclick=()=>browse();$("parentCard").onclick=()=>parent();$("parentBtn").onclick=()=>parent();
  $("quitBtn").onclick=()=>show("home");$("nextBtn").onclick=()=>{quiz.i++;renderQ()};$("againBtn").onclick=()=>start(quiz.mode);$("resultHomeBtn").onclick=()=>show("home");
  $("libraryHome").onclick=()=>show("home");$("parentHome").onclick=()=>show("home");$("search").oninput=e=>renderWords(e.target.value);
  $("resetBtn").onclick=()=>{if(confirm("Reset all progress?")){localStorage.removeItem(KEY);state=load();renderHome();show("home")}};
  $("soundToggle").onchange=e=>{state.settings.sound=e.target.checked;save()};$("celebrateToggle").onchange=e=>{state.settings.celebrate=e.target.checked;save()};
}
function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));$(id).classList.remove("hidden");if(id==="home")renderHome();if(id==="parent")renderParent();window.scrollTo({top:0,behavior:"smooth"})}
function renderHome(){
 $("topStreak").textContent=state.streak;$("topXP").textContent=state.xp;$("goalCount").textContent=`${Math.min(10,dailyCount())} / 10`;$("goalBar").style.width=`${Math.min(100,dailyCount()*10)}%`;
 $("goalText").textContent=dailyCount()>=10?"Goal complete! Come back tomorrow for a new quest.":"10 questions to keep your streak alive";
 let m=masteredCount(),lv=level();$("levels").innerHTML=[["🌱","Rookie","0–59"],["🌟","Explorer","60–119"],["🚀","Challenger","120–179"],["🏆","Scholar","180–239"],["👑","ISEE Master","240+"]].map((x,i)=>`<div class="level card ${i+1===lv?"current":""} ${i+1>lv?"locked":""}"><div class="badge">${x[0]}</div><b>${x[1]}</b><small>${i+1>lv?"🔒 ":""}${x[2]} mastered</small></div>`).join("");
}
function weightedPool(mode){
 let pool=mode==="review"?words.filter(w=>mastery(w)<4):words;
 if(!pool.length)pool=words;
 let expanded=[];pool.forEach(w=>{let wt=Math.max(1,6-mastery(w));for(let i=0;i<wt;i++)expanded.push(w)});return expanded;
}
function distractors(w,field){return shuffle([...new Set(words.filter(x=>x.word!==w.word&&x[field]).map(x=>x[field]))]).slice(0,3)}
function makeQ(w,type){
 let answer,prompt,example="";
 if(type==="synonym"){answer=w.synonym;prompt=`Which word or phrase is closest in meaning to <strong>${esc(w.word)}</strong>?`}
 else if(type==="antonym"){answer=w.antonym;prompt=`Which word or phrase is opposite in meaning to <strong>${esc(w.word)}</strong>?`}
 else if(type==="sentence"){answer=w.word;prompt="Choose the vocabulary word that best completes the sentence.";example=w.example?.replace(new RegExp(`\\b${w.word.replace(/[.*+?^${}()|[\\]\\\\]/g,"\\\\$&")}\\b`,"i"),"_____")||""}
 else {
  answer=w.word;
  const clue=w.definition||w.synonym||w.antonym;
  prompt=`Which vocabulary word matches this definition?<br><strong>${esc(clue)}</strong>`;
}
 if(!answer)return null;
 let ds=(type==="synonym"||type==="antonym")?distractors(w,type):shuffle(words.filter(x=>x.word!==w.word).map(x=>x.word)).slice(0,3);
 if(ds.length<3)return null;
 return {w,type,answer,prompt,example,choices:shuffle([answer,...ds])}
}
function makeQuestions(mode){
 let pool=weightedPool(mode), types=["synonym","antonym","sentence","meaning"],qs=[],used=new Set();
 for(let i=0;i<10;i++){let tries=0,q=null;while(!q||used.has(q.w.word)){q=makeQ(pick(pool),types[i%types.length]);if(++tries>50)break}if(q){used.add(q.w.word);qs.push(q)}}
 return qs;
}
function start(mode){quiz={mode,qs:makeQuestions(mode),i:0,right:0,results:[]};show("quiz");renderQ()}
function renderQ(){
 if(quiz.i>=quiz.qs.length)return finish();
 let q=quiz.qs[quiz.i];$("questLabel").textContent=`QUEST ${quiz.i+1} / ${quiz.qs.length}`;$("qProgress").style.width=`${quiz.i/quiz.qs.length*100}%`;
 $("qTag").textContent=q.type==="sentence"?"SENTENCE":q.type==="meaning"?"WORD MEANING":q.type.toUpperCase();$("qText").innerHTML=q.prompt;
 $("qExample").textContent=q.example;$("qExample").classList.toggle("hidden",!q.example);$("feedback").className="feedback hidden";$("nextBtn").classList.add("hidden");
 const letters=["A","B","C","D"];$("choices").innerHTML=q.choices.map((c,i)=>`<button class="choice" data-v="${esc(c)}"><span class="choice-letter">${letters[i]}</span><span>${esc(c)}</span></button>`).join("");
 document.querySelectorAll(".choice").forEach(b=>b.onclick=()=>answer(b));
 $("hearts").textContent="♥ ♥ ♥";
}
function answer(btn){
 let q=quiz.qs[quiz.i],ok=btn.dataset.v===q.answer,w=q.w.word;q.wasCorrect=ok;state.words[w]??={r:0,w:0,streak:0};let p=state.words[w];
 if(ok){p.r++;p.streak++;quiz.right++;state.totalRight++;tone(true)}else{p.w++;p.streak=0;state.totalWrong++;tone(false)}
 state.daily[today()]=(state.daily[today()]||0)+1;state.xp+=ok?10:3;
 document.querySelectorAll(".choice").forEach(b=>{b.disabled=true;if(b.dataset.v===q.answer)b.classList.add("correct")});if(!ok)btn.classList.add("wrong");
 let f=$("feedback");f.className="feedback "+(ok?"good":"bad");f.classList.remove("hidden");f.innerHTML=ok?`<b>✨ Great job!</b>${explain(q)}`:`<b>Almost!</b> The answer is <strong>${esc(q.answer)}</strong>.<br>${explain(q)}`;
 $("nextBtn").classList.remove("hidden");save();
}
function explain(q){let w=q.w,a=[];if(w.definition)a.push(`Definition: <strong>${esc(w.definition)}</strong>.`);if(w.synonym)a.push(`Synonym: <strong>${esc(w.synonym)}</strong>.`);if(w.antonym)a.push(`Antonym: <strong>${esc(w.antonym)}</strong>.`);if(w.example)a.push(`Example: “${esc(w.example)}”`);return a.join(" ")}
function finish(){
 let total=quiz.qs.length,p=Math.round(quiz.right/total*100),d=today();
 if(state.lastStudy!==d){let y=new Date();y.setDate(y.getDate()-1);let yd=y.toISOString().slice(0,10);state.streak=state.lastStudy===yd?state.streak+1:1;state.lastStudy=d}
 state.sessions++;save();$("resultScore").textContent=p+"%";$("resultTitle").textContent=p>=90?"Vocabulary superstar!":p>=70?"Quest complete!":"Keep going — you've got this!";
 $("resultSummary").textContent=`${quiz.right} of ${total} answers were correct.`;$("earnedXP").textContent=quiz.right*10+(total-quiz.right)*3;$("streakResult").textContent=state.streak;
 $("reviewList").innerHTML=quiz.qs.map(q=>`<div class="review-row"><span>${esc(q.w.word)}</span><span class="${q.wrong?"no":"ok"}">${q.wrong?"Review":"✓ Learned"}</span></div>`).join("");
 if(state.settings.celebrate&&p>=70)confetti();show("results");
}
function tone(good){if(!state.settings.sound)return;try{let C=window.AudioContext||window.webkitAudioContext,c=new C(),o=c.createOscillator(),v=c.createGain();o.frequency.value=good?660:220;o.type="sine";v.gain.value=.035;o.connect(v);v.connect(c.destination);o.start();o.stop(c.currentTime+.12)}catch(e){}}
function confetti(){let root=$("confetti");root.innerHTML="";for(let i=0;i<70;i++){let x=document.createElement("i");x.className="piece";x.style.left=Math.random()*100+"%";x.style.top="-20px";x.style.background=`hsl(${Math.random()*360} 80% 60%)`;x.style.setProperty("--x",(Math.random()*240-120)+"px");x.style.animationDelay=Math.random()*.35+"s";root.appendChild(x)}setTimeout(()=>root.innerHTML="",2200)}
function browse(){show("library");renderWords("")}
function renderWords(t){t=t.toLowerCase();let list=words.filter(w=>[w.word,w.synonym,w.antonym,w.example].join(" ").toLowerCase().includes(t));$("wordList").innerHTML=list.map(w=>`<div class="word-item card"><div class="word-top"><span class="word">${esc(w.word)}</span><span class="mastery">${mastery(w)>=4?"✓ Mastered":mastery(w)?`${mastery(w)}/5`: "New"}</span></div><div class="word-detail"><b>Definition:</b> ${esc(w.definition||"—")}</div><div class="word-detail"><b>Synonym:</b> ${esc(w.synonym||"—")} &nbsp; <b>Antonym:</b> ${esc(w.antonym||"—")}</div><div class="word-detail">${esc(w.example||"")}</div></div>`).join("")}
function parent(){
 show("parent");$("soundToggle").checked=state.settings.sound;$("celebrateToggle").checked=state.settings.celebrate;renderParent()
}
function renderParent(){
 let total=state.totalRight+state.totalWrong;$("pStreak").textContent=state.streak;$("pAccuracy").textContent=total?Math.round(state.totalRight/total*100)+"%":"0%";$("pXP").textContent=state.xp;$("pMastered").textContent=masteredCount();
 let days=[];for(let i=6;i>=0;i--){let d=new Date();d.setDate(d.getDate()-i);let key=d.toISOString().slice(0,10);days.push([key,state.daily[key]||0,d.toLocaleDateString(undefined,{weekday:"short"}).slice(0,2)])}
 let mx=Math.max(10,...days.map(x=>x[1]));$("weekChart").innerHTML=days.map(x=>`<div class="day"><div class="bar" style="height:${Math.max(4,x[1]/mx*90)}px" title="${x[1]} questions"></div><small>${x[2]}</small></div>`).join("");
 let weak=words.filter(w=>mastery(w)<3).sort((a,b)=>mastery(a)-mastery(b)).slice(0,8);$("parentWeak").innerHTML=weak.length?weak.map(w=>`<div class="attention"><span>${esc(w.word)}</span><b>${mastery(w)}/5</b></div>`).join(""):"<p>Nothing urgent — great work! 🎉</p>"
}
init();