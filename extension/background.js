chrome.runtime.onInstalled.addListener(()=>{
  chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true}).catch(()=>{});
  chrome.contextMenus.create({id:"adr-add",title:"약 이상반응 찾기에 추가: \"%s\"",contexts:["selection"]});
});
chrome.contextMenus.onClicked.addListener((info,tab)=>{
  if(info.menuItemId!=="adr-add")return;
  chrome.sidePanel.open({windowId:tab.windowId}).catch(()=>{});
  chrome.storage.session.set({pending:{text:info.selectionText||"",at:Date.now()}});
});
