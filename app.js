const customers=[
{id:"BL",name:"BL",short:"BL",detail:"Customer code"},
{id:"IS",name:"IS",short:"IS",detail:"Customer code"},
{id:"HC",name:"HC",short:"HC",detail:"Customer code"},
{id:"KI",name:"KI",short:"KI",detail:"Customer code"},
{id:"TD",name:"TD",short:"TD",detail:"Customer code"},
{id:"PS",name:"PS",short:"PS",detail:"Customer code"}
];

const types=[
"Account Administration","Administration","Assisting Other Departments","Business Profile","Cadence Call",
"Change Management – Implementation","Change Management – Planning","Consultation","DC/SOW Review",
"Discovery Call/SoW","Documentation","ES Onboarding","Event","Feature Request Discussion","Health Check",
"Initiative","Meeting","Mentoring","One-on-One","Other","P1/Escalation","QBR","Release Manifest Testing",
"Research","SME Activity","Internal Sync","Training","Troubleshooting","Webinars","Work Order","Special Initiative"
];

const $=s=>document.querySelector(s);
let activeCustomer=null;
let selectedHours=1;
let editingId=null;
let saveLocked=false;
let wheelAngle=0,wheelActive=false,wheelDragging=false,wheelStartY=0,wheelStartAngle=0,wheelMoved=false;

function saved(){try{return JSON.parse(localStorage.getItem("timeentry-entries")||"[]")}catch(_){return[]}}
function saveAll(data){localStorage.setItem("timeentry-entries",JSON.stringify(data))}
function todayISO(){const d=new Date(),off=d.getTimezoneOffset();return new Date(d.getTime()-off*60000).toISOString().slice(0,10)}
function showOnly(id){["splashScreen","portfolioScreen","entryScreen"].forEach(x=>$("#"+x)?.classList.add("hidden"));$("#"+id)?.classList.remove("hidden");window.scrollTo({top:0,behavior:"smooth"})}

function customerBadge(c){return '<span class="player-photo customer-avatar"><strong>'+c.short+'</strong></span>'}
function renderPortfolio(){
  $("#portfolioProgress").textContent=customers.length+" accounts";
  $("#customerGrid").innerHTML=customers.map(c=>`<button type="button" class="player-tile" data-id="${c.id}">${customerBadge(c)}<span class="jersey">ACCOUNT</span><strong>${c.short}</strong><span class="status-label">Tap to enter time</span></button>`).join("");
  $("#customerGrid").querySelectorAll(".player-tile").forEach(b=>b.onclick=()=>{if(wheelMoved){wheelMoved=false;return}openCustomer(b.dataset.id)});
  applyRosterLayout();
}
function openCustomer(id){
  editingId=null;
  activeCustomer=customers.find(c=>c.id===id);
  selectedHours=1;
  $("#activeCustomerName").textContent=activeCustomer.short;
  $("#activeCustomerDetail").textContent="Customer code";
  $("#entryDate").value=todayISO();
  $("#entryType").value="Meeting";
  $("#entryDetails").value="";
  $("#message").textContent="";
  $("#saveBtn").textContent="Save Time Entry";
  $("#saveNextBtn").classList.remove("hidden");
  renderHours();
  showOnly("entryScreen");
}
function showPortfolio(){activeCustomer=null;showOnly("portfolioScreen");renderPortfolio()}

function renderHours(){
  const values=[0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,6,7,8];
  $("#hoursGrid").innerHTML=values.map(v=>`<button type="button" class="hour-chip ${v===selectedHours?"active":""}" data-hours="${v}">${v} h</button>`).join("");
  $("#hoursGrid").querySelectorAll(".hour-chip").forEach(b=>b.onclick=()=>{selectedHours=Number(b.dataset.hours);renderHours()});
  $("#hoursValue").textContent=selectedHours.toFixed(1)+" h";
}
function changeHours(delta){selectedHours=Math.max(0.5,Math.min(24,Math.round((selectedHours+delta)*2)/2));renderHours()}

function buildEntry(){
 return {
   accountCode:activeCustomer.id,
   date:$("#entryDate").value||todayISO(),
   type:$("#entryType").value,
   hours:selectedHours,
   details:$("#entryDetails").value.trim()
 };
}
function showSaveConfirmation(text){
  $("#message").textContent=text;
  const toast=$("#saveToast");
  if(toast){
    toast.textContent=text;
    toast.classList.add("show");
    clearTimeout(showSaveConfirmation.timer);
    showSaveConfirmation.timer=setTimeout(()=>toast.classList.remove("show"),1800);
  }
}
function saveEntry(next){
  if(!activeCustomer||saveLocked)return;
  const entry=buildEntry();
  if(!entry.type){$("#message").textContent="Choose a Type.";return}
  if(!entry.details){$("#message").textContent="Add Details.";return}
  saveLocked=true;
  $("#saveBtn").disabled=true;
  $("#saveNextBtn").disabled=true;
  const data=saved();
  if(editingId){
    const i=data.findIndex(x=>x.id===editingId);
    if(i>=0)data[i]={...data[i],...entry,updatedAt:new Date().toISOString()};
  }else{
    data.push({id:crypto.randomUUID?.()||String(Date.now()),timestamp:new Date().toISOString(),...entry});
  }
  saveAll(data);
  renderHistory();
  showSaveConfirmation(editingId?"Updated ✓":"Saved ✓");
  const wasEditing=!!editingId;
  editingId=null;
  setTimeout(()=>{
    saveLocked=false;
    $("#saveBtn").disabled=false;
    $("#saveNextBtn").disabled=false;
    if(next||wasEditing)showPortfolio();
  },650);
}
function renderHistory(){
 const data=saved(); $("#savedCount").textContent=data.length;
 $("#historyList").innerHTML=data.length?data.slice().reverse().map(x=>`<div class="saved-row"><div class="saved-content"><strong>${x.accountCode}</strong><small>${x.date} • ${x.type} • ${Number(x.hours).toFixed(1)} h</small><span>${x.details}</span></div><div class="entry-controls"><button type="button" class="entry-edit" data-edit="${x.id}">Edit</button><button type="button" class="entry-delete" data-delete="${x.id}">Delete</button></div></div>`).join(""):"<p>No time entries saved yet.</p>";
 $("#historyList").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editEntry(b.dataset.edit));
 $("#historyList").querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteEntry(b.dataset.delete));
 const queue=data.map(({accountCode,date,type,hours,details})=>({accountCode,date,type,hours,details}));
 $("#jsonPreview").textContent=JSON.stringify(queue,null,2);
}
function editEntry(id){
 const x=saved().find(e=>e.id===id); if(!x)return;
 editingId=id;
 activeCustomer=customers.find(c=>c.id===x.accountCode)||{id:x.accountCode,short:x.accountCode};
 selectedHours=Number(x.hours)||1;
 $("#activeCustomerName").textContent=x.accountCode;
 $("#activeCustomerDetail").textContent="Editing saved entry";
 $("#entryDate").value=x.date||todayISO();
 $("#entryType").value=x.type||"";
 $("#entryDetails").value=x.details||"";
 $("#saveBtn").textContent="Update Time Entry";
 $("#saveNextBtn").classList.add("hidden");
 $("#message").textContent="Editing saved entry";
 $("#history").classList.add("hidden");
 renderHours();
 showOnly("entryScreen");
}
function deleteEntry(id){
 const data=saved();
 const x=data.find(e=>e.id===id); if(!x)return;
 if(!confirm(`Delete this ${x.accountCode} entry? This cannot be undone.`))return;
 saveAll(data.filter(e=>e.id!==id));
 renderHistory();
 showSaveConfirmation("Entry deleted");
}
async function sendToLaptop(){
 const data=saved().map(({accountCode,date,type,hours,details})=>({accountCode,date,type,hours,details}));
 if(!data.length){showSaveConfirmation("No saved entries to send");return}
 const url="https://carlos-aguirre1.github.io/TimeEntry/transfer.html#q="+encodeURIComponent(JSON.stringify(data));
 try{
   if(navigator.share){
     await navigator.share({title:"TimeEntry Transfer",text:"Open this link on your laptop to load the TimeEntry queue into the Chrome extension.",url});
     showSaveConfirmation("Transfer link shared");
     return;
   }
 }catch(err){
   if(err&&err.name==="AbortError")return;
 }
 try{
   await navigator.clipboard.writeText(url);
   showSaveConfirmation("Transfer link copied");
 }catch(_){
   prompt("Copy this transfer link and open it on your laptop:",url);
 }
}
async function copyJson(){
 const data=saved().map(({accountCode,date,type,hours,details})=>({accountCode,date,type,hours,details}));
 const text=JSON.stringify(data,null,2);
 try{await navigator.clipboard.writeText(text);alert("JSON queue copied.")}catch(_){prompt("Copy JSON queue:",text)}
}

function applyRosterLayout(){
 const mode=localStorage.getItem("timeentry-layout")==="wheel"?"wheel":"grid",grid=$("#customerGrid"),toggle=$("#layoutToggle");
 toggle?.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.layout===mode));
 if(!grid)return;
 grid.classList.toggle("wheel-layout",mode==="wheel");
 if(mode==="wheel")setupRadialWheel();else{grid.classList.remove("wheel-active","wheel-left");grid.style.removeProperty("--wheel-angle")}
}
function setupRadialWheel(){
 const grid=$("#customerGrid"); if(!grid)return;
 grid.classList.toggle("wheel-left",(localStorage.getItem("timeentry-wheel-hand")||"right")==="left");
 grid.style.setProperty("--wheel-angle",wheelAngle+"deg");
 let hub=$("#wheelHub");
 if(!hub){hub=document.createElement("button");hub.type="button";hub.id="wheelHub";hub.className="wheel-hub";hub.innerHTML='<span class="hub-mark">TE</span><strong>Customers</strong><small>Tap to spin</small>';grid.appendChild(hub)}
 let throttle=$("#wheelThrottle");
 if(!throttle){throttle=document.createElement("div");throttle.id="wheelThrottle";throttle.className="wheel-throttle";throttle.innerHTML='<span class="throttle-arrow">▲</span><span class="throttle-fast">FASTER</span><div class="throttle-track"><span class="throttle-knob"></span><span class="throttle-zero"></span></div><span class="throttle-fast">FASTER</span><span class="throttle-arrow">▼</span>';grid.appendChild(throttle)}
 let hand=$("#wheelHand");
 if(!hand){hand=document.createElement("button");hand.type="button";hand.id="wheelHand";hand.className="wheel-hand";grid.appendChild(hand)}
 const handMode=localStorage.getItem("timeentry-wheel-hand")||"right";
 hand.textContent=handMode==="right"?"Right hand →":"← Left hand";
 hand.onclick=e=>{e.stopPropagation();localStorage.setItem("timeentry-wheel-hand",handMode==="right"?"left":"right");setupRadialWheel()};
 hub.onclick=e=>{e.preventDefault();e.stopPropagation();wheelActive=!wheelActive;grid.classList.toggle("wheel-active",wheelActive);hub.querySelector("small").textContent=wheelActive?"ACTIVE • spin":"Tap to spin"};
 grid.querySelectorAll(".player-tile").forEach((b,i)=>{b.style.setProperty("--i",i);b.style.setProperty("--n",customers.length)});
 if(throttle&&!throttle.dataset.bound){
   throttle.dataset.bound="1";
   const knob=throttle.querySelector(".throttle-knob"),track=throttle.querySelector(".throttle-track");
   let raf=0,targetSpeed=0,currentSpeed=0,last=0,drag=false;
   const applySpeedFX=()=>{
     const mag=Math.min(1,Math.abs(currentSpeed)/2.15);
     grid.style.setProperty("--speed-intensity",mag.toFixed(3));
     grid.classList.toggle("speed-low",mag>.08&&mag<=.38);
     grid.classList.toggle("speed-med",mag>.38&&mag<=.72);
     grid.classList.toggle("speed-high",mag>.72);
     grid.classList.toggle("spin-forward",currentSpeed>0.02);
     grid.classList.toggle("spin-reverse",currentSpeed<-.02);
   };
   const startLoop=()=>{
     if(raf)return;
     last=performance.now();
     const tick=t=>{
       const dt=Math.min(32,t-last);last=t;
       currentSpeed+=(targetSpeed-currentSpeed)*.14;
       if(!drag&&Math.abs(targetSpeed)<.001)currentSpeed*=.965;
       if(Math.abs(currentSpeed)>.006){
         wheelAngle+=currentSpeed*dt*.13;
         grid.style.setProperty("--wheel-angle",wheelAngle+"deg");
       }
       applySpeedFX();
       if(!drag&&Math.abs(targetSpeed)<.001&&Math.abs(currentSpeed)<.01){
         currentSpeed=0;
         applySpeedFX();
         grid.classList.remove("speed-low","speed-med","speed-high","spin-forward","spin-reverse");
         grid.style.setProperty("--speed-intensity","0");
         raf=0;
         return;
       }
       raf=requestAnimationFrame(tick);
     };
     raf=requestAnimationFrame(tick);
   };
   const paint=y=>{
     const r=track.getBoundingClientRect(),mid=r.top+r.height/2,half=r.height/2-12;
     const off=Math.max(-half,Math.min(half,y-mid));
     knob.style.transform="translate(-50%,"+off+"px)";
     const signed=(-off/half);
     targetSpeed=signed*2.15*(grid.classList.contains("wheel-left")?-1:1);
     startLoop();
   };
   const stop=()=>{
     drag=false;
     targetSpeed=0;
     knob.style.transform="translate(-50%,0px)";
     startLoop();
   };
   throttle.addEventListener("pointerdown",e=>{drag=true;throttle.setPointerCapture?.(e.pointerId);paint(e.clientY);e.preventDefault();e.stopPropagation()},{passive:false});
   throttle.addEventListener("pointermove",e=>{if(!drag)return;paint(e.clientY);e.preventDefault();e.stopPropagation()},{passive:false});
   throttle.addEventListener("pointerup",stop); throttle.addEventListener("pointercancel",stop);
 }
 if(!grid.dataset.wheelBound){
   grid.dataset.wheelBound="1";
   grid.addEventListener("pointerdown",e=>{if(!wheelActive||e.target.closest("#wheelHub,#wheelHand,#wheelThrottle"))return;wheelDragging=true;wheelMoved=false;wheelStartY=e.clientY;wheelStartAngle=wheelAngle;grid.setPointerCapture?.(e.pointerId);e.preventDefault()},{passive:false});
   grid.addEventListener("pointermove",e=>{if(!wheelDragging)return;const dy=e.clientY-wheelStartY;if(Math.abs(dy)>7)wheelMoved=true;wheelAngle=wheelStartAngle+dy*.38*(grid.classList.contains("wheel-left")?-1:1);grid.style.setProperty("--wheel-angle",wheelAngle+"deg");e.preventDefault()},{passive:false});
   const stop=e=>{if(!wheelDragging)return;wheelDragging=false;try{grid.releasePointerCapture?.(e.pointerId)}catch(_){}};
   grid.addEventListener("pointerup",stop);grid.addEventListener("pointercancel",stop);
   grid.addEventListener("click",e=>{if(wheelMoved){e.preventDefault();e.stopPropagation();wheelMoved=false}},true);
 }
}

$("#entryType").innerHTML='<option value="">--None--</option>'+types.map(t=>'<option>'+t+'</option>').join("");
$("#enterAppBtn").onclick=()=>{showOnly("portfolioScreen");renderPortfolio()};
$("#backBtn").onclick=showPortfolio;
$("#hoursMinus").onclick=()=>changeHours(-0.5);
$("#hoursPlus").onclick=()=>changeHours(0.5);
$("#saveBtn").onclick=()=>saveEntry(false);
$("#saveNextBtn").onclick=()=>saveEntry(true);
$("#historyBtn").onclick=()=>{$("#history").classList.remove("hidden");renderHistory();$("#history").scrollIntoView({behavior:"smooth"})};
$("#closeHistoryBtn").onclick=()=>$("#history").classList.add("hidden");
$("#sendLaptopBtn").onclick=sendToLaptop;
$("#copyJsonBtn").onclick=copyJson;
$("#clearHistoryBtn").onclick=()=>{if(confirm("Clear all saved time entries?")){saveAll([]);renderHistory()}};
$("#layoutToggle").onclick=e=>{const b=e.target.closest("button[data-layout]");if(!b)return;localStorage.setItem("timeentry-layout",b.dataset.layout);applyRosterLayout()};
renderHistory();