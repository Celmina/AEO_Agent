/**
 * ecom.ai Chatbot Script (Version 2)
 * This script creates an embedded AI chatbot for your website
 * With enhanced error handling and CORS support
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
  const defaultApiUrl = scriptSrc.split('/chatbot-v2.js')[0] || window.location.origin;
  
  // Configuration with defaults
  const config = {
    position: scriptTag.getAttribute('data-position') || 'bottom-right',
    primaryColor: scriptTag.getAttribute('data-color') || '#4f46e5',
    title: scriptTag.getAttribute('data-title') || 'Chat with us',
    apiUrl: scriptTag.getAttribute('data-api') || defaultApiUrl,
    collectEmail: scriptTag.getAttribute('data-collect-email') !== 'false',
    fallbackMode: false
  };
  
  // Log to console for debugging
  console.log('ecom.ai Chatbot v2: Initialized with API URL:', config.apiUrl);

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
      max-width: 80%;
      padding: 12px;
      border-radius: 12px;
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
      background-color: #f1f5f9;
      color: #334155;
      border-bottom-left-radius: 4px;
    }
    .ecomai-message.typing {
      background-color: #f1f5f9;
      color: #334155;
      display: flex;
      align-items: center;
      padding: 12px 16px;
    }
    .ecomai-typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .ecomai-typing-indicator span {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #8796ab;
      display: inline-block;
      animation: bounceDot 1.4s infinite ease-in-out both;
    }
    .ecomai-typing-indicator span:nth-child(1) {
      animation-delay: -0.32s;
    }
    .ecomai-typing-indicator span:nth-child(2) {
      animation-delay: -0.16s;
    }
    @keyframes bounceDot {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
    .ecomai-chatbot-input {
      padding: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      position: relative;
    }
    .ecomai-chatbot-input input {
      flex: 1;
      padding: 10px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
    }
    .ecomai-chatbot-input input:focus {
      border-color: ${config.primaryColor};
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }
    .ecomai-chatbot-send {
      width: 40px;
      height: 40px;
      background-color: ${config.primaryColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-left: 8px;
      cursor: pointer;
    }
    .ecomai-email-form {
      padding: 16px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ecomai-email-form input {
      padding: 10px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    .ecomai-email-form button {
      background-color: ${config.primaryColor};
      color: white;
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    /* Responsive adjustments for mobile */
    @media (max-width: 480px) {
      .ecomai-chatbot-window {
        width: 90vw;
        height: 70vh;
        ${config.position.includes('right') ? 'right: 5vw;' : 'left: 5vw;'}
      }
    }
  `;
  document.head.appendChild(styleEl);

  // Create DOM elements
  const container = document.createElement('div');
  container.className = 'ecomai-chatbot-container';

  const button = document.createElement('div');
  button.className = 'ecomai-chatbot-button';
  button.innerHTML = '<svg class="ecomai-chatbot-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z" stroke="currentColor" stroke-width="1.5"/><path d="M8 10.5H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 13.5H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  const chatWindow = document.createElement('div');
  chatWindow.className = 'ecomai-chatbot-window';

  const header = document.createElement('div');
  header.className = 'ecomai-chatbot-header';
  header.innerHTML = `
    <div class="ecomai-chatbot-title">${config.title}</div>
    <div class="ecomai-chatbot-close">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  `;

  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'ecomai-chatbot-messages';

  const inputArea = document.createElement('div');
  inputArea.className = 'ecomai-chatbot-input';
  inputArea.innerHTML = `
    <input type="text" placeholder="Type your message..." />
    <div class="ecomai-chatbot-send">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  `;

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
  let chatbotId = null;
  
  // Helper function to safely handle fetch requests with error fallbacks
  async function safeFetch(url, options = {}) {
    try {
      // Set a reasonable timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      console.error(`ecom.ai Chatbot v2: Fetch error for ${url}:`, error);
      // Return a mock response that will trigger fallback behavior
      return {
        ok: false,
        status: error.name === 'AbortError' ? 408 : 500,
        statusText: error.name === 'AbortError' ? 'Request Timeout' : 'Network Error',
        text: async () => error.message,
        json: async () => ({ error: error.message })
      };
    }
  }
  
  // Helper function to initialize the session
  async function initSession() {
    try {
      // Extract the domain for API lookup - remove protocol and paths
      const hostname = window.location.hostname;
      console.log('ecom.ai Chatbot v2: Initializing for domain', hostname);
      
      // Check if we're running locally, use a simplified hostname in that case
      const isDevelopment = hostname === 'localhost' || hostname.includes('127.0.0.1');
      const domainForLookup = isDevelopment ? hostname : hostname.replace(/^www\./, '');
      
      // Add debug logs to show the full URL being requested and API configuration
      console.log('ecom.ai Chatbot v2: API URL is configured as', config.apiUrl);
      console.log('ecom.ai Chatbot v2: Script URL is', scriptTag.src);
      
      const requestUrl = `${config.apiUrl}/api/public/chatbot?domain=${encodeURIComponent(domainForLookup)}&siteId=${encodeURIComponent(siteId)}`;
      console.log('ecom.ai Chatbot v2: Requesting config from', requestUrl);
      
      const response = await safeFetch(requestUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('ecom.ai Chatbot v2: Server returned status', response.status);
        const errorText = await response.text();
        console.error('ecom.ai Chatbot v2: Error response:', errorText);
        
        // Activate fallback mode
        config.fallbackMode = true;
        
        // Return a mock chatbot configuration for fallback mode
        console.log('ecom.ai Chatbot v2: Using fallback configuration');
        return {
          id: `fallback-${siteId}`,
          name: config.title,
          primaryColor: config.primaryColor,
          position: config.position,
          initialMessage: 'I\'m currently running in offline mode. I can respond to basic questions but won\'t be able to save your conversation history.',
          collectEmail: false,
          websiteDomain: domainForLookup
        };
      }
      
      let chatbotConfig;
      try {
        chatbotConfig = await response.json();
      } catch (jsonError) {
        console.error('ecom.ai Chatbot v2: Error parsing JSON response', jsonError);
        config.fallbackMode = true;
        return {
          id: `fallback-${siteId}`,
          name: config.title,
          primaryColor: config.primaryColor,
          position: config.position,
          initialMessage: 'I\'m currently running in offline mode due to a server issue. Your messages won\'t be saved.',
          collectEmail: false,
          websiteDomain: domainForLookup
        };
      }
      
      console.log('ecom.ai Chatbot v2: Received config', chatbotConfig);
      
      if (!chatbotConfig || !chatbotConfig.id) {
        console.error('ecom.ai Chatbot v2: Invalid or missing chatbot configuration');
        config.fallbackMode = true;
        return {
          id: `fallback-${siteId}`,
          name: config.title,
          primaryColor: config.primaryColor,
          position: config.position,
          initialMessage: 'I\'m currently running in offline mode due to missing configuration. Your messages won\'t be saved.',
          collectEmail: false, 
          websiteDomain: domainForLookup
        };
      }
      
      // Update config with server values
      if (chatbotConfig.primaryColor) config.primaryColor = chatbotConfig.primaryColor;
      if (chatbotConfig.position) config.position = chatbotConfig.position;
      if (chatbotConfig.name) config.title = chatbotConfig.name;
      if (chatbotConfig.collectEmail !== undefined) config.collectEmail = chatbotConfig.collectEmail;
      
      // Update UI elements with new configuration
      updateChatbotStyles();
      
      return chatbotConfig;
    } catch (error) {
      console.error('ecom.ai Chatbot v2: Error initializing', error);
      console.log('ecom.ai Chatbot v2: Error details:', error.message, error.stack);
      console.log('ecom.ai Chatbot v2: Attempted API URL:', config.apiUrl);
      
      // Enter fallback mode
      config.fallbackMode = true;
      addMessage('Sorry, I\'m currently running in offline mode. Your messages won\'t be saved.', 'assistant');
      
      return {
        id: `fallback-${siteId}`,
        name: config.title,
        primaryColor: config.primaryColor,
        position: config.position,
        initialMessage: null,
        collectEmail: false
      };
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
    
    // Update user message color
    const style = document.createElement('style');
    style.textContent = `
      .ecomai-message.user {
        background-color: ${config.primaryColor};
      }
      .ecomai-chatbot-input input:focus {
        border-color: ${config.primaryColor};
        box-shadow: 0 0 0 2px ${config.primaryColor.replace(')', ', 0.2)')};
      }
      .ecomai-chatbot-send, .ecomai-email-form button {
        background-color: ${config.primaryColor};
      }
    `;
    document.head.appendChild(style);
    
    // Update title
    const title = document.querySelector('.ecomai-chatbot-title');
    if (title) title.textContent = config.title;
    
    // Update email form visibility
    const emailForm = document.querySelector('.ecomai-email-form');
    if (emailForm) {
      emailForm.style.display = config.collectEmail ? 'flex' : 'none';
    }
    
    // Update position
    const container = document.querySelector('.ecomai-chatbot-container');
    if (container) {
      container.style.bottom = config.position.includes('bottom') ? '20px' : 'auto';
      container.style.top = config.position.includes('bottom') ? 'auto' : '20px';
      container.style.right = config.position.includes('right') ? '20px' : 'auto';
      container.style.left = config.position.includes('right') ? 'auto' : '20px';
    }
    
    const chatWindow = document.querySelector('.ecomai-chatbot-window');
    if (chatWindow) {
      chatWindow.style.bottom = config.position.includes('bottom') ? '70px' : 'auto';
      chatWindow.style.top = config.position.includes('bottom') ? 'auto' : '70px';
      chatWindow.style.right = config.position.includes('right') ? '0' : 'auto';
      chatWindow.style.left = config.position.includes('right') ? 'auto' : '0';
    }
  }
  
  // Create a new chat session with the server
  async function createSession() {
    try {
      console.log('ecom.ai Chatbot v2: Creating new session');
      
      if (!chatbotId) {
        console.error('ecom.ai Chatbot v2: Failed to get chatbot ID');
        throw new Error('Chatbot ID is required');
      }
      
      // Handle fallback mode - create a client-side only session
      if (config.fallbackMode) {
        console.log('ecom.ai Chatbot v2: Using fallback session (offline mode)');
        return `fallback-${Date.now()}`;
      }
      
      const visitorId = generateVisitorId();
      const requestUrl = `${config.apiUrl}/api/public/chat-sessions`;
      
      console.log('ecom.ai Chatbot v2: Sending session creation request to:', requestUrl);
      
      try {
        const response = await safeFetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            chatbotId, 
            visitorId,
            visitorEmail: userEmail || null,
            url: window.location.href
          })
        });
        
        if (!response.ok) {
          console.error('ecom.ai Chatbot v2: Failed to create session', response.status);
          const errorText = await response.text();
          console.error('ecom.ai Chatbot v2: Server error response:', errorText);
          
          // Switch to fallback mode
          config.fallbackMode = true;
          
          // Create a mock session ID
          const mockSessionId = `fallback-${Date.now()}`;
          console.log('ecom.ai Chatbot v2: Created fallback session:', mockSessionId);
          addMessage("I'm using a temporary session as the server is unreachable. Your messages won't be saved.", 'assistant');
          return mockSessionId;
        }
        
        try {
          const sessionData = await response.json();
          console.log('ecom.ai Chatbot v2: Session created', sessionData);
          
          // If there's an initial message from the assistant
          if (sessionData.message) {
            addMessage(sessionData.message.content, 'assistant');
          }
          
          return sessionData.id;
        } catch (jsonError) {
          console.error('ecom.ai Chatbot v2: Error parsing session creation response', jsonError);
          config.fallbackMode = true;
          const mockSessionId = `fallback-${Date.now()}`;
          addMessage("I'm having trouble connecting to the chat service. Your messages won't be saved.", 'assistant');
          return mockSessionId;
        }
      } catch (fetchError) {
        console.error('ecom.ai Chatbot v2: Fetch error during session creation:', fetchError);
        
        // Switch to fallback mode
        config.fallbackMode = true;
        
        // Create a mock session for development
        const mockSessionId = `fallback-${Date.now()}`;
        console.log('ecom.ai Chatbot v2: Created development fallback session:', mockSessionId);
        addMessage("I'm using a temporary session as the server is unreachable. Your messages won't be saved.", 'assistant');
        return mockSessionId;
      }
    } catch (error) {
      console.error('ecom.ai Chatbot v2: Failed to create a session', error);
      console.log('ecom.ai Chatbot v2: Error details:', error.message, error.stack);
      
      // Switch to fallback mode
      config.fallbackMode = true;
      
      addMessage('Sorry, I encountered an error connecting to the chat service. Your messages won\'t be saved.', 'assistant');
      return `fallback-${Date.now()}`;
    }
  }
  
  // Send a message to the server and get a response
  async function sendMessage(message) {
    try {
      // Add the user message to the UI
      addMessage(message, 'user');
      
      // Show typing indicator
      showTyping();
      
      // If we're in fallback mode, generate a simple response locally
      if (config.fallbackMode) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simple fallback responses
        let response = "I'm sorry, I'm currently in offline mode and can't access the full AI capabilities. Please try again later.";
        
        // Very basic response patterns for common questions in fallback mode
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi ')) {
          response = "Hello! I'm currently in offline mode, but I'm happy to try to help with basic information.";
        } else if (lowerMessage.includes('help')) {
          response = "I'd like to help, but I'm currently in offline mode with limited capabilities. Please try again later when I'm fully connected.";
        } else if (lowerMessage.includes('thank')) {
          response = "You're welcome! I'm happy to help, even though I'm currently in offline mode.";
        }
        
        hideTyping();
        addMessage(response, 'assistant');
        return;
      }
      
      // Ensure we have an active session
      if (!sessionId) {
        sessionId = await createSession();
        
        if (!sessionId) {
          hideTyping();
          addMessage('Unable to start a chat session. Please try again later.', 'assistant');
          return;
        }
      }
      
      const requestUrl = `${config.apiUrl}/api/public/chat-sessions/${sessionId}/messages`;
      console.log('ecom.ai Chatbot v2: Sending message to:', requestUrl);
      
      try {
        const response = await safeFetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
          console.error('ecom.ai Chatbot v2: Failed to send message', response.status);
          const errorText = await response.text();
          console.error('ecom.ai Chatbot v2: Server error response:', errorText);
          
          // Switch to fallback mode
          config.fallbackMode = true;
          
          hideTyping();
          addMessage('Sorry, I encountered an error communicating with the server. I\'ll switch to offline mode for now.', 'assistant');
          return;
        }
        
        try {
          const responseData = await response.json();
          console.log('ecom.ai Chatbot v2: Received message response', responseData);
          
          hideTyping();
          
          // Add the assistant's response to the UI
          if (responseData.content) {
            addMessage(responseData.content, 'assistant');
          } else {
            addMessage('Sorry, I didn\'t understand that. Could you try asking in a different way?', 'assistant');
          }
        } catch (jsonError) {
          console.error('ecom.ai Chatbot v2: Error parsing message response', jsonError);
          
          // Switch to fallback mode
          config.fallbackMode = true;
          
          hideTyping();
          addMessage('Sorry, I encountered an error processing the response. I\'ll switch to offline mode for now.', 'assistant');
        }
      } catch (fetchError) {
        console.error('ecom.ai Chatbot v2: Fetch error during message sending:', fetchError);
        
        // Switch to fallback mode
        config.fallbackMode = true;
        
        hideTyping();
        addMessage('Sorry, I couldn\'t reach the server. I\'ll switch to offline mode for now.', 'assistant');
      }
    } catch (error) {
      console.error('ecom.ai Chatbot v2: Error sending message', error);
      console.log('ecom.ai Chatbot v2: Error details:', error.message, error.stack);
      
      // Switch to fallback mode
      config.fallbackMode = true;
      
      hideTyping();
      addMessage('Sorry, something went wrong. I\'ll switch to offline mode for now.', 'assistant');
    }
  }
  
  // Add a message to the chat UI
  function addMessage(text, role) {
    const messagesContainer = document.querySelector('.ecomai-chatbot-messages');
    if (!messagesContainer) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = `ecomai-message ${role}`;
    messageEl.textContent = text;
    
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Show typing indicator
  function showTyping() {
    if (isTyping) return;
    isTyping = true;
    
    const messagesContainer = document.querySelector('.ecomai-chatbot-messages');
    if (!messagesContainer) return;
    
    const typingEl = document.createElement('div');
    typingEl.className = 'ecomai-message assistant typing';
    typingEl.innerHTML = `
      <div class="ecomai-typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    typingEl.id = 'ecomai-typing-indicator';
    
    messagesContainer.appendChild(typingEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Hide typing indicator
  function hideTyping() {
    isTyping = false;
    
    const typingEl = document.getElementById('ecomai-typing-indicator');
    if (typingEl) {
      typingEl.remove();
    }
  }
  
  // Generate a unique visitor ID or retrieve from localStorage
  function generateVisitorId() {
    const storageKey = 'ecomai-visitor-id';
    let visitorId = localStorage.getItem(storageKey);
    
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem(storageKey, visitorId);
    }
    
    return visitorId;
  }
  
  // Handle sending a message when the user clicks the send button or presses Enter
  async function handleSendMessage() {
    const inputEl = document.querySelector('.ecomai-chatbot-input input');
    if (!inputEl) return;
    
    const message = inputEl.value.trim();
    if (!message) return;
    
    inputEl.value = '';
    
    if (config.collectEmail && !userEmail) {
      // If email collection is enabled but we don't have an email yet,
      // let the user know they need to provide an email first
      addMessage('Please provide your email address to start chatting.', 'assistant');
      return;
    }
    
    await sendMessage(message);
  }

  // Initialize the chatbot
  async function initialize() {
    try {
      // Set up event listeners
      const buttonEl = document.querySelector('.ecomai-chatbot-button');
      const closeEl = document.querySelector('.ecomai-chatbot-close');
      const chatWindowEl = document.querySelector('.ecomai-chatbot-window');
      const inputEl = document.querySelector('.ecomai-chatbot-input input');
      const sendEl = document.querySelector('.ecomai-chatbot-send');
      const emailFormEl = document.querySelector('.ecomai-email-form');
      const emailInputEl = emailFormEl ? emailFormEl.querySelector('input') : null;
      const emailButtonEl = emailFormEl ? emailFormEl.querySelector('button') : null;
      
      // Toggle chatbot window when button is clicked
      if (buttonEl) {
        buttonEl.addEventListener('click', async () => {
          isOpen = !isOpen;
          chatWindowEl.classList.toggle('open', isOpen);
          
          // If this is the first time opening, initialize the session
          if (isOpen && !chatbotId) {
            const chatbotConfig = await initSession();
            if (chatbotConfig) {
              chatbotId = chatbotConfig.id;
              
              if (chatbotConfig.initialMessage && !config.fallbackMode) {
                addMessage(chatbotConfig.initialMessage, 'assistant');
              }
            }
          }
        });
      }
      
      // Close chatbot window when close button is clicked
      if (closeEl) {
        closeEl.addEventListener('click', () => {
          isOpen = false;
          chatWindowEl.classList.remove('open');
        });
      }
      
      // Send message when send button is clicked
      if (sendEl) {
        sendEl.addEventListener('click', handleSendMessage);
      }
      
      // Send message when Enter key is pressed in input field
      if (inputEl) {
        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            handleSendMessage();
          }
        });
      }
      
      // Handle email form submission
      if (emailButtonEl && emailInputEl) {
        emailButtonEl.addEventListener('click', () => {
          const email = emailInputEl.value.trim();
          if (!email) {
            addMessage('Please enter a valid email address.', 'assistant');
            return;
          }
          
          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            addMessage('Please enter a valid email address.', 'assistant');
            return;
          }
          
          userEmail = email;
          emailFormEl.style.display = 'none';
          
          // Welcome message after email is provided
          addMessage(`Thank you! Now you can start chatting.`, 'assistant');
        });
      }
      
      console.log('ecom.ai Chatbot v2: Initialization complete');
    } catch (error) {
      console.error('ecom.ai Chatbot v2: Error during initialization', error);
      // Continue with a degraded experience
      config.fallbackMode = true;
    }
  }
  
  // Start the initialization process
  initialize();
})();