const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function norm(s){return (s||"").replace(/\s+/g," ").trim().toLowerCase()}
function visible(el){const r=el?.getBoundingClientRect?.();return !!(r&&r.width&&r.height)}
function fire(el,type){el.dispatchEvent(new Event(type,{bubbles:true,composed:true}))}
function setNativeValue(el,value){
  const proto=el.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,"value")?.set;
  setter?setter.call(el,String(value)):el.value=String(value);
  fire(el,"input");fire(el,"change");el.dispatchEvent(new KeyboardEvent("keyup",{bubbles:true,key:"Tab"}));
}
function allTextEls(){
  return [...document.querySelectorAll("label,span,div,lightning-base-formatted-text,button")].filter(visible);
}
function fieldByLabel(labelText){
  const wanted=norm(labelText);
  const labels=[...document.querySelectorAll("label")].filter(visible);
  let label=labels.find(x=>norm(x.textContent)===wanted)||labels.find(x=>norm(x.textContent).includes(wanted));
  if(label){
    const id=label.getAttribute("for");
    if(id){
      const byId=document.getElementById(id); if(byId&&visible(byId))return byId;
    }
    const container=label.closest(".slds-form-element,lightning-input,lightning-textarea,lightning-combobox,records-record-layout-item")||label.parentElement;
    const input=container?.querySelector("input,textarea,button[role=combobox],button[aria-haspopup=listbox]");
    if(input&&visible(input))return input;
  }
  const containers=[...document.querySelectorAll(".slds-form-element,lightning-input,lightning-textarea,lightning-combobox,records-record-layout-item")].filter(visible);
  for(const c of containers){
    if(norm(c.innerText).startsWith(wanted)||norm(c.innerText).includes(wanted)){
      const input=c.querySelector("input,textarea,button[role=combobox],button[aria-haspopup=listbox]");
      if(input&&visible(input))return input;
    }
  }
  return null;
}
async function selectPicklist(label,value){
  const el=fieldByLabel(label);
  if(!el)throw new Error("Could not find Salesforce field: "+label);
  if(el.tagName==="SELECT"){
    el.value=value;fire(el,"change");return;
  }
  el.click();await sleep(350);
  const options=[...document.querySelectorAll('[role="option"],lightning-base-combobox-item')].filter(visible);
  const opt=options.find(o=>norm(o.innerText||o.textContent)===norm(value))||options.find(o=>norm(o.innerText||o.textContent).includes(norm(value)));
  if(!opt)throw new Error('Could not find "'+value+'" in '+label+' dropdown.');
  opt.click();await sleep(250);
}
async function setAccount(accountName){
  const el=fieldByLabel("Account");
  if(!el)throw new Error("Could not find Salesforce Account lookup.");
  el.focus();
  setNativeValue(el,accountName);
  await sleep(900);
  const options=[...document.querySelectorAll('[role="option"],lightning-base-combobox-item,.slds-listbox__option')].filter(visible);
  let opt=options.find(o=>norm(o.innerText||o.textContent).includes(norm(accountName)));
  if(!opt){
    el.dispatchEvent(new KeyboardEvent("keydown",{bubbles:true,key:"ArrowDown"}));
    await sleep(250);
    el.dispatchEvent(new KeyboardEvent("keydown",{bubbles:true,key:"Enter"}));
    await sleep(400);
    return;
  }
  opt.click();await sleep(400);
}
async function fillEntry(entry,mapping){
  const accountName=mapping[entry.accountCode];
  if(!accountName)throw new Error("No mapping for account code "+entry.accountCode);
  await setAccount(accountName);

  const date=fieldByLabel("Date");
  if(!date)throw new Error("Could not find Salesforce Date field.");
  setNativeValue(date,entry.date);

  await selectPicklist("Type",entry.type);

  const hours=fieldByLabel("Number of Hours");
  if(!hours)throw new Error("Could not find Salesforce Number of Hours field.");
  setNativeValue(hours,entry.hours);

  const details=fieldByLabel("Details");
  if(!details)throw new Error("Could not find Salesforce Details field.");
  setNativeValue(details,entry.details);

  return "Filled "+entry.accountCode+" • "+entry.hours+" h • "+entry.type;
}
function buttonByText(text){
  const wanted=norm(text);
  return [...document.querySelectorAll("button")].filter(visible).find(b=>norm(b.innerText||b.textContent)===wanted);
}
async function clickSaveNew(){
  const b=buttonByText("Save & New")||buttonByText("Save and New");
  if(!b)throw new Error('Could not find Salesforce "Save & New" button.');
  b.click();
}
async function waitForNewForm(){
  await sleep(1000);
  for(let i=0;i<20;i++){
    const hours=fieldByLabel("Number of Hours");
    const details=fieldByLabel("Details");
    if(hours&&details&&(!hours.value||Number(hours.value)===0)&&!details.value)return;
    await sleep(350);
  }
  await sleep(800);
}
async function runQueue(queue,mapping){
  for(let i=0;i<queue.length;i++){
    await fillEntry(queue[i],mapping);
    await sleep(250);
    await clickSaveNew();
    if(i<queue.length-1)await waitForNewForm();
  }
  return "Processed "+queue.length+" entries.";
}

chrome.runtime.onMessage.addListener((msg,_sender,sendResponse)=>{
  if(msg?.source!=="timeentry-extension")return;
  (async()=>{
    try{
      if(msg.action==="fillCurrent"){
        const message=await fillEntry(msg.queue[0],msg.mapping);
        return {ok:true,message:message+". Review the fields before saving."};
      }
      if(msg.action==="fillSaveNew"){
        const message=await fillEntry(msg.queue[0],msg.mapping);
        await clickSaveNew();
        return {ok:true,message:message+". Save & New clicked."};
      }
      if(msg.action==="runQueue"){
        const message=await runQueue(msg.queue,msg.mapping);
        return {ok:true,message};
      }
      return {ok:false,error:"Unknown TimeEntry action."};
    }catch(e){return {ok:false,error:e.message||String(e)}}
  })().then(sendResponse);
  return true;
});