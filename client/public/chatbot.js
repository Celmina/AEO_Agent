/**
 * ecom.ai Chatbot Script
 * This script creates an embedded AI chatbot for your website
 */
(function() {
  // Configuration values from the script tag data attributes or defaults
  const scriptTag = document.currentScript;
  const siteId = scriptTag.getAttribute('data-site-id') || scriptTag.getAttribute('id');
  
  if (!siteId) {
    console.error('ecom.ai Chatbot: Missing site ID. Please add id="your-site-id" to the script tag.');
    return;
  }

  // Extract script source for fallback API URL
  const scriptSrc = scriptTag.src || '';
  // Default to source of script if no API URL provided
  const defaultApiUrl = scriptSrc.split('/chatbot.js')[0] || window.location.origin;
  
  // Configuration with defaults
  const config = {
    position: scriptTag.getAttribute('data-position') || 'bottom-right',
    primaryColor: scriptTag.getAttribute('data-color') || '#4f46e5',
    title: scriptTag.getAttribute('data-title') || 'Chat with us',
    apiUrl: scriptTag.getAttribute('data-api') || defaultApiUrl,
    collectEmail: scriptTag.getAttribute('data-collect-email') !== 'false',
  };
  
  // Log to console for debugging
  console.log('ecom.ai Chatbot: Initialized with API URL:', config.apiUrl);

  // Create styles
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    .ecomai-chatbot-container {
      position: fixed;
      ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .ecomai-chatbot-button {
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
    .ecomai-chatbot-button:hover {
      transform: scale(1.05);
    }
    .ecomai-chatbot-icon {
      width: 30px;
      height: 30px;
    }
    .ecomai-chatbot-window {
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
    .ecomai-chatbot-window.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }
    .ecomai-chatbot-header {
      padding: 16px;
      background-color: ${config.primaryColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .ecomai-chatbot-title {
      font-weight: 600;
      font-size: 16px;
    }
    .ecomai-chatbot-close {
      cursor: pointer;
      padding: 4px;
    }
    .ecomai-chatbot-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ecomai-message {
      max-width: 75%;
      padding: 12px;
      border-radius: 18px;
      position: relative;
      word-break: break-word;
    }
    .ecomai-message.user {
      align-self: flex-end;
      background-color: ${config.primaryColor};
      color: white;
      border-bottom-right-radius: 4px;
    }
    .ecomai-message.assistant {
      align-self: flex-start;
      background-color: #f0f0f0;
      border-bottom-left-radius: 4px;
    }
    .ecomai-typing {
      display: flex;
      gap: 5px;
      align-items: center;
      padding: 12px;
      background-color: #f0f0f0;
      border-radius: 18px;
      align-self: flex-start;
      max-width: 75%;
    }
    .ecomai-dot {
      width: 8px;
      height: 8px;
      background-color: #999;
      border-radius: 50%;
      animation: ecomai-bounce 1.5s infinite;
    }
    .ecomai-dot:nth-child(2) {
      animation-delay: 0.1s;
    }
    .ecomai-dot:nth-child(3) {
      animation-delay: 0.2s;
    }
    @keyframes ecomai-bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-6px);
      }
    }
    .ecomai-chatbot-input {
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 8px;
    }
    .ecomai-chatbot-input input {
      flex: 1;
      padding: 10px 16px;
      border-radius: 20px;
      border: 1px solid #e0e0e0;
      outline: none;
      font-size: 14px;
    }
    .ecomai-chatbot-input input:focus {
      border-color: ${config.primaryColor};
    }
    .ecomai-send-button {
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
    .ecomai-send-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .ecomai-email-form {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .ecomai-email-form input {
      padding: 10px 16px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      outline: none;
      font-size: 14px;
    }
    .ecomai-email-form button {
      background-color: ${config.primaryColor};
      color: white;
      border: none;
      border-radius: 6px;
      padding: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .ecomai-email-form p {
      font-size: 14px;
      color: #666;
    }
  `;
  document.head.appendChild(styleEl);

  // Create DOM elements
  const container = document.createElement('div');
  container.className = 'ecomai-chatbot-container';

  // Chat button
  const button = document.createElement('div');
  button.className = 'ecomai-chatbot-button';
  button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="ecomai-chatbot-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`;
  
  // Chat window
  const chatWindow = document.createElement('div');
  chatWindow.className = 'ecomai-chatbot-window';
  
  // Chat header
  const header = document.createElement('div');
  header.className = 'ecomai-chatbot-header';
  header.innerHTML = `
    <div class="ecomai-chatbot-title">${config.title}</div>
    <div class="ecomai-chatbot-close">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </div>
  `;
  
  // Messages container
  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'ecomai-chatbot-messages';
  
  // Input area
  const inputArea = document.createElement('div');
  inputArea.className = 'ecomai-chatbot-input';
  inputArea.innerHTML = `
    <input type="text" placeholder="Type your message..." />
    <button class="ecomai-send-button" disabled>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
    </button>
  `;
  
  // Email collection form (shown before chat if collectEmail is true)
  const emailForm = document.createElement('div');
  emailForm.className = 'ecomai-email-form';
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
      // Extract the domain for API lookup - remove protocol and paths
      const hostname = window.location.hostname;
      console.log('ecom.ai Chatbot: Initializing for domain', hostname);
      
      // Check if we're running locally, use a simplified hostname in that case
      const isDevelopment = hostname === 'localhost' || hostname.includes('127.0.0.1');
      const domainForLookup = isDevelopment ? hostname : hostname.replace(/^www\./, '');
      
      // Add debug logs to show the full URL being requested and API configuration
      console.log('ecom.ai Chatbot: API URL is configured as', config.apiUrl);
      console.log('ecom.ai Chatbot: Script URL is', scriptTag.src);
      
      const requestUrl = `${config.apiUrl}/api/public/chatbot?domain=${encodeURIComponent(domainForLookup)}&siteId=${encodeURIComponent(siteId)}`;
      console.log('ecom.ai Chatbot: Requesting config from', requestUrl);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('ecom.ai Chatbot: Server returned status', response.status);
        const errorText = await response.text();
        console.error('ecom.ai Chatbot: Error response:', errorText);
        throw new Error(`Failed to initialize chatbot: ${response.status}`);
      }
      
      let chatbotConfig;
      try {
        chatbotConfig = await response.json();
      } catch (jsonError) {
        console.error('ecom.ai Chatbot: Error parsing JSON response', jsonError);
        throw new Error('Invalid response format from server');
      }
      
      console.log('ecom.ai Chatbot: Received config', chatbotConfig);
      
      if (!chatbotConfig || !chatbotConfig.id) {
        console.error('ecom.ai Chatbot: Invalid or missing chatbot configuration');
        throw new Error('Invalid chatbot configuration received');
      }
      
      // Update config with server values
      if (chatbotConfig.primaryColor) config.primaryColor = chatbotConfig.primaryColor;
      if (chatbotConfig.position) config.position = chatbotConfig.position;
      if (chatbotConfig.name) config.title = chatbotConfig.name;
      if (chatbotConfig.collectEmail !== undefined) config.collectEmail = chatbotConfig.collectEmail;
      
      // Update UI elements with new configuration
      updateChatbotStyles();
      
      if (chatbotConfig.initialMessage) {
        addMessage(chatbotConfig.initialMessage, 'assistant');
      }
      
      return chatbotConfig.id;
    } catch (error) {
      console.error('ecom.ai Chatbot: Error initializing', error);
      console.log('ecom.ai Chatbot: Error details:', error.message, error.stack);
      console.log('ecom.ai Chatbot: Attempted API URL:', config.apiUrl);
      addMessage('Sorry, I encountered an error while initializing. Please try again later or contact the website owner.', 'assistant');
      return null;
    }
  }
  
  // Updates the chatbot UI with current configuration
  function updateChatbotStyles() {
    // Update button color
    const button = document.querySelector('.ecomai-chatbot-button');
    if (button) button.style.backgroundColor = config.primaryColor;
    
    // Update header color
    const header = document.querySelector('.ecomai-chatbot-header');
    if (header) header.style.backgroundColor = config.primaryColor;
    
    // Update send button color
    const sendButton = document.querySelector('.ecomai-send-button');
    if (sendButton) sendButton.style.backgroundColor = config.primaryColor;
    
    // Update user message bubble color
    const style = document.createElement('style');
    style.textContent = `
      .ecomai-message.user { background-color: ${config.primaryColor}; }
      .ecomai-chatbot-input input:focus { border-color: ${config.primaryColor}; }
      .ecomai-email-form button { background-color: ${config.primaryColor}; }
    `;
    document.head.appendChild(style);
    
    // Update position
    const container = document.querySelector('.ecomai-chatbot-container');
    if (container) {
      container.style.top = config.position.includes('top') ? '20px' : 'auto';
      container.style.bottom = config.position.includes('bottom') ? '20px' : 'auto';
      container.style.left = config.position.includes('left') ? '20px' : 'auto';
      container.style.right = config.position.includes('right') ? '20px' : 'auto';
    }
    
    // Update title
    const title = document.querySelector('.ecomai-chatbot-title');
    if (title) title.textContent = config.title;
    
    // Update email collection visibility
    const emailForm = document.querySelector('.ecomai-email-form');
    const messagesContainer = document.querySelector('.ecomai-chatbot-messages');
    const inputArea = document.querySelector('.ecomai-chatbot-input');
    
    if (emailForm && messagesContainer && inputArea) {
      if (config.collectEmail) {
        emailForm.style.display = 'flex';
        messagesContainer.style.display = 'none';
        inputArea.style.display = 'none';
      } else {
        emailForm.style.display = 'none';
        messagesContainer.style.display = 'flex';
        inputArea.style.display = 'flex';
      }
    }
  }
  
  // Helper function to create a chat session
  async function createSession() {
    try {
      const chatbotId = await initSession();
      if (!chatbotId) {
        console.error('ecom.ai Chatbot: Failed to get chatbot ID');
        return null;
      }
      
      const visitorId = generateVisitorId();
      console.log('ecom.ai Chatbot: Creating new session for chatbot', chatbotId, 'visitor', visitorId);
      
      const response = await fetch(`${config.apiUrl}/api/public/chat-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          chatbotId: chatbotId,
          visitorEmail: userEmail,
          visitorId: visitorId,
          url: window.location.href // Include current page URL for context
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ecom.ai Chatbot: Server returned status', response.status, errorText);
        throw new Error(`Failed to create chat session: ${response.status}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('ecom.ai Chatbot: Error parsing session JSON', jsonError);
        throw new Error('Invalid session response format');
      }
      
      if (!data || !data.id) {
        console.error('ecom.ai Chatbot: Invalid session data', data);
        throw new Error('Invalid session data received');
      }
      
      console.log('ecom.ai Chatbot: Created session', data.id);
      return data.id;
    } catch (error) {
      console.error('ecom.ai Chatbot: Error creating session', error);
      addMessage('Sorry, I encountered an error while starting the chat. Please try refreshing the page.', 'assistant');
      return null;
    }
  }
  
  // Helper function to send a message
  async function sendMessage(message) {
    // Create a session if needed
    if (!sessionId) {
      console.log('ecom.ai Chatbot: No session found, creating one...');
      sessionId = await createSession();
      if (!sessionId) {
        console.error('ecom.ai Chatbot: Failed to create a session');
        return 'Sorry, I encountered an error connecting to the chat service. Please try again later.';
      }
    }
    
    console.log('ecom.ai Chatbot: Sending message to session', sessionId);
    
    try {
      const response = await fetch(`${config.apiUrl}/api/public/chat-sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          message: message,
          url: window.location.href // Include current page URL for context
        }),
      });
      
      if (!response.ok) {
        // If session expired, try to recreate it and retry
        if (response.status === 404) {
          console.log('ecom.ai Chatbot: Session may have expired, recreating...');
          sessionId = await createSession();
          if (sessionId) {
            // Retry with new session
            return sendMessage(message);
          }
        }
        
        const errorText = await response.text();
        console.error('ecom.ai Chatbot: Message error', response.status, errorText);
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('ecom.ai Chatbot: Error parsing message response JSON', jsonError);
        throw new Error('Invalid message response format');
      }
      
      if (!data || !data.message || data.message.content === undefined) {
        console.error('ecom.ai Chatbot: Invalid message response data', data);
        throw new Error('Invalid message response data');
      }
      
      return data.message.content;
    } catch (error) {
      console.error('ecom.ai Chatbot: Error sending message', error);
      return 'Sorry, I encountered an error processing your message. Please try again later.';
    }
  }
  
  // Add a message to the chat
  function addMessage(text, role) {
    const message = document.createElement('div');
    message.className = `ecomai-message ${role}`;
    message.textContent = text;
    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Show typing indicator
  function showTyping() {
    if (isTyping) return;
    
    isTyping = true;
    const typing = document.createElement('div');
    typing.className = 'ecomai-typing';
    typing.innerHTML = `
      <div class="ecomai-dot"></div>
      <div class="ecomai-dot"></div>
      <div class="ecomai-dot"></div>
    `;
    typing.id = 'ecomai-typing-indicator';
    messagesContainer.appendChild(typing);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Hide typing indicator
  function hideTyping() {
    isTyping = false;
    const typingIndicator = document.getElementById('ecomai-typing-indicator');
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
  
  const closeButton = header.querySelector('.ecomai-chatbot-close');
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