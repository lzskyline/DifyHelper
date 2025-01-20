// 搜索引擎增强功能的基类
class SearchEngineEnhancer {
  constructor() {
    this.container = null;
    this.isEnabled = false;
  }

  // 检查当前页面是否匹配
  isMatch() {
    return false;
  }

  // 获取搜索关键词
  getSearchQuery() {
    return '';
  }

  // 创建增强内容容器
  createContainer() {}

  // 初始化增强功能
  initialize() {}

  // 清理功能
  cleanup() {}
}

// 百度搜索增强
class BaiduEnhancer extends SearchEngineEnhancer {
  constructor() {
    super();
    this.leftContentSelector = '#content_left';
    this.initialized = false;
    this.container = null;
    this.currentQuery = null;
    this.manuallyClosedTime = 0;
    this.isInitializing = false;
    this.domStableTimeout = null;
    this.lastDomChange = 0;
  }

  isMatch() {
    return window.location.hostname === 'www.baidu.com' && 
           (window.location.pathname === '/s' || window.location.pathname === '/');
  }

  getSearchQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('wd') || '';
  }

  shouldReInitialize() {
    const newQuery = this.getSearchQuery();
    if (newQuery !== this.currentQuery) {
      this.currentQuery = newQuery;
      return true;
    }
    return false;
  }

  async createContainer() {
    // 检查是否在短时间内手动关闭过
    const now = Date.now();
    if (now - this.manuallyClosedTime < 1000) {
      console.log('[DifyHelper] Skipping container creation - recently closed');
      return null;
    }

    // 清理可能存在的旧容器
    const existingContainer = document.getElementById('dify-search-enhance');
    if (existingContainer) {
      existingContainer.remove();
    }

    // 等待搜索结果加载完成
    const leftContent = document.querySelector(this.leftContentSelector);
    if (!leftContent) {
      console.log('[DifyHelper] Left content not found');
      return null;
    }

    // 创建或更新锚点节点
    let anchorNode = document.getElementById('dify-search-enhance-anchor');
    if (!anchorNode) {
      anchorNode = document.createElement('div');
      anchorNode.id = 'dify-search-enhance-anchor';
      anchorNode.style.display = 'none';
      leftContent.insertBefore(anchorNode, leftContent.firstChild);
    }

    // 获取当前选中的应用名称
    const result = await chrome.storage.sync.get(['selectedToken', 'appNames']);
    let appName = '智能助手';
    
    if (result.selectedToken && result.appNames) {
      const storedName = result.appNames[result.selectedToken];
      if (storedName) {
        appName = storedName;
        console.log('[DifyHelper] Using stored app name:', appName);
      } else {
        // 如果存储中没有应用名称，尝试从API获取
        try {
          const apiResult = await chrome.storage.sync.get(['apiUrl']);
          if (apiResult.apiUrl) {
            const response = await fetch(`${apiResult.apiUrl}/info?user=extension_user`, {
              headers: {
                'Authorization': `Bearer ${result.selectedToken}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.name) {
                appName = data.name;
                // 更新存储中的应用名称
                const appNames = result.appNames || {};
                appNames[result.selectedToken] = data.name;
                await chrome.storage.sync.set({ appNames });
                console.log('[DifyHelper] Updated app name from API:', appName);
              }
            }
          }
        } catch (error) {
          console.error('[DifyHelper] Error fetching app name:', error);
        }
      }
    } else {
      console.log('[DifyHelper] No token or app names found, using default name');
    }

    // 创建容器
    this.container = document.createElement('div');
    this.container.id = 'dify-search-enhance';
    this.container.className = 'result-op c-container xpath-log new-pmd';
    this.container.setAttribute('srcid', 'dify_ai');
    this.container.style.cssText = `
      margin-bottom: 14px;
      font-family: Arial, sans-serif;
    `;

    // 创建问答容器
    const qaContainer = document.createElement('div');
    qaContainer.className = 'c-border';
    qaContainer.style.cssText = `
      border: 1px solid #ebebeb;
      border-radius: 12px;
      padding: 20px;
      background: #fff;
    `;

    // 创建头部
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      color: #222;
      margin-right: auto;
      display: flex;
      align-items: center;
    `;
    title.innerHTML = `
      <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTkuMDUyNiA2LjVWMTUuNUwxMiAyMEw0Ljk0NzM3IDE1LjVWNi41TDEyIDJaIiBzdHJva2U9IiM0RjQ2RTUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMiAyTDE5LjA1MjYgNi41TDEyIDExTDQuOTQ3MzcgNi41TDEyIDJaIiBzdHJva2U9IiM0RjQ2RTUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik0xMiAxMVYyMCIgc3Ryb2tlPSIjNEY0NkU1IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K" 
        style="width: 20px; height: 20px; margin-right: 8px;">
      <span>${appName}</span>
    `;

    const closeButton = document.createElement('button');
    closeButton.id = 'dify-search-enhance-close';
    closeButton.style.cssText = `
      padding: 4px;
      background: none;
      border: none;
      cursor: pointer;
      color: #999;
      line-height: 0;
      transition: color 0.2s;
    `;
    closeButton.innerHTML = `
      <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    `;

    header.appendChild(title);
    header.appendChild(closeButton);

    // 创建内容区域
    const content = document.createElement('div');
    content.id = 'dify-search-enhance-content';
    content.style.cssText = `
      font-size: 14px;
      line-height: 1.8;
      color: #333;
      overflow-wrap: break-word;
    `;
    content.innerHTML = '正在分析搜索内容...';

    qaContainer.appendChild(header);
    qaContainer.appendChild(content);
    this.container.appendChild(qaContainer);

    // 添加关闭按钮事件
    closeButton.addEventListener('mouseover', () => {
      closeButton.style.color = '#666';
    });
    closeButton.addEventListener('mouseout', () => {
      closeButton.style.color = '#999';
    });
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.container) {
        this.container.remove();
        this.container = null;
        this.initialized = false;
        this.currentQuery = null;
        this.manuallyClosedTime = Date.now(); // 记录关闭时间
        console.log('[DifyHelper] Container manually closed');
      }
    });

    // 修改容器的插入逻辑
    const targetPosition = document.getElementById('dify-search-enhance-anchor');
    if (targetPosition && targetPosition.parentNode) {
      targetPosition.parentNode.insertBefore(this.container, targetPosition.nextSibling);
    } else {
      const firstResult = leftContent.firstChild;
      if (firstResult) {
        leftContent.insertBefore(this.container, firstResult);
      } else {
        leftContent.appendChild(this.container);
      }
    }
    
    console.log('[DifyHelper] Container created');
    return content;
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('[DifyHelper] Initialization already in progress');
      return;
    }

    if (!this.isMatch() || !this.isEnabled) {
      console.log('[DifyHelper] Initialization conditions not met');
      return;
    }

    const query = this.getSearchQuery();
    if (!query) {
      console.log('[DifyHelper] No search query found');
      return;
    }

    // 检查是否需要重新初始化
    if (this.initialized && !this.shouldReInitialize()) {
      console.log('[DifyHelper] Already initialized with same query');
      return;
    }

    // 设置初始化锁
    this.isInitializing = true;
    console.log('[DifyHelper] Setting initialization lock');

    try {
      // 等待页面加载完成并且DOM稳定
      const waitForStableContent = () => {
        return new Promise((resolve) => {
          const check = () => {
            const leftContent = document.querySelector(this.leftContentSelector);
            if (leftContent) {
              // 检查DOM是否稳定（最后一次变化后500ms内没有新的变化）
              const timeSinceLastChange = Date.now() - this.lastDomChange;
              if (timeSinceLastChange >= 500) {
                resolve(leftContent);
              } else {
                setTimeout(check, 100);
              }
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });
      };

      const leftContent = await waitForStableContent();
      console.log('[DifyHelper] Left content found and stable');

      // 创建一个标记节点，用于跟踪内容位置
      const anchorNode = document.createElement('div');
      anchorNode.id = 'dify-search-enhance-anchor';
      anchorNode.style.display = 'none';
      leftContent.insertBefore(anchorNode, leftContent.firstChild);

      console.log('[DifyHelper] Initializing with query:', query);
      this.initialized = true;
      const content = await this.createContainer();
      if (!content) {
        this.isInitializing = false;
        return;
      }

      let result;
      try {
        // 获取存储的配置
        result = await chrome.storage.sync.get(['apiUrl', 'selectedToken']);
      } catch (error) {
        console.error('[DifyHelper] Error accessing chrome storage:', error);
        // 如果是扩展上下文失效，显示友好的错误信息
        if (error.message.includes('Extension context invalidated')) {
          content.innerHTML = '<span style="color: #f56c6c;">扩展上下文已失效，请刷新页面或重启浏览器</span>';
          return;
        }
        throw error;
      }

      if (!result.apiUrl || !result.selectedToken) {
        content.innerHTML = '<span style="color: #f56c6c;">请先在扩展设置中配置API地址和选择Token</span>';
        return;
      }

      // 发送API请求
      const response = await fetch(`${result.apiUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${result.selectedToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `请解释一下"${query}"是什么意思？请用简洁的语言说明，并列出主要用途。`,
          user: 'extension_user',
          response_mode: 'streaming',
          inputs: {
            text: query
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API请求失败');
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = '';

      // 设置marked选项
      marked.setOptions({
        renderer: new marked.Renderer(),
        gfm: true,
        breaks: true,
        sanitize: false,
        smartLists: true,
        smartypants: false,
        xhtml: false
      });

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.event === 'message') {
                fullAnswer += data.answer;
                const htmlContent = marked.parse(fullAnswer);
                content.innerHTML = `
                  <div style="
                    font-size: 14px;
                    line-height: 1.8;
                    color: #333;
                  ">
                    ${htmlContent}
                  </div>
                  <style>
                    #dify-search-enhance-content h1,
                    #dify-search-enhance-content h2,
                    #dify-search-enhance-content h3,
                    #dify-search-enhance-content h4,
                    #dify-search-enhance-content h5,
                    #dify-search-enhance-content h6 {
                      margin: 16px 0 8px;
                      font-weight: 600;
                      line-height: 1.25;
                      color: #222;
                    }
                    #dify-search-enhance-content h1 { font-size: 18px; }
                    #dify-search-enhance-content h2 { font-size: 16px; }
                    #dify-search-enhance-content h3 { font-size: 14px; }
                    #dify-search-enhance-content p {
                      margin: 8px 0;
                      line-height: 1.8;
                    }
                    #dify-search-enhance-content ul,
                    #dify-search-enhance-content ol {
                      margin: 8px 0;
                      padding-left: 20px;
                    }
                    #dify-search-enhance-content li {
                      margin: 4px 0;
                    }
                    #dify-search-enhance-content code {
                      padding: 2px 4px;
                      font-size: 13px;
                      background: #f5f5f5;
                      border-radius: 3px;
                      font-family: Menlo, Monaco, Consolas, monospace;
                    }
                    #dify-search-enhance-content pre {
                      margin: 12px 0;
                      padding: 12px;
                      background: #f5f5f5;
                      border-radius: 6px;
                      overflow-x: auto;
                    }
                    #dify-search-enhance-content pre code {
                      padding: 0;
                      background: none;
                    }
                    #dify-search-enhance-content blockquote {
                      margin: 8px 0;
                      padding: 0 12px;
                      color: #666;
                      border-left: 4px solid #ddd;
                    }
                    #dify-search-enhance-content a {
                      color: #2440b3;
                      text-decoration: none;
                    }
                    #dify-search-enhance-content a:hover {
                      text-decoration: underline;
                    }
                    #dify-search-enhance-content img {
                      max-width: 100%;
                      height: auto;
                      border-radius: 4px;
                    }
                    #dify-search-enhance-content table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 12px 0;
                    }
                    #dify-search-enhance-content th,
                    #dify-search-enhance-content td {
                      padding: 8px;
                      border: 1px solid #ddd;
                      text-align: left;
                    }
                    #dify-search-enhance-content th {
                      background: #f5f5f5;
                      font-weight: 600;
                    }
                  </style>
                `;
              } else if (data.event === 'error') {
                throw new Error(data.message || 'Stream error');
              }
            } catch (e) {
              console.error('[DifyHelper] Error parsing stream data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('[DifyHelper] Initialization error:', error);
      if (content) {
        content.innerHTML = `<span style="color: #f56c6c;">错误: ${error.message}</span>`;
      }
    } finally {
      this.isInitializing = false;
      console.log('[DifyHelper] Released initialization lock');
    }
  }

  cleanup() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.initialized = false;
    this.currentQuery = null;
    this.isInitializing = false;
    console.log('[DifyHelper] Cleanup completed');
  }

  startContentObserver(enhancer) {
    let pendingUpdate = false;
    let updateTimeout = null;

    const handleContentChange = () => {
      if (pendingUpdate) return;
      pendingUpdate = true;

      // 记录DOM变化时间
      this.lastDomChange = Date.now();

      // 清除之前的超时
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }

      // 设置新的超时，等待DOM稳定后再处理变化
      updateTimeout = setTimeout(async () => {
        try {
          // 确保DOM已经稳定（最后一次变化后500ms）
          if (Date.now() - this.lastDomChange < 500) {
            handleContentChange();
            return;
          }

          const now = Date.now();
          const anchorNode = document.getElementById('dify-search-enhance-anchor');
          const existingContainer = document.getElementById('dify-search-enhance');
          const leftContent = document.querySelector('#content_left');

          if (!leftContent) {
            console.log('[DifyHelper] Left content not found');
            return;
          }

          // 如果内容已经存在且查询未改变，保持现状
          if (existingContainer && !enhancer.shouldReInitialize()) {
            console.log('[DifyHelper] Content exists and query unchanged');
            return;
          }

          // 如果锚点不存在，需要重新初始化
          if (!anchorNode) {
            if (now - this.lastInitTime >= 1000 && now - enhancer.manuallyClosedTime >= 1000) {
              console.log('[DifyHelper] Anchor lost, reinitializing');
              this.lastInitTime = now;
              await enhancer.initialize();
            }
          } 
          // 如果锚点存在但容器不存在，重新创建容器
          else if (!existingContainer) {
            console.log('[DifyHelper] Container lost, recreating');
            const content = await enhancer.createContainer();
            if (content) {
              // 重新发起查询
              const query = enhancer.getSearchQuery();
              if (query) {
                enhancer.currentQuery = query;
                await enhancer.initialize();
              }
            }
          }
        } finally {
          pendingUpdate = false;
        }
      }, 500); // 延迟500ms执行，确保DOM稳定
    };

    // 创建观察器
    const observer = new MutationObserver((mutations) => {
      if (enhancer.isInitializing) return;
      
      // 检查是否有相关的DOM变化
      const hasRelevantChanges = mutations.some(mutation => {
        // 检查变化是否影响了目标区域
        const isInTarget = mutation.target.id === 'content_left' ||
                          mutation.target.closest('#content_left') ||
                          [...mutation.addedNodes].some(node => 
                            node.id === 'content_left' || 
                            (node.nodeType === 1 && node.closest('#content_left'))
                          );
        return isInTarget;
      });

      if (hasRelevantChanges) {
        handleContentChange();
      }
    });

    // 配置观察选项
    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    };

    // 开始观察
    observer.observe(document.body, config);

    // 保存 observer 引用以便后续清理
    this.observer = observer;

    // 立即尝试初始化一次，但要等待DOM稳定
    setTimeout(() => {
      if (document.querySelector('#content_left') && 
          !document.getElementById('dify-search-enhance') && 
          Date.now() - enhancer.manuallyClosedTime >= 1000) {
        enhancer.initialize();
      }
    }, 500);
  }
}

// 搜索引擎增强管理器
class SearchEnhanceManager {
  constructor() {
    this.enhancers = [
      new BaiduEnhancer()
    ];
    this.currentEnhancer = null;
    this.initialized = false;
    this.lastInitTime = 0;
    this.isInitializing = false;
    this.initialize();
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('[DifyHelper] Manager initialization already in progress');
      return;
    }

    if (this.initialized) return;

    // 设置初始化锁
    this.isInitializing = true;
    console.log('[DifyHelper] Setting manager initialization lock');

    try {
      let result;
      try {
        // 获取功能开关状态
        result = await chrome.storage.sync.get(['enableBaiduSearch']);
        console.log('[DifyHelper] Settings:', result);
      } catch (error) {
        console.error('[DifyHelper] Error accessing chrome storage:', error);
        // 如果是扩展上下文失效，显示错误提示
        if (error.message.includes('Extension context invalidated')) {
          // 创建错误提示
          const errorDiv = document.createElement('div');
          errorDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 12px 16px;
            background: #FEF2F2;
            border: 1px solid #FEE2E2;
            border-radius: 8px;
            color: #DC2626;
            font-size: 14px;
            z-index: 2147483647;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          `;
          errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
              <svg style="width: 20px; height: 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div>
                <div style="font-weight: 500; margin-bottom: 4px;">扩展上下文已失效</div>
                <div style="font-size: 12px; color: #EF4444;">请刷新页面或重启浏览器</div>
              </div>
              <button id="dify-error-close" style="
                margin-left: 8px;
                padding: 4px;
                background: none;
                border: none;
                color: #DC2626;
                cursor: pointer;
                line-height: 0;
              ">
                <svg style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          `;
          document.body.appendChild(errorDiv);

          // 添加关闭按钮事件
          const closeButton = errorDiv.querySelector('#dify-error-close');
          closeButton.addEventListener('click', () => {
            errorDiv.remove();
          });

          // 5秒后自动消失
          setTimeout(() => {
            if (errorDiv.parentNode) {
              errorDiv.remove();
            }
          }, 5000);

          return;
        }
        throw error;
      }
      
      if (result.enableBaiduSearch === false) {
        console.log('[DifyHelper] Baidu search enhancement is disabled');
        return;
      }

      // 查找匹配的增强器
      for (const enhancer of this.enhancers) {
        if (enhancer.isMatch()) {
          console.log('[DifyHelper] Found matching enhancer:', enhancer.constructor.name);
          // 检查具体搜索引擎的开关
          if (enhancer instanceof BaiduEnhancer) {
            console.log('[DifyHelper] Initializing Baidu enhancer');
            this.currentEnhancer = enhancer;
            enhancer.isEnabled = true;
            this.initialized = true;
            this.startContentObserver(enhancer);
          }
          break;
        }
      }
    } catch (error) {
      console.error('[DifyHelper] Initialization error:', error);
      // 显示错误提示
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 12px 16px;
        background: #FEF2F2;
        border: 1px solid #FEE2E2;
        border-radius: 8px;
        color: #DC2626;
        font-size: 14px;
        z-index: 2147483647;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      `;
      errorDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg style="width: 20px; height: 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div>
            <div style="font-weight: 500; margin-bottom: 4px;">初始化失败</div>
            <div style="font-size: 12px; color: #EF4444;">${error.message}</div>
          </div>
          <button id="dify-error-close" style="
            margin-left: 8px;
            padding: 4px;
            background: none;
            border: none;
            color: #DC2626;
            cursor: pointer;
            line-height: 0;
          ">
            <svg style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      `;
      document.body.appendChild(errorDiv);

      // 添加关闭按钮事件
      const closeButton = errorDiv.querySelector('#dify-error-close');
      closeButton.addEventListener('click', () => {
        errorDiv.remove();
      });

      // 5秒后自动消失
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
      }, 5000);
    } finally {
      // 确保在所有情况下都释放锁
      this.isInitializing = false;
      console.log('[DifyHelper] Released manager initialization lock');
    }
  }

  startContentObserver(enhancer) {
    let pendingUpdate = false;
    let updateTimeout = null;

    const handleContentChange = () => {
      if (pendingUpdate) return;
      pendingUpdate = true;

      // 记录DOM变化时间
      this.lastDomChange = Date.now();

      // 清除之前的超时
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }

      // 设置新的超时，等待DOM稳定后再处理变化
      updateTimeout = setTimeout(async () => {
        try {
          // 确保DOM已经稳定（最后一次变化后500ms）
          if (Date.now() - this.lastDomChange < 500) {
            handleContentChange();
            return;
          }

          const now = Date.now();
          const anchorNode = document.getElementById('dify-search-enhance-anchor');
          const existingContainer = document.getElementById('dify-search-enhance');
          const leftContent = document.querySelector('#content_left');

          if (!leftContent) {
            console.log('[DifyHelper] Left content not found');
            return;
          }

          // 如果内容已经存在且查询未改变，保持现状
          if (existingContainer && !enhancer.shouldReInitialize()) {
            console.log('[DifyHelper] Content exists and query unchanged');
            return;
          }

          // 如果锚点不存在，需要重新初始化
          if (!anchorNode) {
            if (now - this.lastInitTime >= 1000 && now - enhancer.manuallyClosedTime >= 1000) {
              console.log('[DifyHelper] Anchor lost, reinitializing');
              this.lastInitTime = now;
              await enhancer.initialize();
            }
          } 
          // 如果锚点存在但容器不存在，重新创建容器
          else if (!existingContainer) {
            console.log('[DifyHelper] Container lost, recreating');
            const content = await enhancer.createContainer();
            if (content) {
              // 重新发起查询
              const query = enhancer.getSearchQuery();
              if (query) {
                enhancer.currentQuery = query;
                await enhancer.initialize();
              }
            }
          }
        } finally {
          pendingUpdate = false;
        }
      }, 500); // 延迟500ms执行，确保DOM稳定
    };

    // 创建观察器
    const observer = new MutationObserver((mutations) => {
      if (enhancer.isInitializing) return;
      
      // 检查是否有相关的DOM变化
      const hasRelevantChanges = mutations.some(mutation => {
        // 检查变化是否影响了目标区域
        const isInTarget = mutation.target.id === 'content_left' ||
                          mutation.target.closest('#content_left') ||
                          [...mutation.addedNodes].some(node => 
                            node.id === 'content_left' || 
                            (node.nodeType === 1 && node.closest('#content_left'))
                          );
        return isInTarget;
      });

      if (hasRelevantChanges) {
        handleContentChange();
      }
    });

    // 配置观察选项
    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    };

    // 开始观察
    observer.observe(document.body, config);

    // 保存 observer 引用以便后续清理
    this.observer = observer;

    // 立即尝试初始化一次，但要等待DOM稳定
    setTimeout(() => {
      if (document.querySelector('#content_left') && 
          !document.getElementById('dify-search-enhance') && 
          Date.now() - enhancer.manuallyClosedTime >= 1000) {
        enhancer.initialize();
      }
    }, 500);
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.currentEnhancer) {
      this.currentEnhancer.cleanup();
      this.currentEnhancer = null;
    }
    this.initialized = false;
    this.lastInitTime = 0;
    this.isInitializing = false;
  }

  reinitialize() {
    this.cleanup();
    this.initialize();
  }
}

// 初始化管理器
let searchEnhanceManager = null;

// 确保在页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[DifyHelper] DOMContentLoaded, creating manager');
    searchEnhanceManager = new SearchEnhanceManager();
  });
} else {
  console.log('[DifyHelper] Document already loaded, creating manager');
  searchEnhanceManager = new SearchEnhanceManager();
}

// 监听URL变化
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    console.log('[DifyHelper] URL changed, reinitializing');
    lastUrl = currentUrl;
    if (searchEnhanceManager) {
      searchEnhanceManager.reinitialize();
    }
  }
}).observe(document, { subtree: true, childList: true });

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'settingsChanged' && searchEnhanceManager) {
    console.log('[DifyHelper] Settings changed, reinitializing');
    searchEnhanceManager.reinitialize();
  }
}); 