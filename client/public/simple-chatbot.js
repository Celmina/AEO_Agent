/**
 * ecom.ai Simplified Chatbot Script
 * This script creates an embedded AI chatbot for your website
 * Using OpenAI directly without scraping
 */
(function() {
  // Configuration options (will be customized per website)
  const config = {
    apiUrl: "{{API_URL}}",
    websiteId: "{{WEBSITE_ID}}",
    primaryColor: "{{PRIMARY_COLOR}}",
    position: "{{POSITION}}",
    initialMessage: "{{INITIAL_MESSAGE}}"
  };

  // Elements
  let chatContainer, chatHeader, chatMessages, chatInput, chatButton, chatSubmit;
  let sessionId = null;
  let typingIndicator = null;
  
  // Initialize when DOM is fully loaded
  if (document.readyState === "complete") {
    initialize();
  } else {
    window.addEventListener("load", initialize);
  }
  
  /**
   * Safe fetch with better error handling and CORS support
   */
  async function safeFetch(url, options = {}) {
    try {
      // Ensure proper headers are set
      options.headers = options.headers || {};
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
      
      // Make the request
      const response = await fetch(url, {
        ...options,
        credentials: 'omit', // Don't send cookies for cross-origin requests
        mode: 'cors' // Enable CORS
      });
      
      // Check if response is ok (status in 200-299 range)
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Chatbot API Error:", error);
      return { error: error.message || "Failed to communicate with chatbot service" };
    }
  }
  
  /**
   * Initialize a chat session with the API
   */
  async function initSession() {
    const visitorId = generateVisitorId();
    
    try {
      const response = await safeFetch(`${config.apiUrl}/api/public/simple-chat-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          websiteId: config.websiteId,
          visitorId: visitorId
        })
      });
      
      if (response.error) {
        addMessage(`I'm sorry, but I'm having trouble connecting to my knowledge base. Please try again later.`, 'assistant');
        return false;
      }
      
      sessionId = response.sessionId;
      
      // Add the initial message
      const initialMessage = response.initialMessage || config.initialMessage || "Hello! How can I help you today?";
      addMessage(initialMessage, 'assistant');
      
      return true;
    } catch (error) {
      console.error("Failed to initialize chat session:", error);
      addMessage(`I'm sorry, but I'm having trouble connecting to my knowledge base. Please try again later.`, 'assistant');
      return false;
    }
  }
  
  /**
   * Customize the chatbot appearance based on config
   */
  function updateChatbotStyles() {
    // Set primary color
    const primaryColor = config.primaryColor || "#2563eb";
    const root = document.documentElement;
    root.style.setProperty('--chatbot-primary-color', primaryColor);
    
    // Set position
    if (config.position === "left") {
      chatContainer.style.left = "20px";
      chatContainer.style.right = "auto";
    } else {
      chatContainer.style.right = "20px";
      chatContainer.style.left = "auto";
    }
  }
  
  /**
   * Create a new chat session
   */
  async function createSession() {
    return await initSession();
  }
  
  /**
   * Send a message to the chatbot API
   */
  async function sendMessage(message) {
    if (!sessionId) {
      const success = await createSession();
      if (!success) return false;
    }
    
    try {
      showTyping();
      
      const response = await safeFetch(`${config.apiUrl}/api/public/simple-chat-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          message: message,
          visitorId: generateVisitorId(),
          websiteId: config.websiteId
        })
      });
      
      hideTyping();
      
      if (response.error) {
        addMessage("I'm sorry, but I'm having trouble processing your request right now. Please try again later.", 'assistant');
        return false;
      }
      
      addMessage(response.message, 'assistant');
      return true;
    } catch (error) {
      hideTyping();
      console.error("Failed to send message:", error);
      addMessage("I'm sorry, but I'm having trouble processing your request right now. Please try again later.", 'assistant');
      return false;
    }
  }
  
  /**
   * Add a message to the chat interface
   */
  function addMessage(text, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ecom-chatbot-message ecom-chatbot-${role}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
  }
  
  /**
   * Show typing indicator
   */
  function showTyping() {
    if (!typingIndicator) {
      typingIndicator = document.createElement('div');
      typingIndicator.className = "ecom-chatbot-message ecom-chatbot-assistant ecom-chatbot-typing";
      typingIndicator.innerHTML = "<span>.</span><span>.</span><span>.</span>";
      chatMessages.appendChild(typingIndicator);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
  
  /**
   * Hide typing indicator
   */
  function hideTyping() {
    if (typingIndicator && typingIndicator.parentNode) {
      typingIndicator.parentNode.removeChild(typingIndicator);
      typingIndicator = null;
    }
  }
  
  /**
   * Generate a persistent visitor ID
   */
  function generateVisitorId() {
    let visitorId = localStorage.getItem('ecom_visitor_id');
    
    if (!visitorId) {
      visitorId = 'visitor_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('ecom_visitor_id', visitorId);
    }
    
    return visitorId;
  }
  
  /**
   * Handle send message button click
   */
  async function handleSendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Clear input
    chatInput.value = '';
    
    // Add message to the chat
    addMessage(message, 'user');
    
    // Send to the API
    await sendMessage(message);
  }
  
  /**
   * Initialize the chatbot interface and functionality
   */
  async function initialize() {
    // Create the container
    chatContainer = document.createElement('div');
    chatContainer.className = 'ecom-chatbot-container';
    
    // Create chat header
    chatHeader = document.createElement('div');
    chatHeader.className = 'ecom-chatbot-header';
    chatHeader.innerHTML = `
      <div class="ecom-chatbot-title">Chat with us</div>
      <div class="ecom-chatbot-close">&times;</div>
    `;
    
    // Create messages container
    chatMessages = document.createElement('div');
    chatMessages.className = 'ecom-chatbot-messages';
    
    // Create input area
    const chatInputArea = document.createElement('div');
    chatInputArea.className = 'ecom-chatbot-input-area';
    
    chatInput = document.createElement('input');
    chatInput.className = 'ecom-chatbot-input';
    chatInput.type = 'text';
    chatInput.placeholder = 'Type your message...';
    
    chatSubmit = document.createElement('button');
    chatSubmit.className = 'ecom-chatbot-submit';
    chatSubmit.innerHTML = '&#10148;';
    
    chatInputArea.appendChild(chatInput);
    chatInputArea.appendChild(chatSubmit);
    
    // Assemble the elements
    chatContainer.appendChild(chatHeader);
    chatContainer.appendChild(chatMessages);
    chatContainer.appendChild(chatInputArea);
    
    // Create chat button
    chatButton = document.createElement('div');
    chatButton.className = 'ecom-chatbot-button';
    chatButton.innerHTML = `
      <div class="ecom-chatbot-button-icon">💬</div>
    `;
    
    // Add elements to the body
    document.body.appendChild(chatContainer);
    document.body.appendChild(chatButton);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --chatbot-primary-color: #2563eb;
      }
      
      .ecom-chatbot-container {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 10000;
        transition: transform 0.3s ease, opacity 0.3s ease;
        transform: translateY(20px);
        opacity: 0;
        pointer-events: none;
      }
      
      .ecom-chatbot-container.active {
        transform: translateY(0);
        opacity: 1;
        pointer-events: all;
      }
      
      .ecom-chatbot-header {
        background: var(--chatbot-primary-color);
        color: white;
        padding: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .ecom-chatbot-title {
        font-weight: bold;
      }
      
      .ecom-chatbot-close {
        cursor: pointer;
        font-size: 20px;
      }
      
      .ecom-chatbot-messages {
        flex: 1;
        padding: 15px;
        overflow-y: auto;
      }
      
      .ecom-chatbot-message {
        margin-bottom: 10px;
        padding: 10px 15px;
        border-radius: 15px;
        max-width: 80%;
        word-wrap: break-word;
      }
      
      .ecom-chatbot-user {
        background: #f1f5f9;
        margin-left: auto;
        border-bottom-right-radius: 0;
      }
      
      .ecom-chatbot-assistant {
        background: var(--chatbot-primary-color);
        color: white;
        margin-right: auto;
        border-bottom-left-radius: 0;
      }
      
      .ecom-chatbot-typing {
        padding: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .ecom-chatbot-typing span {
        animation: typing 1s infinite;
        margin: 0 2px;
        font-size: 20px;
      }
      
      .ecom-chatbot-typing span:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .ecom-chatbot-typing span:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes typing {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      
      .ecom-chatbot-input-area {
        display: flex;
        padding: 15px;
        border-top: 1px solid #e2e8f0;
      }
      
      .ecom-chatbot-input {
        flex: 1;
        padding: 10px;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        outline: none;
      }
      
      .ecom-chatbot-submit {
        background: var(--chatbot-primary-color);
        color: white;
        border: none;
        border-radius: 50%;
        width: 38px;
        height: 38px;
        margin-left: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }
      
      .ecom-chatbot-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--chatbot-primary-color);
        color: white;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transition: transform 0.2s ease;
      }
      
      .ecom-chatbot-button:hover {
        transform: scale(1.05);
      }
      
      .ecom-chatbot-button-icon {
        font-size: 24px;
      }
      
      @media (max-width: 480px) {
        .ecom-chatbot-container {
          width: 100%;
          height: 60vh;
          right: 0;
          bottom: 80px;
          border-radius: 15px 15px 0 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Set up event listeners
    chatButton.addEventListener('click', () => {
      chatContainer.classList.add('active');
      // Initialize session if not already done
      if (!sessionId) {
        initSession();
      }
    });
    
    chatHeader.querySelector('.ecom-chatbot-close').addEventListener('click', () => {
      chatContainer.classList.remove('active');
    });
    
    chatSubmit.addEventListener('click', handleSendMessage);
    
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    });
    
    // Apply custom styles
    updateChatbotStyles();
  }
})();