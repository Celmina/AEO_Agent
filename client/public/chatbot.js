/**
 * MarkSync AI Chatbot Script
 * This script creates an embedded AI chatbot for your website
 */
(function() {
  // Configuration values from the script tag data attributes or defaults
  const scriptTag = document.currentScript;
  const siteId = scriptTag.getAttribute('data-site-id') || scriptTag.getAttribute('id');
  
  if (!siteId) {
    console.error('MarkSync Chatbot: Missing site ID. Please add id="your-site-id" to the script tag.');
    return;
  }

  // Configuration with defaults
  const config = {
    position: scriptTag.getAttribute('data-position') || 'bottom-right',
    primaryColor: scriptTag.getAttribute('data-color') || '#4f46e5',
    title: scriptTag.getAttribute('data-title') || 'Chat with us',
    apiUrl: scriptTag.getAttribute('data-api') || window.location.origin,
    collectEmail: scriptTag.getAttribute('data-collect-email') !== 'false',
  };

  // Create styles
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    .marksync-chatbot-container {
      position: fixed;
      ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .marksync-chatbot-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: ${config.primaryColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: transform 0.3s ease;
    }
    .marksync-chatbot-button:hover {
      transform: scale(1.05);
    }
    .marksync-chatbot-icon {
      width: 30px;
      height: 30px;
    }
    .marksync-chatbot-window {
      position: absolute;
      ${config.position.includes('bottom') ? 'bottom: 70px;' : 'top: 70px;'}
      ${config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
      width: 360px;
      height: 520px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
    }
    .marksync-chatbot-window.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }
    .marksync-chatbot-header {
      padding: 16px;
      background-color: ${config.primaryColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .marksync-chatbot-title {
      font-weight: 600;
      font-size: 16px;
    }
    .marksync-chatbot-close {
      cursor: pointer;
      padding: 4px;
    }
    .marksync-chatbot-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .marksync-message {
      max-width: 75%;
      padding: 12px;
      border-radius: 18px;
      position: relative;
      word-break: break-word;
    }
    .marksync-message.user {
      align-self: flex-end;
      background-color: ${config.primaryColor};
      color: white;
      border-bottom-right-radius: 4px;
    }
    .marksync-message.assistant {
      align-self: flex-start;
      background-color: #f0f0f0;
      border-bottom-left-radius: 4px;
    }
    .marksync-typing {
      display: flex;
      gap: 5px;
      align-items: center;
      padding: 12px;
      background-color: #f0f0f0;
      border-radius: 18px;
      align-self: flex-start;
      max-width: 75%;
    }
    .marksync-dot {
      width: 8px;
      height: 8px;
      background-color: #999;
      border-radius: 50%;
      animation: marksync-bounce 1.5s infinite;
    }
    .marksync-dot:nth-child(2) {
      animation-delay: 0.1s;
    }
    .marksync-dot:nth-child(3) {
      animation-delay: 0.2s;
    }
    @keyframes marksync-bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-6px);
      }
    }
    .marksync-chatbot-input {
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 8px;
    }
    .marksync-chatbot-input input {
      flex: 1;
      padding: 10px 16px;
      border-radius: 20px;
      border: 1px solid #e0e0e0;
      outline: none;
      font-size: 14px;
    }
    .marksync-chatbot-input input:focus {
      border-color: ${config.primaryColor};
    }
    .marksync-send-button {
      background-color: ${config.primaryColor};
      color: white;
      border: none;
      border-radius: 50%;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .marksync-send-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .marksync-email-form {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .marksync-email-form input {
      padding: 10px 16px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      outline: none;
      font-size: 14px;
    }
    .marksync-email-form button {
      background-color: ${config.primaryColor};
      color: white;
      border: none;
      border-radius: 6px;
      padding: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .marksync-email-form p {
      font-size: 14px;
      color: #666;
    }
  `;
  document.head.appendChild(styleEl);

  // Create DOM elements
  const container = document.createElement('div');
  container.className = 'marksync-chatbot-container';

  // Chat button
  const button = document.createElement('div');
  button.className = 'marksync-chatbot-button';
  button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="marksync-chatbot-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`;
  
  // Chat window
  const chatWindow = document.createElement('div');
  chatWindow.className = 'marksync-chatbot-window';
  
  // Chat header
  const header = document.createElement('div');
  header.className = 'marksync-chatbot-header';
  header.innerHTML = `
    <div class="marksync-chatbot-title">${config.title}</div>
    <div class="marksync-chatbot-close">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </div>
  `;
  
  // Messages container
  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'marksync-chatbot-messages';
  
  // Input area
  const inputArea = document.createElement('div');
  inputArea.className = 'marksync-chatbot-input';
  inputArea.innerHTML = `
    <input type="text" placeholder="Type your message..." />
    <button class="marksync-send-button" disabled>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
    </button>
  `;
  
  // Email collection form (shown before chat if collectEmail is true)
  const emailForm = document.createElement('div');
  emailForm.className = 'marksync-email-form';
  emailForm.style.display = config.collectEmail ? 'flex' : 'none';
  emailForm.innerHTML = `
    <p>Please provide your email to start chatting:</p>
    <input type="email" placeholder="Your email address" required />
    <button type="button">Start Chat</button>
  `;
  
  // Assemble the components
  chatWindow.appendChild(header);
  
  if (config.collectEmail) {
    chatWindow.appendChild(emailForm);
  }
  
  chatWindow.appendChild(messagesContainer);
  chatWindow.appendChild(inputArea);
  
  container.appendChild(button);
  container.appendChild(chatWindow);
  document.body.appendChild(container);

  // State variables
  let isOpen = false;
  let sessionId = null;
  let userEmail = null;
  let isTyping = false;
  
  // Helper function to initialize the session
  async function initSession() {
    try {
      const response = await fetch(`${config.apiUrl}/api/public/chatbot?domain=${window.location.hostname}`);
      
      if (!response.ok) {
        throw new Error('Failed to initialize chatbot');
      }
      
      const chatbotConfig = await response.json();
      
      // Update config with server values
      if (chatbotConfig.primaryColor) config.primaryColor = chatbotConfig.primaryColor;
      if (chatbotConfig.position) config.position = chatbotConfig.position;
      if (chatbotConfig.name) config.title = chatbotConfig.name;
      if (chatbotConfig.initialMessage) {
        addMessage(chatbotConfig.initialMessage, 'assistant');
      }
      
      return chatbotConfig.id;
    } catch (error) {
      console.error('MarkSync Chatbot: Error initializing', error);
      addMessage('Sorry, I encountered an error while initializing. Please try again later.', 'assistant');
      return null;
    }
  }
  
  // Helper function to create a chat session
  async function createSession() {
    try {
      const response = await fetch(`${config.apiUrl}/api/public/chat-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatbotId: await initSession(),
          visitorEmail: userEmail,
          visitorId: generateVisitorId()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create chat session');
      }
      
      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('MarkSync Chatbot: Error creating session', error);
      return null;
    }
  }
  
  // Helper function to send a message
  async function sendMessage(message) {
    if (!sessionId) {
      sessionId = await createSession();
      if (!sessionId) return;
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/api/public/chat-sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      return data.message.content;
    } catch (error) {
      console.error('MarkSync Chatbot: Error sending message', error);
      return 'Sorry, I encountered an error. Please try again later.';
    }
  }
  
  // Add a message to the chat
  function addMessage(text, role) {
    const message = document.createElement('div');
    message.className = `marksync-message ${role}`;
    message.textContent = text;
    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Show typing indicator
  function showTyping() {
    if (isTyping) return;
    
    isTyping = true;
    const typing = document.createElement('div');
    typing.className = 'marksync-typing';
    typing.innerHTML = `
      <div class="marksync-dot"></div>
      <div class="marksync-dot"></div>
      <div class="marksync-dot"></div>
    `;
    typing.id = 'marksync-typing-indicator';
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Hide typing indicator
  function hideTyping() {
    isTyping = false;
    const typingIndicator = document.getElementById('marksync-typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }
  
  // Generate a random visitor ID
  function generateVisitorId() {
    return 'visitor_' + Math.random().toString(36).substring(2, 15);
  }
  
  // Event Handlers
  button.addEventListener('click', () => {
    isOpen = !isOpen;
    chatWindow.classList.toggle('open', isOpen);
  });
  
  const closeButton = header.querySelector('.marksync-chatbot-close');
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen = false;
    chatWindow.classList.remove('open');
  });
  
  // Email form submit
  if (config.collectEmail) {
    const emailInput = emailForm.querySelector('input');
    const startButton = emailForm.querySelector('button');
    
    startButton.addEventListener('click', () => {
      if (emailInput.checkValidity()) {
        userEmail = emailInput.value;
        emailForm.style.display = 'none';
        messagesContainer.style.display = 'flex';
        inputArea.style.display = 'flex';
      } else {
        emailInput.reportValidity();
      }
    });
  } else {
    messagesContainer.style.display = 'flex';
    inputArea.style.display = 'flex';
  }
  
  // Message input and send
  const messageInput = inputArea.querySelector('input');
  const sendButton = inputArea.querySelector('button');
  
  messageInput.addEventListener('input', () => {
    sendButton.disabled = !messageInput.value.trim();
  });
  
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim()) {
      handleSendMessage();
    }
  });
  
  sendButton.addEventListener('click', () => {
    if (messageInput.value.trim()) {
      handleSendMessage();
    }
  });
  
  async function handleSendMessage() {
    const message = messageInput.value.trim();
    messageInput.value = '';
    sendButton.disabled = true;
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Show typing indicator
    showTyping();
    
    // Get AI response
    const response = await sendMessage(message);
    
    // Hide typing indicator and show response
    hideTyping();
    addMessage(response, 'assistant');
  }
})();