(async()=>{
  const msg=document.getElementById("transferMessage");
  try{
    const hash=location.hash||"";
    if(!hash.startsWith("#q="))throw new Error("No TimeEntry queue found in this link.");
    const text=decodeURIComponent(hash.slice(3));
    const queue=JSON.parse(text);
    if(!Array.isArray(queue)||!queue.length)throw new Error("The TimeEntry queue is empty.");
    for(const item of queue){
      for(const key of ["accountCode","date","type","hours","details"]){
        if(item[key]===undefined||item[key]===null||item[key]==="")throw new Error("The transfer data is missing "+key+".");
      }
    }
    await chrome.storage.local.set({queueText:JSON.stringify(queue,null,2)});
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