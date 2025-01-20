// Debug Mode
const DEBUG = true;
function debug(...args) {
  if (DEBUG) {
    console.log('[DifyHelper]', ...args);
  }
}

// 全局变量
let resultContainer = null;
let floatingButton = null;
let selectedText = '';
let questionModal = null;
let controller = null;  // 用于控制流式响应的终止
let lastMouseX = 0;
let lastMouseY = 0;

// 初始化函数
function initialize() {
  debug('Initializing DifyHelper...');
  try {
    // 移除可能已存在的事件监听器
    document.removeEventListener('mouseup', handleTextSelection);
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousemove', handleMouseMove);
    
    // 添加事件监听器
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);
    
    // 清理可能存在的浮动按钮
    hideFloatingButton();
    
    debug('Initialization complete');
  } catch (error) {
    debug('Initialization failed:', error);
  }
}

// 清理函数
function cleanup() {
  debug('Event: Cleanup started');
  hideFloatingButton();
  debug('Event: Cleanup completed');
}

// 处理文本选择
function handleTextSelection(event) {
  try {
    // 如果点击的是浮动按钮或其子元素，不处理
    if (event.target.closest('#dify-helper-button')) {
      return;
    }

    // 延迟执行选中文本的处理，确保在handleClickOutside之后执行
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();

      // 如果没有选中文本，隐藏按钮
      if (!text) {
        hideFloatingButton();
        return;
      }

      // 使用鼠标事件的位置
      const buttonSize = 24;
      const horizontalSpacing = 5;
      const verticalSpacing = 5;

      let x = event.pageX + horizontalSpacing;
      let y = event.pageY - buttonSize - verticalSpacing;

      // 确保按钮在视口内
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 转换pageX/Y到视口相对坐标
      const clientX = event.clientX;
      const clientY = event.clientY;

      if (clientX + buttonSize + horizontalSpacing > viewportWidth) {
        x = event.pageX - buttonSize - horizontalSpacing;
      }

      if (clientY - buttonSize - verticalSpacing < 0) {
        y = event.pageY + verticalSpacing;
      }

      if (clientX + buttonSize > viewportWidth - horizontalSpacing) {
        x = event.pageX - buttonSize - horizontalSpacing;
      }

      if (clientY + buttonSize > viewportHeight - verticalSpacing) {
        y = event.pageY - buttonSize - verticalSpacing;
      }

      selectedText = text;

      if (floatingButton) {
        floatingButton.style.left = `${x}px`;
        floatingButton.style.top = `${y}px`;
      } else {
        showFloatingButton(x, y);
      }
    }, 0);

  } catch (error) {
    debug('Error in handleTextSelection:', error);
  }
}

// 显示浮动按钮
function showFloatingButton(x, y) {
  try {
    hideFloatingButton();

    floatingButton = document.createElement('div');
    floatingButton.id = 'dify-helper-button';
    floatingButton.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      z-index: 2147483647;
      background: white;
      border-radius: 6px;
      width: 24px;
      height: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
      pointer-events: auto;
    `;

    const button = document.createElement('button');
    button.id = 'dify-helper-button-inner';
    button.type = 'button';
    button.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      padding: 0;
      margin: 0;
      background: #4F46E5;
      border-radius: 4px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      pointer-events: auto;
    `;

    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z"/>
      </svg>
    `;

    function handleClick(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const textToShow = selectedText;
      hideFloatingButton();
      showQuestionModal(textToShow);
    }

    function handleMouseOver() {
      button.style.background = '#4338CA';
      floatingButton.style.transform = 'scale(1.05)';
      floatingButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    }

    function handleMouseOut() {
      button.style.background = '#4F46E5';
      floatingButton.style.transform = 'scale(1)';
      floatingButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    }

    button.addEventListener('click', handleClick, { capture: true });
    floatingButton.addEventListener('click', handleClick, { capture: true });
    button.addEventListener('mouseover', handleMouseOver);
    button.addEventListener('mouseout', handleMouseOut);
    floatingButton.addEventListener('mouseover', handleMouseOver);
    floatingButton.addEventListener('mouseout', handleMouseOut);

    floatingButton.appendChild(button);
    document.body.appendChild(floatingButton);
  } catch (error) {
    debug('Error in showFloatingButton:', error);
  }
}

// 隐藏浮动按钮
function hideFloatingButton() {
  if (floatingButton && floatingButton.parentNode) {
    floatingButton.parentNode.removeChild(floatingButton);
    floatingButton = null;
  }
}

// 处理点击外部
function handleClickOutside(event) {
  // 如果点击的是浮动按钮或其子元素，不处理
  if (floatingButton && (floatingButton.contains(event.target) || event.target.closest('#dify-helper-button'))) {
    return;
  }

  // 立即隐藏按钮
  hideFloatingButton();
}

// 监听来自background.js的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'showQuestionModal') {
    showQuestionModal(message.text);
  }
});

// 创建问题模态框
async function showQuestionModal(text) {
  try {
    debug('Event: Showing modal');
    debug('State: Modal text:', text);
    
    // 清理可能存在的旧模态框
    const existingModal = document.querySelector('#dify-helper-modal');
    if (existingModal) {
      debug('State: Removing existing modal');
      existingModal.parentNode.removeChild(existingModal);
    }
    
    let result;
    try {
      // 先获取所有可用的Token和当前选中的Token
      result = await chrome.storage.sync.get(['apiUrl', 'tokens', 'selectedToken']);
    } catch (error) {
      debug('Error accessing chrome storage:', error);
      // 创建一个简单的错误提示模态框
      const errorModal = document.createElement('div');
      errorModal.id = 'dify-helper-modal';
      errorModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
      `;
      
      const errorContent = document.createElement('div');
      errorContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 400px;
        text-align: center;
      `;
      
      errorContent.innerHTML = `
        <h3 style="margin: 0 0 10px; color: #DC2626;">扩展错误</h3>
        <p style="margin: 0 0 15px;">扩展上下文已失效，请尝试以下操作：</p>
        <ol style="text-align: left; margin: 0 0 15px; padding-left: 20px;">
          <li>刷新当前页面</li>
          <li>重新启用扩展</li>
          <li>如果问题持续，请重启浏览器</li>
        </ol>
        <button id="dify-error-close" style="
          padding: 8px 16px;
          background: #4F46E5;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        ">关闭</button>
      `;
      
      errorModal.appendChild(errorContent);
      document.body.appendChild(errorModal);
      
      // 添加关闭按钮事件
      const closeButton = errorContent.querySelector('#dify-error-close');
      closeButton.addEventListener('mouseover', () => {
        closeButton.style.background = '#4338CA';
      });
      closeButton.addEventListener('mouseout', () => {
        closeButton.style.background = '#4F46E5';
      });
      closeButton.addEventListener('click', () => {
        errorModal.remove();
      });
      
      // 点击背景关闭
      errorModal.addEventListener('click', (e) => {
        if (e.target === errorModal) {
          errorModal.remove();
        }
      });
      
      return;
    }

    const tokens = result.tokens || [];
    const currentToken = result.selectedToken;
    const apiUrl = result.apiUrl;

    // 预先获取所有应用的名称
    const appNames = new Map();
    for (const token of tokens) {
      try {
        const response = await fetch(`${apiUrl}/info?user=extension_user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          appNames.set(token, data.name || '未命名应用');
        } else {
          appNames.set(token, '无法获取应用信息');
        }
      } catch (error) {
        appNames.set(token, '获取应用信息失败');
      }
    }

    // 创建一个包含所有样式的容器
    const modalContainer = document.createElement('div');
    modalContainer.id = 'dify-helper-modal';
    modalContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 2147483647;
      pointer-events: auto;
    `;
    debug('State: Created modal container');
    debug('Modal container styles:', modalContainer.style.cssText);

    const modalContent = document.createElement('div');
    modalContent.id = 'dify-helper-modal-content';
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      height: 60%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      position: relative;
      pointer-events: auto;
      overflow: hidden;
    `;
    debug('State: Created modal content');
    debug('Modal content styles:', modalContent.style.cssText);

    modalContent.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        height: 100%;
      ">
        <div style="
          position: relative;
          padding: 16px 20px;
          border-bottom: 1px solid #E5E7EB;
          background: #FFFFFF;
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          ">
            <h3 style="
              margin: 0;
              font-size: 18px;
              font-weight: 600;
              color: #111827;
              line-height: 1.4;
            ">
              提问关于选中内容
            </h3>
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <span style="
                font-size: 13px;
                color: #4B5563;
                font-weight: 500;
              ">当前应用：</span>
              <div style="
                position: relative;
                min-width: 180px;
              ">
                <select id="modelSelect" style="
                  width: 100%;
                  padding: 6px 28px 6px 12px;
                  font-size: 13px;
                  color: #1F2937;
                  border: 1px solid #D1D5DB;
                  border-radius: 6px;
                  background-color: white;
                  appearance: none;
                  cursor: pointer;
                  outline: none;
                  transition: all 0.2s;
                  font-weight: 500;
                ">
                  ${tokens.map(token => {
                    const isSelected = token === currentToken;
                    return `<option value="${token}" ${isSelected ? 'selected' : ''}>${appNames.get(token)}</option>`;
                  }).join('')}
                </select>
                <div style="
                  position: absolute;
                  right: 10px;
                  top: 50%;
                  transform: translateY(-50%);
                  pointer-events: none;
                ">
                  <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div style="
            background: #F9FAFB;
            border-radius: 8px;
            padding: 14px 16px;
            font-size: 14px;
            color: #374151;
            line-height: 1.6;
            max-height: 100px;
            overflow-y: auto;
            border: 1px solid #E5E7EB;
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
            &::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            &::-webkit-scrollbar-track {
              background: transparent;
            }
            &::-webkit-scrollbar-thumb {
              background-color: rgba(156, 163, 175, 0.5);
              border-radius: 3px;
            }
            &::-webkit-scrollbar-thumb:hover {
              background-color: rgba(156, 163, 175, 0.7);
            }
          ">
            ${text}
          </div>
        </div>

        <div id="responseContainer" style="
          flex: 1;
          overflow-y: auto;
          padding: 16px 24px;
          margin: 0;
          border-radius: 0;
          background: #fff;
          position: relative;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          word-wrap: break-word;
          white-space: pre-wrap;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        "></div>

        <div style="
          padding: 16px 20px;
          border-top: 1px solid #E5E7EB;
          background: white;
        ">
          <div style="
            margin-bottom: 12px;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          ">
            <button class="quick-action-btn" data-action="解释" style="
              padding: 6px 12px;
              font-size: 13px;
              color: #4F46E5;
              background: #EEF2FF;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
              font-weight: 500;
            ">解释</button>
            <button class="quick-action-btn" data-action="总结" style="
              padding: 6px 12px;
              font-size: 13px;
              color: #4F46E5;
              background: #EEF2FF;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
              font-weight: 500;
            ">总结</button>
            <button class="quick-action-btn" data-action="翻译" style="
              padding: 6px 12px;
              font-size: 13px;
              color: #4F46E5;
              background: #EEF2FF;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
              font-weight: 500;
            ">翻译</button>
          </div>
          <div style="
            position: relative;
            display: flex;
            align-items: flex-start;
          ">
            <textarea
              id="questionInput" 
              placeholder="输入你的问题，按Enter发送，Shift+Enter换行" 
              style="
                width: 100%;
                padding: 10px 40px 10px 14px;
                border: 1px solid #D1D5DB;
                border-radius: 8px;
                outline: none;
                font-size: 14px;
                line-height: 1.6;
                resize: none;
                min-height: 44px;
                max-height: 120px;
                transition: all 0.2s;
                background: #F9FAFB;
                scrollbar-width: thin;
                scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
                &::-webkit-scrollbar {
                  width: 6px;
                  height: 6px;
                }
                &::-webkit-scrollbar-track {
                  background: transparent;
                }
                &::-webkit-scrollbar-thumb {
                  background-color: rgba(156, 163, 175, 0.5);
                  border-radius: 3px;
                }
                &::-webkit-scrollbar-thumb:hover {
                  background-color: rgba(156, 163, 175, 0.7);
                }
                &:focus {
                  border-color: #4F46E5;
                  background: white;
                  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
                }
              "
            ></textarea>
            <button id="sendButton" style="
              position: absolute;
              right: 10px;
              bottom: 10px;
              padding: 4px;
              background: none;
              border: none;
              color: #4F46E5;
              cursor: pointer;
              transition: all 0.2s;
              line-height: 0;
              border-radius: 4px;
            ">
              <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    modalContainer.appendChild(modalContent);
    debug('Event: Appended modal content to container');
    
    // 先将模态框添加到 DOM
    document.body.appendChild(modalContainer);
    debug('Event: Appended modal container to body');

    // 获取元素引用
    const questionInput = modalContainer.querySelector('#questionInput');
    const sendButton = modalContainer.querySelector('#sendButton');
    const responseContainer = modalContainer.querySelector('#responseContainer');
    debug('State: Got modal element references', {
      hasQuestionInput: !!questionInput,
      hasSendButton: !!sendButton,
      hasResponseContainer: !!responseContainer
    });

    // 确保元素都存在
    if (!questionInput || !sendButton || !responseContainer) {
      throw new Error('Modal elements not found');
    }

    // 添加输入框焦点样式
    questionInput.addEventListener('focus', () => {
      questionInput.style.borderColor = '#4F46E5';
    });

    questionInput.addEventListener('blur', () => {
      questionInput.style.borderColor = '#D1D5DB';
    });

    // 添加按钮悬停效果
    sendButton.addEventListener('mouseover', () => {
      sendButton.style.color = '#4338CA';
    });

    sendButton.addEventListener('mouseout', () => {
      sendButton.style.color = '#4F46E5';
    });

    // 聚焦输入框
    setTimeout(() => {
      questionInput.focus();
      debug('Event: Focused question input');
    }, 100);

    // 修改回车键处理逻辑，支持Shift+Enter换行
    questionInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          // Shift+Enter换行，不做处理
          return;
        }
        e.preventDefault(); // 阻止默认的换行行为
        const question = questionInput.value.trim();
        if (question) {
          debug('Event: Enter key pressed');
          handleSendMessage(text, questionInput, sendButton, responseContainer);
        }
      }
    });

    // 自动调整textarea高度
    questionInput.addEventListener('input', () => {
      questionInput.style.height = 'auto';
      questionInput.style.height = Math.min(questionInput.scrollHeight, 120) + 'px';
    });

    // 点击发送按钮
    sendButton.addEventListener('click', () => {
      debug('Event: Send button clicked');
      handleSendMessage(text, questionInput, sendButton, responseContainer);
    });

    // 点击背景关闭
    modalContainer.addEventListener('click', (e) => {
      debug('Event: Modal container clicked', {
        target: e.target === modalContainer ? 'background' : 'content'
      });
      if (e.target === modalContainer) {
        debug('Event: Modal background clicked');
        closeQuestionModal();
      }
    });

    // 阻止事件冒泡
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // 添加 ESC 键关闭
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        debug('Event: ESC key pressed');
        closeQuestionModal();
      }
    };
    document.addEventListener('keydown', handleEscKey);

    // 存储事件处理函数引用，以便在关闭时移除
    modalContainer._handleEscKey = handleEscKey;

    // 存储模态框引用
    questionModal = modalContainer;

    // 添加模型选择事件监听
    const modelSelect = modalContent.querySelector('#modelSelect');
    if (modelSelect) {
      modelSelect.addEventListener('change', async () => {
        const selectedToken = modelSelect.value;
        await chrome.storage.sync.set({selectedToken});
        // 清除当前对话ID
        currentConversationId = null;
        debug('Model changed, conversation ID cleared');
      });

      // 添加焦点样式
      modelSelect.addEventListener('focus', () => {
        modelSelect.style.borderColor = '#4F46E5';
        modelSelect.style.boxShadow = '0 0 0 1px #4F46E5';
      });

      modelSelect.addEventListener('blur', () => {
        modelSelect.style.borderColor = '#D1D5DB';
        modelSelect.style.boxShadow = 'none';
      });

      // 添加悬停样式
      modelSelect.addEventListener('mouseover', () => {
        if (modelSelect !== document.activeElement) {
          modelSelect.style.borderColor = '#9CA3AF';
        }
      });

      modelSelect.addEventListener('mouseout', () => {
        if (modelSelect !== document.activeElement) {
          modelSelect.style.borderColor = '#D1D5DB';
        }
      });
    }

    // 添加快捷操作按钮的事件监听
    const quickActionButtons = modalContainer.querySelectorAll('.quick-action-btn');
    quickActionButtons.forEach(button => {
      // 添加悬停效果
      button.addEventListener('mouseover', () => {
        button.style.background = '#E0E7FF';
      });

      button.addEventListener('mouseout', () => {
        button.style.background = '#EEF2FF';
      });

      // 添加点击事件
      button.addEventListener('click', () => {
        const action = button.getAttribute('data-action');
        const actionMap = {
          '解释': '请解释以下内容：',
          '总结': '请总结以下内容：',
          '翻译': '请将以下内容翻译成中文，如果已经是中文，则翻译成英文（只输出翻译内容，不要输出其他内容）：'
        };
        
        if (questionInput && sendButton && responseContainer) {
          questionInput.value = actionMap[action] || '';
          handleSendMessage(text, questionInput, sendButton, responseContainer);
        }
      });
    });

    debug('Event: Modal setup complete');
  } catch (error) {
    debug('Error in showQuestionModal:', error);
    console.error('Error in showQuestionModal:', error);
  }
}

function closeQuestionModal() {
  debug('Event: Closing modal');
  const modalContainer = document.querySelector('#dify-helper-modal');
  if (modalContainer && modalContainer.parentNode) {
    debug('State: Removing modal from DOM');
    // 移除 ESC 键监听器
    if (modalContainer._handleEscKey) {
      document.removeEventListener('keydown', modalContainer._handleEscKey);
      debug('State: Removed ESC key handler');
    }
    modalContainer.parentNode.removeChild(modalContainer);
    questionModal = null;
    debug('State: Modal reference cleared');
  }
}

// 显示建议问题
async function updateSuggestions(messageId) {
  const suggestionsContainer = document.getElementById('suggestionsContainer');
  if (!suggestionsContainer) return;

  const result = await chrome.storage.sync.get(['apiUrl', 'selectedToken', 'enableSuggestions']);
  if (!result.enableSuggestions) {
    suggestionsContainer.classList.add('hidden');
    return;
  }

  try {
    if (!messageId) {
      const response = await fetch(`${result.apiUrl}/parameters?user=extension_user`, {
        headers: {
          'Authorization': `Bearer ${result.selectedToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.suggested_questions?.length) {
          showSuggestions(data.suggested_questions);
        } else {
          suggestionsContainer.classList.add('hidden');
        }
      }
    } else {
      const response = await fetch(`${result.apiUrl}/messages/${messageId}/suggested?user=extension_user`, {
        headers: {
          'Authorization': `Bearer ${result.selectedToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.length) {
          showSuggestions(data.data);
        } else {
          suggestionsContainer.classList.add('hidden');
        }
      }
    }
  } catch (error) {
    console.error('获取建议问题失败:', error);
    suggestionsContainer.classList.add('hidden');
  }
}

function showSuggestions(suggestions) {
  const suggestionsContainer = document.getElementById('suggestionsContainer');
  if (!suggestionsContainer) return;

  suggestionsContainer.innerHTML = `
    <div style="font-size: 0.75rem; font-weight: 500; color: #6B7280;">建议问题：</div>
    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
      ${suggestions.map(q => `
        <button style="
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: #F3F4F6;
          color: #374151;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        "
        data-question="${q}"
        >
          ${q}
        </button>
      `).join('')}
    </div>
  `;

  suggestionsContainer.style.display = 'block';

  // 绑定点击事件
  const buttons = suggestionsContainer.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('mouseover', () => {
      button.style.background = '#E5E7EB';
    });

    button.addEventListener('mouseout', () => {
      button.style.background = '#F3F4F6';
    });

    button.addEventListener('click', () => {
      const question = button.getAttribute('data-question');
      if (question) {
        sendMessage(question);
      }
    });
  });
}

// 在模态框内发送消息
async function sendMessageInModal(text, responseContainer, isRegenerate = false) {
  const result = await chrome.storage.sync.get(['apiUrl', 'selectedToken']);
  if (!result.apiUrl || !result.selectedToken) {
    responseContainer.innerHTML = '<span style="color: #DC2626;">错误: 请先配置API地址和选择Token</span>';
    return;
  }

  try {
    // 清空容器
    responseContainer.innerHTML = '';

    // 创建回答容器
    const answerContainer = document.createElement('div');
    answerContainer.style.cssText = `
      position: relative;
      padding-bottom: 2em;
    `;
    responseContainer.appendChild(answerContainer);

    // 显示加载状态
    answerContainer.innerHTML = '正在思考...';

    // 创建工具栏容器
    const toolbarContainer = document.createElement('div');
    toolbarContainer.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      display: flex;
      gap: 8px;
      padding: 4px;
      border-radius: 4px;
      background: #F3F4F6;
      opacity: 0;
      transition: opacity 0.2s;
    `;

    // 创建工具栏按钮
    const buttons = [
      {
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>',
        title: '复制',
        onClick: (text) => {
          navigator.clipboard.writeText(text).then(() => {
            showTooltip(button, '已复制');
          });
        }
      },
      {
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
        title: '重新生成',
        onClick: async () => {
          // 如果正在生成中，先中止当前生成
          if (controller) {
            controller.abort();
            controller = null;
          }
          // 获取模态框中的输入框和发送按钮
          const modal = document.querySelector('#dify-helper-modal');
          if (modal) {
            const questionInput = modal.querySelector('#questionInput');
            const sendButton = modal.querySelector('#sendButton');
            const responseContainer = modal.querySelector('#responseContainer');
            if (questionInput && sendButton && responseContainer) {
              // 设置一个临时的问题文本，这样handleSendMessage就能正常工作
              questionInput.value = '重新生成';
              handleSendMessage(text, questionInput, sendButton, responseContainer);
            }
          }
        }
      }
    ];

    buttons.forEach(({ icon, title, onClick }, index) => {
      const button = document.createElement('button');
      button.style.cssText = `
        padding: 4px;
        color: #6B7280;
        background: none;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      button.innerHTML = icon;
      button.title = title;
      
      button.addEventListener('mouseover', () => {
        button.style.color = '#374151';
        button.style.background = '#E5E7EB';
      });
      
      button.addEventListener('mouseout', () => {
        button.style.color = '#6B7280';
        button.style.background = 'none';
      });
      
      // 修改复制功能的实现
      if (title === '复制') {
        button.addEventListener('click', () => {
          // 创建一个临时容器来获取格式化的HTML内容
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = marked.parse(fullAnswer);
          
          // 创建一个新的 ClipboardItem
          const clipboardItem = new ClipboardItem({
            'text/plain': new Blob([tempDiv.textContent], { type: 'text/plain' }),
            'text/html': new Blob([tempDiv.innerHTML], { type: 'text/html' })
          });
          
          // 使用新的 Clipboard API
          navigator.clipboard.write([clipboardItem])
            .then(() => {
              showTooltip(button, '已复制');
            })
            .catch(err => {
              console.error('复制失败:', err);
              // 降级处理：如果新API不支持，使用传统方式
              navigator.clipboard.writeText(tempDiv.textContent)
                .then(() => {
                  showTooltip(button, '已复制');
                })
                .catch(err => {
                  console.error('复制失败:', err);
                  showTooltip(button, '复制失败');
                });
            });
        });
      } else {
        button.addEventListener('click', () => onClick(answerContainer.textContent));
      }
      
      toolbarContainer.appendChild(button);
    });

    answerContainer.appendChild(toolbarContainer);

    // 添加容器的悬停效果
    answerContainer.addEventListener('mouseover', () => {
      toolbarContainer.style.opacity = '1';
    });

    answerContainer.addEventListener('mouseout', () => {
      toolbarContainer.style.opacity = '0';
    });

    // 创建新的 AbortController
    controller = new AbortController();
    const signal = controller.signal;

    const response = await fetch(`${result.apiUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${result.selectedToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: text,
        user: 'extension_user',
        response_mode: 'streaming',
        inputs: {
          text: text
        }
      }),
      signal  // 添加 signal 到 fetch 请求
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API请求失败');
    }

    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              debug('Received stream data:', data);

              if (data.event === 'message') {
                fullAnswer += data.answer;
                // 在解析前处理换行
                const processedAnswer = fullAnswer.replace(/\n\n+/g, '\n\n');
                answerContainer.innerHTML = marked.parse(processedAnswer);
                // 添加自定义样式
                const styleElement = document.createElement('style');
                styleElement.textContent = `
                  #dify-helper-modal #responseContainer {
                    white-space: normal !important;
                  }
                  #dify-helper-modal #responseContainer p {
                    margin: 0.5em 0;
                    line-height: 1.6;
                    white-space: normal !important;
                  }
                  #dify-helper-modal #responseContainer p + p {
                    margin-top: 0.5em;
                  }
                  #dify-helper-modal #responseContainer br {
                    display: none;
                  }
                  #dify-helper-modal #responseContainer ul,
                  #dify-helper-modal #responseContainer ol {
                    margin: 0.5em 0;
                    padding-left: 1.5em;
                  }
                  #dify-helper-modal #responseContainer li {
                    margin: 0.3em 0;
                  }
                  #dify-helper-modal #responseContainer h1,
                  #dify-helper-modal #responseContainer h2,
                  #dify-helper-modal #responseContainer h3,
                  #dify-helper-modal #responseContainer h4,
                  #dify-helper-modal #responseContainer h5,
                  #dify-helper-modal #responseContainer h6 {
                    margin: 0.8em 0 0.4em;
                  }
                  #dify-helper-modal #responseContainer blockquote {
                    margin: 0.5em 0;
                    padding-left: 1em;
                    border-left: 3px solid #e5e7eb;
                    color: #666;
                  }
                  #dify-helper-modal #responseContainer pre {
                    margin: 0.5em 0;
                  }
                  #dify-helper-modal #responseContainer code {
                    background-color: #f5f5f5;
                    padding: 0.2em 0.4em;
                    border-radius: 3px;
                    font-size: 0.9em;
                  }
                  #dify-helper-modal #responseContainer table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin: 16px 0;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid #e5e7eb;
                  }
                  #dify-helper-modal #responseContainer th,
                  #dify-helper-modal #responseContainer td {
                    padding: 12px 16px;
                    text-align: left;
                    line-height: 1.6;
                  }
                  #dify-helper-modal #responseContainer th {
                    background: #f9fafb;
                    font-weight: 600;
                    color: #374151;
                    font-size: 14px;
                    white-space: nowrap;
                    border-bottom: 2px solid #e5e7eb;
                  }
                  #dify-helper-modal #responseContainer td {
                    background: #ffffff;
                    color: #4b5563;
                    font-size: 14px;
                    border-bottom: 1px solid #e5e7eb;
                  }
                  #dify-helper-modal #responseContainer tr:hover td {
                    background: #f3f4f6;
                  }
                  #dify-helper-modal #responseContainer th:not(:last-child),
                  #dify-helper-modal #responseContainer td:not(:last-child) {
                    border-right: 1px solid #e5e7eb;
                  }
                `;
                answerContainer.appendChild(styleElement);
                answerContainer.appendChild(toolbarContainer);
                // 自动滚动到底部
                responseContainer.scrollTop = responseContainer.scrollHeight;
              } else if (data.event === 'error') {
                throw new Error(data.message || 'Stream error');
              }
            } catch (e) {
              debug('Error parsing stream data:', e);
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        debug('Stream aborted');
        answerContainer.innerHTML = marked.parse(fullAnswer);
        answerContainer.innerHTML += '\n\n[已停止生成]';
        answerContainer.appendChild(toolbarContainer);
      } else {
        throw error;
      }
    } finally {
      controller = null;  // 清除 controller 引用
    }
  } catch (error) {
    responseContainer.innerHTML = `<span style="color: #DC2626;">错误: ${error.message}</span>`;
  }
}

// 显示临时提示
function showTooltip(element, text) {
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    font-size: 12px;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 1000;
  `;
  tooltip.textContent = text;
  
  element.style.position = 'relative';
  element.appendChild(tooltip);
  
  setTimeout(() => {
    tooltip.remove();
  }, 2000);
}

// 确保在页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// 监听页面变化，以支持动态加载的内容
const observer = new MutationObserver((mutations) => {
  // 只有当页面发生重大变化时才重新初始化
  const needsReinitialization = mutations.some(mutation => 
    mutation.addedNodes.length > 0 && 
    Array.from(mutation.addedNodes).some(node => 
      node.nodeType === 1 && 
      (node.tagName === 'BODY' || node.tagName === 'DIV') &&
      !node.id?.startsWith('dify-helper') // 忽略我们自己的元素
    )
  );

  if (needsReinitialization && !document.querySelector('#dify-helper-button')) {
    initialize();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false
});

// 创建结果显示容器
function createResultContainer() {
  try {
    debug('Creating result container');
    if (resultContainer) {
      document.body.removeChild(resultContainer);
    }

    resultContainer = document.createElement('div');
    resultContainer.id = 'dify-helper-result';
    resultContainer.style.cssText = `
      position: fixed;
      bottom: 1.25rem;
      right: 1.25rem;
      width: 90%;
      max-width: 42rem;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      z-index: 2147483646;
      overflow: hidden;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    // 添加头部栏
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: #4F46E5;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    const title = document.createElement('span');
    title.style.cssText = `
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
      user-select: none;
    `;
    title.textContent = 'DifyHelper';
    
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      color: white;
      background: none;
      border: none;
      padding: 4px;
      margin: -4px;
      cursor: pointer;
      transition: color 0.2s;
      line-height: 0;
      border-radius: 4px;
    `;
    closeButton.innerHTML = `
      <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    `;
    
    closeButton.addEventListener('mouseover', () => {
      closeButton.style.color = '#E5E7EB';
      closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
    });

    closeButton.addEventListener('mouseout', () => {
      closeButton.style.color = 'white';
      closeButton.style.background = 'none';
    });
    
    closeButton.addEventListener('click', () => {
      document.body.removeChild(resultContainer);
      resultContainer = null;
    });

    header.appendChild(title);
    header.appendChild(closeButton);
    resultContainer.appendChild(header);

    // 添加内容容器
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 1rem;
      font-size: 0.875rem;
      line-height: 1.5;
      color: #374151;
      max-height: 60vh;
      overflow-y: auto;
      overflow-x: hidden;
      scroll-behavior: smooth;
      
      /* 设置滚动条样式 */
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
      
      &::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      
      &::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }
      
      &::-webkit-scrollbar-thumb:hover {
        background-color: rgba(0, 0, 0, 0.3);
      }

      /* 代码块样式 */
      pre {
        background: #F3F4F6;
        padding: 1rem;
        border-radius: 0.375rem;
        overflow-x: auto;
        margin: 1rem 0;
      }

      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #1F2937;
      }

      /* 链接样式 */
      a {
        color: #4F46E5;
        text-decoration: none;
        transition: color 0.2s;
      }

      a:hover {
        color: #4338CA;
        text-decoration: underline;
      }

      /* 列表样式 */
      ul, ol {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }

      li {
        margin: 0.25rem 0;
      }

      /* 引用样式 */
      blockquote {
        border-left: 4px solid #E5E7EB;
        margin: 1rem 0;
        padding-left: 1rem;
        color: #4B5563;
      }
    `;
    resultContainer.appendChild(content);

    document.body.appendChild(resultContainer);
    debug('Result container created successfully');
    return content;
  } catch (error) {
    debug('Error creating result container:', error);
    return null;
  }
}

// 修改发送按钮点击事件
function handleSendMessage(text, questionInput, sendButton, responseContainer) {
  const question = questionInput.value.trim();
  if (!question) return;

  debug('State: Question:', question);
  
  // 显示响应容器
  responseContainer.style.display = 'block';
  questionInput.value = '';
  questionInput.disabled = true;

  // 更改发送按钮为停止按钮（红色方块）
  sendButton.innerHTML = `
    <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" fill="#DC2626"/>
    </svg>
  `;
  sendButton.title = '停止生成';
  sendButton.style.color = '#DC2626';  // 设置按钮颜色为红色
  
  let isGenerating = true;
  
  const resetButton = () => {
    // 恢复发送按钮状态
    sendButton.innerHTML = `
      <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
      </svg>
    `;
    sendButton.title = '发送';
    sendButton.style.color = '#4F46E5';  // 恢复按钮颜色
    questionInput.disabled = false;
    questionInput.focus();
    isGenerating = false;
  };

  // 修改发送按钮点击事件
  const handleStopGeneration = () => {
    if (isGenerating && controller) {
      controller.abort();
      resetButton();
    }
  };

  // 移除之前的事件监听器
  sendButton.removeEventListener('click', handleStopGeneration);
  // 添加新的事件监听器
  sendButton.addEventListener('click', handleStopGeneration);
  
  // 发送消息
  sendMessageInModal(`关于以下内容：\n${text}\n\n${question}`, responseContainer)
    .finally(() => {
      resetButton();
      // 移除停止生成的事件监听器
      sendButton.removeEventListener('click', handleStopGeneration);
    });
}

// 追踪鼠标位置
function handleMouseMove(event) {
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
}

// 处理快捷键
function handleKeyDown(event) {
  try {
    // 检查是否是Command+A (Mac) 或 Ctrl+A (Windows)
    if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
      // 延迟执行以确保文本已被选中
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text) {
          // 使用最后记录的鼠标位置
          const buttonSize = 24;
          const horizontalSpacing = 5;
          const verticalSpacing = 5;

          // 转换为页面坐标
          const pageX = lastMouseX + window.scrollX;
          const pageY = lastMouseY + window.scrollY;

          selectedText = text;

          if (floatingButton) {
            floatingButton.style.left = `${pageX + horizontalSpacing}px`;
            floatingButton.style.top = `${pageY - buttonSize - verticalSpacing}px`;
          } else {
            showFloatingButton(pageX + horizontalSpacing, pageY - buttonSize - verticalSpacing);
          }
        }
      }, 100);
    }
  } catch (error) {
    debug('Error in handleKeyDown:', error);
  }
}
