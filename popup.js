// 等待DOM完全加载
document.addEventListener('DOMContentLoaded', async function() {
  // 加载已保存的配置
  const result = await chrome.storage.sync.get([
    'apiUrl', 
    'tokens', 
    'selectedToken', 
    'enableBaiduSearch'
  ]);
  
  const apiUrlInput = document.getElementById('apiUrl');
  if (result.apiUrl) {
    apiUrlInput.value = result.apiUrl;
  }
  
  // 加载功能开关状态
  const enableBaiduSearch = document.getElementById('enableBaiduSearch');
  enableBaiduSearch.checked = result.enableBaiduSearch !== false; // 默认开启

  if (result.tokens) {
    await updateTokenAppList(result.tokens, result.apiUrl, result.selectedToken);
  }

  // 添加Token按钮点击事件
  document.getElementById('addToken').addEventListener('click', async function() {
    const token = document.getElementById('tokenInput').value.trim();
    if (token) {
      const result = await chrome.storage.sync.get(['tokens', 'selectedToken']);
      const tokens = result.tokens || [];
      if (!tokens.includes(token)) {
        tokens.push(token);
        if (tokens.length === 1 && !result.selectedToken) {
          await chrome.storage.sync.set({selectedToken: token});
        }
        await chrome.storage.sync.set({tokens: tokens});
        document.getElementById('tokenInput').value = '';
        const apiUrl = document.getElementById('apiUrl').value.trim();
        if (apiUrl) {
          await updateTokenAppList(tokens, apiUrl, result.selectedToken || token);
        }
      }
    }
  });

  // API地址变更时保存
  apiUrlInput.addEventListener('change', async function() {
    const apiUrl = this.value.trim();
    await chrome.storage.sync.set({apiUrl: apiUrl});
    const result = await chrome.storage.sync.get(['tokens', 'selectedToken']);
    if (result.tokens) {
      await updateTokenAppList(result.tokens, apiUrl, result.selectedToken);
    }
  });

  // 功能开关变更事件
  enableBaiduSearch.addEventListener('change', async function() {
    await chrome.storage.sync.set({
      enableEnhancedSearch: this.checked,
      enableBaiduSearch: this.checked
    });
    notifySettingsChanged();
  });
});

// 应用列表
async function updateTokenAppList(tokens, apiUrl, selectedToken) {
  const tokenAppList = document.getElementById('tokenAppList');
  if (!tokenAppList) return;

  tokenAppList.innerHTML = '';

  // 对tokens进行排序，将selectedToken置顶
  const sortedTokens = tokens.sort((a, b) => {
    if (a === selectedToken) return -1;
    if (b === selectedToken) return 1;
    return 0;
  });

  // 存储应用名称的对象
  const appNames = {};

  for (const token of sortedTokens) {
    const tokenCard = document.createElement('div');
    tokenCard.className = 'bg-white rounded-lg shadow-sm overflow-hidden';

    // Token信息部分
    const tokenHeader = document.createElement('div');
    tokenHeader.className = 'flex items-center justify-between p-2 bg-gray-50 border-b';  // 减少padding

    const isSelected = token === selectedToken;
    const headerContent = document.createElement('div');
    headerContent.className = 'flex items-center space-x-2 flex-1';
    headerContent.innerHTML = `
      <span class="text-sm font-medium text-gray-700">${token.substring(0, 8)}...</span>
      ${isSelected ? '<span class="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">当前使用</span>' : ''}
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex items-center space-x-1';  // 减少按钮间距

    if (!isSelected) {
      const selectButton = document.createElement('button');
      selectButton.className = 'px-2 py-1 text-sm text-white bg-green-500 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2';
      selectButton.textContent = '使用';
      selectButton.addEventListener('click', async () => {
        await chrome.storage.sync.set({selectedToken: token});
        // 通知所有标签页Token已更改
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          try {
            await chrome.tabs.sendMessage(tab.id, { type: 'tokenChanged' });
          } catch (error) {
            // 忽略不支持的标签页错误
          }
        }
        await updateTokenAppList(tokens, apiUrl, token);
      });
      buttonContainer.appendChild(selectButton);
    }

    const deleteButton = document.createElement('button');
    deleteButton.className = 'px-2 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2';
    deleteButton.textContent = '删除';
    deleteButton.addEventListener('click', async () => {
      const newTokens = tokens.filter(t => t !== token);
      await chrome.storage.sync.set({tokens: newTokens});
      if (token === selectedToken) {
        await chrome.storage.sync.set({selectedToken: newTokens[0] || null});
      }
      await updateTokenAppList(newTokens, apiUrl, newTokens[0] || null);
    });
    buttonContainer.appendChild(deleteButton);

    tokenHeader.appendChild(headerContent);
    tokenHeader.appendChild(buttonContainer);

    // 应用信息部分
    const appInfo = document.createElement('div');
    appInfo.className = 'p-2';  // 减少padding

    try {
      if (!apiUrl) {
        appInfo.innerHTML = `<p class="text-sm text-yellow-600">请先配置API地址</p>`;
      } else {
        const response = await fetch(`${apiUrl}/info?user=extension_user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // 存储应用名称
          if (data.name) {
            appNames[token] = data.name;
            console.log('[DifyHelper] Stored app name for token:', token, data.name);
          }
          appInfo.innerHTML = `
            <div class="space-y-1">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-gray-900">${data.name || '未命名应用'}</span>
                ${data.tags?.length ? `<span class="px-2 py-0.5 text-xs text-indigo-600 bg-indigo-100 rounded-full">${data.tags.join(', ')}</span>` : ''}
              </div>
              ${data.description ? `<p class="text-xs text-gray-500">${data.description}</p>` : ''}
            </div>
          `;
        } else {
          appInfo.innerHTML = `<p class="text-sm text-yellow-600">无法获取应用信息</p>`;
        }
      }
    } catch (error) {
      appInfo.innerHTML = `<p class="text-sm text-red-600">获取应用信息失败: ${error.message}</p>`;
    }

    tokenCard.appendChild(tokenHeader);
    tokenCard.appendChild(appInfo);
    tokenAppList.appendChild(tokenCard);
  }

  // 保存应用名称到存储
  if (Object.keys(appNames).length > 0) {
    console.log('[DifyHelper] Saving app names:', appNames);
    await chrome.storage.sync.set({ appNames });
  }
}

// 通知所有标签页设置已更改
async function notifySettingsChanged() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'settingsChanged' });
    } catch (error) {
      // 忽略不支持的标签页错误
    }
  }
}
