// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'askAboutSelection',
    title: 'Dify: 询问关于选中内容',
    contexts: ['selection']
  });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'askAboutSelection') {
    chrome.tabs.sendMessage(tab.id, {
      type: 'showQuestionModal',
      text: info.selectionText
    });
  }
});
