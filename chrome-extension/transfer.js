(async()=>{
  const msg=document.getElementById("transferMessage");
  try{
    const hash=location.hash||"";
    if(!hash.startsWith("#q="))throw new Error("No TimeEntry queue found in this link.");
    const text=decodeURIComponent(hash.slice(3));
    const raw=JSON.parse(text);
    if(!Array.isArray(raw)||!raw.length)throw new Error("The TimeEntry queue is empty.");
    const queue=raw.map(item=>Array.isArray(item)?{
      accountCode:item[0],
      date:item[1],
      type:item[2],
      hours:item[3],
      details:item[4]
    }:item);
    for(const item of queue){
      for(const key of ["accountCode","date","type","hours","details"]){
        if(item[key]===undefined||item[key]===null||item[key]==="")throw new Error("The transfer data is missing "+key+".");
      }
    }
    await chrome.storage.local.set({queueText:JSON.stringify(queue,null,2),queueCursor:0});
    history.replaceState(null,"",location.pathname);
    if(msg){
      msg.textContent=queue.length+" entries imported into the TimeEntry Chrome extension ✓";
      msg.className="ok";
    }
  }catch(e){
    if(msg){
      msg.textContent=e.message||String(e);
      msg.className="bad";
    }
  }
})();