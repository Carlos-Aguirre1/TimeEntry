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
function activeFormRoot(){
  const candidates=[...document.querySelectorAll('[role="dialog"],.slds-modal,.modal-container,records-record-edit-form')]
    .filter(visible);
  const root=candidates.find(c=>{
    const t=norm(c.innerText||c.textContent);
    return t.includes("new time tracking") && (t.includes("save & new")||t.includes("save and new"));
  });
  return root||document;
}
function fieldByLabel(labelText){
  const wanted=norm(labelText);
  const root=activeFormRoot();

  const findIn=scope=>{
    const labels=[...scope.querySelectorAll("label")].filter(visible);
    let label=labels.find(x=>norm(x.textContent)===wanted)||labels.find(x=>norm(x.textContent).includes(wanted));
    if(label){
      const id=label.getAttribute("for");
      if(id){
        const byId=(scope.getElementById?scope.getElementById(id):document.getElementById(id));
        if(byId&&visible(byId))return byId;
      }
      const container=label.closest(".slds-form-element,lightning-input,lightning-textarea,lightning-combobox,records-record-layout-item,lightning-base-combobox")||label.parentElement;
      const input=container?.querySelector("input,textarea,select,button[role=combobox],button[aria-haspopup=listbox],[role=combobox]");
      if(input&&visible(input))return input;
    }

    const containers=[...scope.querySelectorAll(".slds-form-element,lightning-input,lightning-textarea,lightning-combobox,records-record-layout-item,lightning-base-combobox")].filter(visible);
    for(const c of containers){
      const t=norm(c.innerText||c.textContent);
      if(t===wanted||t.startsWith(wanted+" ")||t.includes(wanted)){
        const input=c.querySelector("input,textarea,select,button[role=combobox],button[aria-haspopup=listbox],[role=combobox]");
        if(input&&visible(input))return input;
      }
    }
    return null;
  };

  return findIn(root) || (root!==document ? findIn(document) : null);
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

  const container=el.closest(".slds-form-element,records-record-layout-item")||el.parentElement;
  const accepted=()=>{
    const text=norm(container?.innerText||"");
    const pill=container?.querySelector('.slds-pill,button[title*="Remove"],button[aria-label*="Remove"]');
    return !!pill && text.includes(norm(accountName));
  };

  el.focus();
  setNativeValue(el,"");
  await sleep(120);
  setNativeValue(el,accountName);

  // Wait for Salesforce lookup results to render, then click the matching suggestion.
  for(let attempt=0;attempt<12;attempt++){
    await sleep(180);
    const candidates=[...document.querySelectorAll(
      '[role="option"],lightning-base-combobox-item,.slds-listbox__option,.slds-listbox__item,li'
    )].filter(visible);
    const match=candidates.find(o=>{
      const t=norm(o.innerText||o.textContent);
      return t.includes(norm(accountName)) && !t.startsWith("show more results");
    });
    if(match){
      const clickTarget=match.querySelector(
        'a,button,[role="option"],.slds-media,.slds-listbox__option-text,.slds-listbox__option'
      )||match;
      clickTarget.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,composed:true}));
      clickTarget.dispatchEvent(new MouseEvent("mouseup",{bubbles:true,composed:true}));
      clickTarget.click();
      await sleep(700);
      if(accepted())return;
    }
  }

  // Keyboard fallback for standard lookup suggestions.
  el.focus();
  el.dispatchEvent(new KeyboardEvent("keydown",{bubbles:true,key:"ArrowDown"}));
  await sleep(180);
  el.dispatchEvent(new KeyboardEvent("keydown",{bubbles:true,key:"Enter"}));
  await sleep(700);
  if(accepted())return;

  // Advanced lookup results grid fallback.
  // Scope to the visible Advanced Search dialog, select the matching/first result radio,
  // then click the bottom-right Select button.
  for(let wait=0;wait<24;wait++){
    await sleep(220);

    const dialogs=[...document.querySelectorAll('[role="dialog"],.slds-modal,.modal-container')]
      .filter(visible);
    const dialog=dialogs.find(d=>norm(d.innerText||d.textContent).includes("advanced search"))
      || dialogs.find(d=>norm(d.innerText||d.textContent).includes(norm(accountName)))
      || document;

    const rows=[...dialog.querySelectorAll('tbody tr,[role="row"]')]
      .filter(visible)
      .filter(r=>{
        const t=norm(r.innerText||r.textContent);
        return t && !t.includes("account name") && !t.includes("billing city");
      });

    const row=rows.find(r=>norm(r.innerText||r.textContent).includes(norm(accountName))) || rows[0];

    if(row){
      const radio=row.querySelector('input[type="radio"]');
      const radioLabel=radio && radio.id ? dialog.querySelector('label[for="'+CSS.escape(radio.id)+'"]') : null;
      const faux=row.querySelector('.slds-radio_faux,[role="radio"]');

      if(radio){
        radio.scrollIntoView({block:"center"});
        radio.focus();
        radio.click();
        radio.checked=true;
        fire(radio,"input");
        fire(radio,"change");
        radio.dispatchEvent(new KeyboardEvent("keydown",{bubbles:true,key:" ",code:"Space"}));
        radio.dispatchEvent(new KeyboardEvent("keyup",{bubbles:true,key:" ",code:"Space"}));
      }
      if(radioLabel)radioLabel.click();
      if(faux)faux.click();

      // Coordinate fallback on the visible radio circle in the first column.
      const rr=row.getBoundingClientRect();
      const x=rr.left+14;
      const y=rr.top+rr.height/2;
      const atPoint=document.elementFromPoint(x,y);
      if(atPoint){
        atPoint.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,composed:true,clientX:x,clientY:y,button:0}));
        atPoint.dispatchEvent(new MouseEvent("mouseup",{bubbles:true,composed:true,clientX:x,clientY:y,button:0}));
        atPoint.dispatchEvent(new MouseEvent("click",{bubbles:true,composed:true,clientX:x,clientY:y,button:0}));
      }

      // Wait for the bottom-right Select button to enable.
      for(let i=0;i<20;i++){
        await sleep(180);
        const buttons=[...dialog.querySelectorAll("button")].filter(visible);
        const selectBtn=buttons.find(b=>norm(b.innerText||b.textContent)==="select")
          || [...document.querySelectorAll("button")].filter(visible).find(b=>norm(b.innerText||b.textContent)==="select");
        if(selectBtn && !selectBtn.disabled && selectBtn.getAttribute("aria-disabled")!=="true"){
          selectBtn.click();
          await sleep(1000);
          if(accepted())return;
          break;
        }
      }
    }
  }

  throw new Error('Salesforce found "'+accountName+'" but the extension could not select the Advanced Search row.');
}
async function fillEntry(entry,mapping){
  const accountName=mapping[entry.accountCode];
  if(!accountName)throw new Error("No mapping for account code "+entry.accountCode);
  await setAccount(accountName);

  const date=fieldByLabel("Date");
  if(!date)throw new Error("Could not find Salesforce Date field.");
  const iso=String(entry.date||"");
  const m=iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const localized=m ? (m[3]+"/"+m[2]+"/"+m[1]) : iso;
  setNativeValue(date,localized);

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