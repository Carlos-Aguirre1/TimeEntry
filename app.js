const customers=[
{id:"BL",name:"BL",short:"BL",detail:"Customer code"},
{id:"IS",name:"IS",short:"IS",detail:"Customer code"},
{id:"HC",name:"HC",short:"HC",detail:"Customer code"},
{id:"KI",name:"KI",short:"KI",detail:"Customer code"},
{id:"TD",name:"TD",short:"TD",detail:"Customer code"},
{id:"PS",name:"PS",short:"PS",detail:"Customer code"},
{id:"BHC",name:"BHC",short:"BHC",detail:"Customer code"},
{id:"CPF",name:"CPF",short:"CPF",detail:"Customer code"},
{id:"MAN",name:"MAN",short:"MAN",detail:"Customer code"},
{id:"CB",name:"CB",short:"CB",detail:"Customer code"},
{id:"RB",name:"RB",short:"RB",detail:"Customer code"},
{id:"8F",name:"8F",short:"8F",detail:"Customer code"}
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
let historicalFilter="all";
let catchupContext=null;
const HISTORY_START="2026-08-01";
const expandedHistoricalDays=new Set();

const historicalSubmitted={
  "2026-08-10":{hours:9,breakdown:{KI:3,HC:1.5,CPF:1.5,RB:3}},
  "2026-08-11":{hours:5,breakdown:{IS:2.5,HC:2.5}},
  "2026-08-12":{hours:5.5,breakdown:{HC:2.5,OT:3}},
  "2026-08-13":{hours:6.5,breakdown:{PS:1.5,HC:1.5,BL:2,OT:1.5}},
  "2026-08-14":{hours:7,breakdown:{MAN:1,IS:2,TD:2,HC:2}},
  "2026-08-17":{hours:6,breakdown:{PS:3,IS:1.5,OT:1.5}},
  "2026-08-18":{hours:5,breakdown:{PS:2.5,OT:2.5}},
  "2026-08-19":{hours:6,breakdown:{HC:3,WM:2.5,PS:.5}},
  "2026-08-20":{hours:3,breakdown:{PS:1.5,KI:1.5}},
  "2026-08-21":{hours:5.5,breakdown:{CRC:1.5,IS:1.5,BL:2.5}},
  "2026-08-24":{hours:6.5,breakdown:{KI:1.5,IS:1.5,BL:3.5}},
  "2026-08-25":{hours:4.5,breakdown:{PS:2.5,CPF:2}},
  "2026-08-26":{hours:3.5,breakdown:{IS:1,OT:1.5,PS:1}},
  "2026-09-08":{hours:3,breakdown:{PS:3}},
  "2026-09-09":{hours:2.5,breakdown:{BL:2,PS:.5}},
  "2026-09-14":{hours:2,breakdown:{CRC:2}},
  "2026-09-21":{hours:7,breakdown:{OT:7}},
  "2026-09-22":{hours:7,breakdown:{OT:7}},
  "2026-09-23":{hours:7,breakdown:{OT:7}},
  "2026-09-24":{hours:7,breakdown:{PS:7}},
  "2026-09-25":{hours:7,breakdown:{PS:7}},
  "2026-09-29":{hours:1.5,breakdown:{PS:.5,KI:1}},
  "2026-10-01":{hours:7,breakdown:{PS:1.5,IS:5.5}},
  "2026-10-02":{hours:1.5,breakdown:{BL:1,PS:.5}},
  "2026-10-05":{hours:3,breakdown:{MAN:1,BHC:.5,CPF:1,PS:.5}},
  "2026-10-06":{hours:7,breakdown:{PS:5.5,RB:1.5}},
  "2026-10-07":{hours:.5,breakdown:{PS:.5}},
  "2026-10-08":{hours:.5,breakdown:{PS:.5}},
  "2026-10-09":{hours:.5,breakdown:{PS:.5}},
  "2026-10-12":{hours:.5,breakdown:{PS:.5}},
  "2026-10-13":{hours:.5,breakdown:{PS:.5}}
};

const historicalDetails={
  "2026-09-21":[
    {accountCode:"OT",type:"Other",hours:7,details:"Travelling to onsite QBR"}
  ],
  "2026-09-22":[
    {accountCode:"OT",type:"QBR",hours:7,details:"Walk through of data center and delivered QBR onsite."}
  ],
  "2026-09-23":[
    {accountCode:"OT",type:"Other",hours:7,details:"Travelling back from QBR onsite."}
  ],
  "2026-09-24":[
    {accountCode:"PS",type:"Xsight",hours:7,details:"Continued working on XSight"}
  ],
  "2026-09-25":[
    {accountCode:"PS",type:"Xsight",hours:7,details:"Continued working on XSight web engine"}
  ],
  "2026-09-29":[
    {accountCode:"PS",type:"Meeting",hours:.5,details:"Team Anu morning meeting"},
    {accountCode:"KI",type:"Other",hours:1,details:"Raja (customer) is ready to proceed with the migration of 30 of his devices into the new environment."}
  ],
  "2026-10-01":[
    {accountCode:"IS",type:"Troubleshooting",hours:2.5,details:"Continue assisting Jeff and Michael with attempting to identify the slowness to the profile."},
    {accountCode:"IS",type:"Troubleshooting",hours:3,details:"Assisting Jeff and Michael with a profile download issue at the Tifton distribution centre."}
  ],
  "2026-10-02":[
    {accountCode:"BL",type:"Meeting",hours:1,details:"Reviewing recording, as I was not able to attend"},
    {accountCode:"PS",type:"Meeting",hours:.5,details:"Morning meeting with the team Anu."}
  ],
  "2026-10-05":[
    {accountCode:"MAN",type:"Troubleshooting",hours:1,details:"Working with Jamal on updating devices time zone via mx config."},
    {accountCode:"BHC",type:"Meeting",hours:.5,details:"Reviewing account and preparing account for transition to TAM"},
    {accountCode:"CPF",type:"Meeting",hours:1,details:"Spent time updating new TAM accounts"},
    {accountCode:"PS",type:"Meeting",hours:.5,details:"Team meeting"}
  ],
  "2026-10-06":[
    {accountCode:"PS",type:"Meeting",hours:1.5,details:"Meeting with Michael to discuss DoorDash"},
    {accountCode:"PS",type:"Other",hours:3.5,details:"Continue working on maturity model."},
    {accountCode:"RB",type:"Cadence Call",hours:1.5,details:"Prepping for cadence call and attending customer call with Nick and Mark."},
    {accountCode:"PS",type:"Meeting",hours:.5,details:"Team Anu morning meeting"}
  ],
  "2026-10-07":[
    {accountCode:"PS",type:"Meeting",hours:.5,details:"Team Anu morning Meeting"}
  ],
  "2026-10-08":[
    {accountCode:"PS",type:"Meeting",hours:.5,details:"Team Anu morning Meeting"}
  ],
  "2026-10-09":[
    {accountCode:"PS",type:"Meeting",hours:.5,details:"Team Anu morning Meeting"}
  ],
  "2026-10-12":[
    {accountCode:"PS",type:"Meeting",hours:.5,details:"Team meeting with the Anu team"}
  ],
  "2026-10-13":[
    {accountCode:"PS",type:"Meeting",hours:.5,details:"Team Anu meeting"}
  ]
};

function saved(){try{return JSON.parse(localStorage.getItem("timeentry-entries")||"[]")}catch(_){return[]}}
function saveAll(data){localStorage.setItem("timeentry-entries",JSON.stringify(data))}
function restoreRequestedFour(){
  const params=new URLSearchParams(location.search);
  if(params.get("restore4")!=="1")return false;
  const restore=[
    {accountCode:"MAN",date:"2026-10-05",type:"Troubleshooting",hours:1,details:"Working with Jamal on updating devices time zone via mx config."},
    {accountCode:"RB",date:"2026-10-06",type:"Cadence Call",hours:1.5,details:"Prepping for cadence call an attending kids call with Customer, Nick and Mark."},
    {accountCode:"PS",date:"2026-10-06",type:"Other",hours:3.5,details:"Continue working on maturity model."},
    {accountCode:"PS",date:"2026-10-06",type:"Meeting",hours:1.5,details:"Meeting with Michael to discuss DoorDash"}
  ].map((x,i)=>({
    id:crypto.randomUUID?.()||String(Date.now()+i),
    timestamp:new Date().toISOString(),
    recoveredFromScreenshot:true,
    ...x
  }));
  saveAll(restore);
  localStorage.removeItem("timeentry-transfer-baseline");
  localStorage.setItem("timeentry-recovery-exact4","1");
  return true;
}
function ensureTransferBaseline(){
  if(localStorage.getItem("timeentry-transfer-baseline"))return;
  const stamp=new Date().toISOString();
  const data=saved().map(x=>({...x,transferredAt:x.transferredAt||stamp}));
  saveAll(data);
  localStorage.setItem("timeentry-transfer-baseline",stamp);
}
function pendingEntries(){return saved().filter(x=>!x.transferredAt)}
function markTransferred(ids){
  const set=new Set(ids);
  const stamp=new Date().toISOString();
  saveAll(saved().map(x=>set.has(x.id)?{...x,transferredAt:stamp}:x));
  ensureTransferBaseline();
renderHistory();
}
function todayISO(){const d=new Date(),off=d.getTimezoneOffset();return new Date(d.getTime()-off*60000).toISOString().slice(0,10)}
function showOnly(id){["splashScreen","portfolioScreen","entryScreen","multiEntryScreen","historicalScreen"].forEach(x=>$("#"+x)?.classList.add("hidden"));$("#"+id)?.classList.remove("hidden");window.scrollTo({top:0,behavior:"smooth"})}

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
  selectedHours=catchupContext
    ? (catchupContext.mode==="additional" ? 0.5 : Math.max(.5,Math.min(7,catchupContext.remaining)))
    : 1;
  $("#activeCustomerName").textContent=activeCustomer.short;
  $("#activeCustomerDetail").textContent=catchupContext
    ? (catchupContext.mode==="additional"
        ? "Historical additional time • "+formatHistoryDate(catchupContext.date)+" • already "+catchupContext.effective.toFixed(1)+" h"
        : "Historical catch-up • "+formatHistoryDate(catchupContext.date)+" • "+catchupContext.remaining.toFixed(1)+" h remaining")
    : "Customer code";
  $("#entryDate").value=catchupContext?.date||todayISO();
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
  const values=[0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,8];
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
    if(i>=0)data[i]={...data[i],...entry,updatedAt:new Date().toISOString(),transferredAt:null};
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
    if(catchupContext){
      catchupContext=null;
      renderHistorical();
      showOnly("historicalScreen");
    }else if(next||wasEditing)showPortfolio();
  },650);
}
function renderHistory(){
 const data=saved(); $("#savedCount").textContent=data.length;
 const today=todayISO();
 const td=new Date(today+"T12:00:00");
 const day=(td.getDay()+6)%7;
 const monday=new Date(td); monday.setDate(td.getDate()-day);
 const sunday=new Date(monday); sunday.setDate(monday.getDate()+6);
 const iso=d=>{const off=d.getTimezoneOffset();return new Date(d.getTime()-off*60000).toISOString().slice(0,10)};
 const weekStart=iso(monday),weekEnd=iso(sunday);
 const sum=list=>list.reduce((n,x)=>n+(Number(x.hours)||0),0);
 const todayHours=sum(data.filter(x=>x.date===today));
 const weekHours=sum(data.filter(x=>x.date>=weekStart&&x.date<=weekEnd));
 const totalHours=sum(data);
 if($("#savedTodayHours"))$("#savedTodayHours").textContent=todayHours.toFixed(1);
 if($("#savedWeekHours"))$("#savedWeekHours").textContent=weekHours.toFixed(1);
 if($("#savedTotalHours"))$("#savedTotalHours").textContent=totalHours.toFixed(1);
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
function buildTransferPackage(includeAll=false){
 const entries=includeAll?saved():pendingEntries();
 if(!entries.length)throw new Error(includeAll?"No saved entries to send":"No new entries to send");
 const payload=entries.map(({accountCode,date,type,hours,details})=>({accountCode,date,type,hours,details}));
 const url=location.origin+location.pathname.replace(/[^/]*$/,"")+"transfer.html#q="+encodeURIComponent(JSON.stringify(payload));
 return {url,ids:entries.map(x=>x.id),count:entries.length,includeAll};
}
function buildTransferUrl(){return buildTransferPackage(false).url}
function showTransferLink(url){
 const box=$("#transferLinkBox"),link=$("#transferLink");
 if(!box||!link)return;
 link.href=url;
 link.textContent=url;
 box.classList.remove("hidden");
}
async function sendToLaptop(){
 let pack;
 try{pack=buildTransferPackage()}catch(e){showSaveConfirmation(e.message);return}
 showTransferLink(pack.url);
 try{
   if(navigator.share){
     await navigator.share({title:"TimeEntry Transfer",text:"Open this link on your laptop to load the TimeEntry queue into the Chrome extension.",url:pack.url});
     markTransferred(pack.ids);
     showSaveConfirmation(pack.count+" new entr"+(pack.count===1?"y":"ies")+" shared");
     return;
   }
 }catch(err){
   if(err&&err.name==="AbortError")return;
 }
 try{
   await navigator.clipboard.writeText(pack.url);
   markTransferred(pack.ids);
   showSaveConfirmation(pack.count+" new entr"+(pack.count===1?"y":"ies")+" copied");
 }catch(_){
   showSaveConfirmation("Transfer link ready below");
 }
}
async function sendAllToLaptop(){
 let pack;
 try{pack=buildTransferPackage(true)}catch(e){showSaveConfirmation(e.message);return}
 if(!confirm("Send all "+pack.count+" saved entries, including entries that may have been transferred before?"))return;
 showTransferLink(pack.url);
 try{
   if(navigator.share){
     await navigator.share({title:"TimeEntry Transfer",text:"Open this link on your laptop to load ALL saved TimeEntry records into the Chrome extension.",url:pack.url});
     markTransferred(pack.ids);
     showSaveConfirmation(pack.count+" saved entries shared");
     return;
   }
 }catch(err){
   if(err&&err.name==="AbortError")return;
 }
 try{
   await navigator.clipboard.writeText(pack.url);
   markTransferred(pack.ids);
   showSaveConfirmation(pack.count+" saved entries copied");
 }catch(_){
   showSaveConfirmation("Transfer link ready below");
 }
}
async function copyJson(){
 const data=saved().map(({accountCode,date,type,hours,details})=>({accountCode,date,type,hours,details}));
 const text=JSON.stringify(data,null,2);
 try{await navigator.clipboard.writeText(text);alert("JSON queue copied.")}catch(_){prompt("Copy JSON queue:",text)}
}

function formatHistoryDate(iso){
  const [y,m,d]=iso.split("-").map(Number);
  return new Date(y,m-1,d).toLocaleDateString("en-CA",{weekday:"short",month:"short",day:"numeric"});
}
function queuedByDate(){
  const out={};
  for(const x of pendingEntries()){
    if(!out[x.date])out[x.date]={hours:0,breakdown:{},entries:[]};
    out[x.date].hours+=Number(x.hours)||0;
    out[x.date].breakdown[x.accountCode]=(out[x.date].breakdown[x.accountCode]||0)+(Number(x.hours)||0);
    out[x.date].entries.push(x);
  }
  return out;
}
function historicalRows(){
  const queued=queuedByDate();
  const out=[];
  const [sy,sm,sd]=HISTORY_START.split("-").map(Number);
  const [ey,em,ed]=todayISO().split("-").map(Number);
  const cur=new Date(sy,sm-1,sd),last=new Date(ey,em-1,ed);

  while(cur<=last){
    const weekday=cur.getDay();
    if(weekday>=1&&weekday<=5){
      const off=cur.getTimezoneOffset();
      const date=new Date(cur.getTime()-off*60000).toISOString().slice(0,10);
      const base=historicalSubmitted[date]||{hours:0,breakdown:{}};
      const q=queued[date]||{hours:0,breakdown:{},entries:[]};
      const submitted=Number(base.hours)||0;
      const queuedHours=Number(q.hours)||0;
      const effective=submitted+queuedHours;
      const remaining=Math.max(0,7-effective);
      const breakdown={...base.breakdown};
      for(const [code,hours] of Object.entries(q.breakdown||{})){
        breakdown[code]=(breakdown[code]||0)+hours;
      }
      out.push({
        date,submitted,queued:queuedHours,effective,remaining,breakdown,complete:effective>=7,
        submittedEntries:historicalDetails[date]||[],
        queuedEntries:q.entries||[]
      });
    }
    cur.setDate(cur.getDate()+1);
  }
  return out;
}
function renderHistorical(){
  const rows=historicalRows();
  const visibleRows=rows.filter(r=>historicalFilter==="all"||(historicalFilter==="missing"?!r.complete:r.complete));
  const missingHours=rows.reduce((sum,r)=>sum+r.remaining,0);
  const incomplete=rows.filter(r=>!r.complete).length;
  const queuedHours=rows.reduce((sum,r)=>sum+r.queued,0);
  $("#historicalMissingHours").textContent=missingHours.toFixed(1);
  $("#historicalIncompleteDays").textContent=String(incomplete);
  $("#historicalQueuedHours").textContent=queuedHours.toFixed(1);
  $("#historicalFilters")?.querySelectorAll("[data-history-filter]").forEach(b=>b.classList.toggle("active",b.dataset.historyFilter===historicalFilter));

  $("#historicalList").innerHTML=visibleRows.length?visibleRows.map(r=>{
    const chips=Object.entries(r.breakdown)
      .filter(([,h])=>Number(h)>0)
      .map(([code,h])=>'<span class="history-chip">'+code+' '+Number(h).toFixed(1)+'</span>').join("");
    const status=r.complete
      ? '<span class="history-status complete">'+r.effective.toFixed(1)+' h ✓'+(r.effective>7?' • +'+(r.effective-7).toFixed(1)+' over':'')+'</span>'
      : '<span class="history-status missing">'+r.remaining.toFixed(1)+' h missing</span>';
    const queued=r.queued>0?'<small class="queued-note">'+r.queued.toFixed(1)+' h queued in Fast Entry</small>':"";
    const expanded=expandedHistoricalDays.has(r.date) || true;

    const submittedLines=r.submittedEntries.map(x=>
      '<div class="history-detail-row">'+
        '<div class="history-detail-main"><strong>'+x.accountCode+'</strong><span>'+x.type+' • '+Number(x.hours).toFixed(1)+' h</span></div>'+
        '<p>'+x.details+'</p>'+
      '</div>'
    ).join("");

    const queuedLines=r.queuedEntries.map(x=>
      '<div class="history-detail-row queued-detail">'+
        '<div class="history-detail-main"><strong>'+x.accountCode+'</strong><span>'+x.type+' • '+Number(x.hours).toFixed(1)+' h • QUEUED</span></div>'+
        '<p>'+x.details+'</p>'+
        '<button type="button" class="history-edit-queued" data-edit-queued="'+x.id+'">Edit queued entry</button>'+
      '</div>'
    ).join("");

    const detailsContent=(submittedLines||queuedLines)
      ? (submittedLines+queuedLines)
      : '<p class="history-no-details">No submitted details for this date.</p>';

    return '<article class="history-day '+(r.complete?"is-complete":"is-missing")+'">'+
      '<div class="history-day-top"><div><strong>'+formatHistoryDate(r.date)+'</strong><small>'+r.submitted.toFixed(1)+' submitted • '+r.effective.toFixed(1)+' / 7.0 h including queue</small></div>'+status+'</div>'+
      '<div class="history-breakdown">'+(chips||'<span class="history-chip empty">No submitted time</span>')+'</div>'+
      queued+
      '<div class="history-details always-visible">'+detailsContent+'</div>'+
      (!r.complete
        ? '<button type="button" class="primary history-add" data-history-date="'+r.date+'" data-history-remaining="'+r.remaining+'">Add Missing Time • '+r.remaining.toFixed(1)+' h</button>'
        : '<button type="button" class="ghost history-additional" data-history-date="'+r.date+'" data-history-effective="'+r.effective+'">Add Additional Time</button>')+
    '</article>';
  }).join(""):'<p class="empty-history">No days in this view.</p>';

  $("#historicalList")?.querySelectorAll(".history-add").forEach(b=>b.onclick=()=>{
    catchupContext={mode:"missing",date:b.dataset.historyDate,remaining:Number(b.dataset.historyRemaining)};
    showOnly("portfolioScreen");
    renderPortfolio();
  });
  $("#historicalList")?.querySelectorAll(".history-additional").forEach(b=>b.onclick=()=>{
    catchupContext={mode:"additional",date:b.dataset.historyDate,effective:Number(b.dataset.historyEffective)};
    showOnly("portfolioScreen");
    renderPortfolio();
  });
  $("#historicalList")?.querySelectorAll("[data-edit-queued]").forEach(b=>b.onclick=()=>{
    catchupContext=null;
    editEntry(b.dataset.editQueued);
  });
}
function openHistorical(){
  catchupContext=null;
  historicalFilter="all";
  renderHistorical();
  showOnly("historicalScreen");
}

function batchDateRange(){
  const start=HISTORY_START;
  const end=todayISO();
  const [sy,sm,sd]=start.split("-").map(Number);
  const [ey,em,ed]=end.split("-").map(Number);
  const cur=new Date(sy,sm-1,sd),last=new Date(ey,em-1,ed),out=[];
  while(cur<=last){
    const day=cur.getDay();
    if(day>=1&&day<=5){
      const off=cur.getTimezoneOffset();
      out.push(new Date(cur.getTime()-off*60000).toISOString().slice(0,10));
    }
    cur.setDate(cur.getDate()+1);
  }
  return out;
}
function renderMultiDates(selectedDates=[]){
  const selected=new Set(selectedDates);
  const rowsByDate=Object.fromEntries(historicalRows().map(r=>[r.date,r]));
  $("#multiDateGrid").innerHTML=batchDateRange().map(date=>{
    const r=rowsByDate[date];
    const meta=r
      ? (r.complete
          ? r.effective.toFixed(1)+" h logged"+(r.effective>7?" • +"+(r.effective-7).toFixed(1)+" over":"")
          : r.remaining.toFixed(1)+" h missing")
      : "No history";
    return '<label class="multi-date-option '+(r?.complete?"complete":"")+'">'+
      '<input type="checkbox" value="'+date+'" '+(selected.has(date)?"checked":"")+'>'+
      '<span><strong>'+formatHistoryDate(date)+'</strong><small>'+meta+'</small></span>'+
    '</label>';
  }).join("");
}
function openMultipleEntries(prefillIncomplete=false){
  catchupContext=null;
  $("#multiCustomer").innerHTML=customers.map(c=>'<option value="'+c.id+'">'+c.short+'</option>').join("");
  $("#multiType").innerHTML=types.map(t=>'<option value="'+t+'">'+t+'</option>').join("");
  $("#multiCustomer").value="PS";
  $("#multiType").value="Meeting";
  $("#multiHours").value="0.5";
  $("#multiDetails").value="";
  $("#multiMessage").textContent="";
  const dates=prefillIncomplete?historicalRows().filter(r=>!r.complete).map(r=>r.date):[];
  renderMultiDates(dates);
  showOnly("multiEntryScreen");
}
function saveMultipleEntries(){
  const accountCode=$("#multiCustomer").value;
  const type=$("#multiType").value;
  const hours=Number($("#multiHours").value);
  const details=$("#multiDetails").value.trim();
  const dates=[...$("#multiDateGrid").querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value);

  if(!accountCode){$("#multiMessage").textContent="Choose a customer.";return}
  if(!type){$("#multiMessage").textContent="Choose a type.";return}
  if(!details){$("#multiMessage").textContent="Add details.";return}
  if(!dates.length){$("#multiMessage").textContent="Select at least one date.";return}

  const data=saved();
  let added=0,skipped=0;
  for(const date of dates){
    const duplicate=data.some(x=>
      x.accountCode===accountCode &&
      x.date===date &&
      x.type===type &&
      Number(x.hours)===hours &&
      String(x.details||"").trim().toLowerCase()===details.toLowerCase()
    );
    if(duplicate){skipped++;continue}
    data.push({
      id:crypto.randomUUID?.()||String(Date.now()+added),
      timestamp:new Date().toISOString(),
      batchCreated:true,
      accountCode,date,type,hours,details
    });
    added++;
  }
  saveAll(data);
  renderHistory();
  renderHistorical();
  $("#multiMessage").textContent=added+" entr"+(added===1?"y":"ies")+" added to Saved"+(skipped?" • "+skipped+" duplicate"+(skipped===1?"":"s")+" skipped":"")+" ✓";
  showSaveConfirmation(added+" entr"+(added===1?"y":"ies")+" added to Saved ✓");
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
$("#multipleEntriesBtn").onclick=()=>openMultipleEntries(false);
$("#multiNavBtn").onclick=()=>openMultipleEntries(false);
$("#historicalMultipleBtn").onclick=()=>openMultipleEntries(true);
$("#multiBackBtn").onclick=()=>{showOnly("portfolioScreen");renderPortfolio()};
$("#multiSelectWeekdaysBtn").onclick=()=>renderMultiDates(historicalRows().filter(r=>!r.complete).map(r=>r.date));
$("#multiSaveBtn").onclick=saveMultipleEntries;
$("#fastEntryNavBtn").onclick=()=>{catchupContext=null;showOnly("portfolioScreen");renderPortfolio()};
$("#historicalNavBtn").onclick=openHistorical;
$("#historicalBackBtn").onclick=()=>{catchupContext=null;showOnly("portfolioScreen");renderPortfolio()};
$("#historicalFilters").onclick=e=>{const b=e.target.closest("[data-history-filter]");if(!b)return;historicalFilter=b.dataset.historyFilter;renderHistorical()};
$("#backBtn").onclick=showPortfolio;
$("#hoursMinus").onclick=()=>changeHours(-0.5);
$("#hoursPlus").onclick=()=>changeHours(0.5);
$("#saveBtn").onclick=()=>saveEntry(false);
$("#saveNextBtn").onclick=()=>saveEntry(true);
$("#historyBtn").onclick=()=>{$("#history").classList.remove("hidden");renderHistory();$("#history").scrollIntoView({behavior:"smooth"})};
$("#closeHistoryBtn").onclick=()=>$("#history").classList.add("hidden");
$("#sendLaptopBtn").onclick=sendToLaptop;
$("#sendAllLaptopBtn").onclick=sendAllToLaptop;
$("#copyTransferLinkBtn").onclick=async()=>{try{const pack=buildTransferPackage();showTransferLink(pack.url);await navigator.clipboard.writeText(pack.url);markTransferred(pack.ids);showSaveConfirmation(pack.count+" new entr"+(pack.count===1?"y":"ies")+" copied")}catch(e){showSaveConfirmation(e.message)}};
$("#copyJsonBtn").onclick=copyJson;
$("#clearHistoryBtn").onclick=()=>{if(confirm("Clear all saved time entries?")){saveAll([]);renderHistory()}};
$("#layoutToggle").onclick=e=>{const b=e.target.closest("button[data-layout]");if(!b)return;localStorage.setItem("timeentry-layout",b.dataset.layout);applyRosterLayout()};
restoreRequestedFour();
renderHistory();