const $=s=>document.querySelector(s);

function parseMapping(text){
  const out={};
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim();
    if(!line||line.startsWith("#"))continue;
    const i=line.indexOf("=");
    if(i<1)continue;
    const code=line.slice(0,i).trim();
    const name=line.slice(i+1).trim();
    if(code&&name)out[code]=name;
  }
  return out;
}
function mappingToText(map){
  return Object.entries(map||{}).map(([k,v])=>k+"="+v).join("\n");
}
function parseQueue(){
  const text=$("#queue").value.trim();
  if(!text)throw new Error("Paste the TimeEntry JSON queue first.");
  const data=JSON.parse(text);
  if(!Array.isArray(data)||!data.length)throw new Error("Queue must be a non-empty JSON array.");
  for(const [i,x] of data.entries()){
    for(const key of ["accountCode","date","type","hours","details"]){
      if(x[key]===undefined||x[key]===null||x[key]==="")throw new Error("Entry "+(i+1)+" is missing "+key+".");
    }
  }
  return data;
}
function setStatus(msg,bad=false){
  const el=$("#status"); el.textContent=msg; el.className="status "+(bad?"bad":"good");
}
function updateQueueStatus(){
  try{
    const q=parseQueue();
    $("#queueStatus").textContent=q.length+" entr"+(q.length===1?"y":"ies")+" ready.";
  }catch(_){$("#queueStatus").textContent="No valid queue loaded."}
}
async function getActiveTab(){
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id)throw new Error("No active browser tab.");
  return tab;
}
async function sendToSalesforce(action){
  const queue=parseQueue();
  const stored=await chrome.storage.local.get(["accountMapping","queueCursor"]);
  const mapping=stored.accountMapping||{};
  const missing=[...new Set(queue.map(x=>x.accountCode).filter(c=>!mapping[c]))];
  if(missing.length)throw new Error("Missing account mapping for: "+missing.join(", "));
  const tab=await getActiveTab();
  const cursor=Math.max(0,Math.min(Number(stored.queueCursor||0),queue.length-1));
  const message={source:"timeentry-extension",action,queue,mapping,cursor};

  const trySend=()=>chrome.tabs.sendMessage(tab.id,message);

  let response;
  try{
    response=await trySend();
  }catch(err){
    const msg=String(err?.message||err||"");
    if(!msg.toLowerCase().includes("receiving end does not exist") &&
       !msg.toLowerCase().includes("could not establish connection")) throw err;

    // The Salesforce tab was likely already open when the extension was reloaded.
    // Inject the content script into the current tab and retry automatically.
    await chrome.scripting.executeScript({
      target:{tabId:tab.id},
      files:["content.js"]
    });
    await new Promise(r=>setTimeout(r,250));
    response=await trySend();
  }

  if(!response?.ok)throw new Error(response?.error||"Salesforce transfer failed.");
  if(Number.isInteger(response.nextCursor))await chrome.storage.local.set({queueCursor:response.nextCursor});
  return response;
}

document.addEventListener("DOMContentLoaded",async()=>{
  const stored=await chrome.storage.local.get(["accountMapping","queueText","queueCursor"]);
  const defaultMapping={BL:"BlueLinx Corporation",IS:"IntegraServ Inc",HC:"Heartland Computers, Inc",KI:"KIOSK Information Systems Inc",TD:"Taylor Data Systems Inc",PS:"SOTI - Professional Services"};
  const effectiveMapping=Object.keys(stored.accountMapping||{}).length?stored.accountMapping:defaultMapping;
  if(!Object.keys(stored.accountMapping||{}).length)await chrome.storage.local.set({accountMapping:effectiveMapping});
  $("#mapping").value=mappingToText(effectiveMapping);
  $("#queue").value=stored.queueText||"";
  updateQueueStatus();
  if(stored.queueText && stored.queueCursor===undefined)await chrome.storage.local.set({queueCursor:0});
});

$("#saveMapping").onclick=async()=>{
  const mapping=parseMapping($("#mapping").value);
  await chrome.storage.local.set({accountMapping:mapping});
  setStatus("Account mapping saved locally in Chrome.");
};
$("#saveQueue").onclick=async()=>{
  try{
    parseQueue();
    await chrome.storage.local.set({queueText:$("#queue").value,queueCursor:0});
    updateQueueStatus();
    setStatus("Queue saved locally in Chrome.");
  }catch(e){setStatus(e.message,true)}
};
$("#loadClipboard").onclick=async()=>{
  try{
    $("#queue").value=await navigator.clipboard.readText();
    updateQueueStatus();
    setStatus("Clipboard pasted.");
  }catch(e){setStatus("Clipboard access failed. Paste manually into the queue box.",true)}
};
$("#queue").addEventListener("input",updateQueueStatus);

$("#fillCurrent").onclick=async()=>{
  try{
    setStatus("Filling current queue entry...");
    const r=await sendToSalesforce("fillCurrent");
    setStatus(r.message||"Current entry filled. Review Salesforce before saving.");
  }catch(e){setStatus(e.message,true)}
};
$("#fillSaveNew").onclick=async()=>{
  try{
    setStatus("Processing the remaining queue with Save & New...");
    const r=await sendToSalesforce("fillSaveNew");
    setStatus(r.message||"Entry filled and Save & New clicked.");
  }catch(e){setStatus(e.message,true)}
};
$("#runQueue").onclick=async()=>{
  try{
    const q=parseQueue();
    if(!confirm("Run all "+q.length+" entries? Start with Fill Current Entry first to verify the Salesforce field mapping."))return;
    setStatus("Running queue. Keep the Salesforce tab open...");
    const r=await sendToSalesforce("runQueue");
    setStatus(r.message||"Queue complete.");
  }catch(e){setStatus(e.message,true)}
};