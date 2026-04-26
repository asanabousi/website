/* =====================================================================
   UNFAZED MOTORS — AI CHATBOT WIDGET
   Drops into any page, talks to your Cloudflare Worker backend
   ===================================================================== */

const CHATBOT_CONFIG = {
  // Paste your deployed Cloudflare Worker URL here
  // Looks like: https://unfazed-chatbot.YOUR-SUBDOMAIN.workers.dev
  workerUrl: 'https://unfazed-chatbot.unfazedmotors.workers.dev',

  // Greeting message
  greeting: "Hey — I'm the Unfazed concierge. Ask me anything about what's on the floor, financing, or booking a test ride. What's on your mind?",

  // Quick-reply suggestions
  suggestions: [
    "What's in stock?",
    "I want a sportbike under $15K",
    "Tell me about financing",
    "I want to book a test ride"
  ]
};

(function() {
  const root = document.getElementById('unfazedChatRoot');
  if (!root) return;

  // Don't initialize if not configured
  if (CHATBOT_CONFIG.workerUrl === 'YOUR_WORKER_URL') {
    console.info('Chatbot not configured yet. Set workerUrl in chatbot.js.');
    return;
  }

  // Conversation history
  const history = [];
  let isOpen = false;
  let isLoading = false;

  // Build the widget HTML
  root.innerHTML = `
    <button class="uchat-fab" id="uchatFab" aria-label="Open chat">
      <span class="uchat-fab-pulse"></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    </button>

    <div class="uchat-panel" id="uchatPanel">
      <div class="uchat-header">
        <div class="uchat-header-left">
          <div class="uchat-avatar">
            <img src="assets/logo-damaged.png" alt="">
          </div>
          <div>
            <div class="uchat-title">UNFAZED CONCIERGE</div>
            <div class="uchat-subtitle">Online Now</div>
          </div>
        </div>
        <button class="uchat-close" id="uchatClose" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="uchat-messages" id="uchatMessages"></div>

      <div class="uchat-suggestions" id="uchatSuggestions"></div>

      <div class="uchat-input">
        <textarea id="uchatInput" placeholder="Ask about a bike, financing, or book a test ride..." rows="1"></textarea>
        <button class="uchat-send" id="uchatSend" disabled aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 2L11 13"/>
            <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>

      <div class="uchat-disclaimer">
        AI assistant · Verify details before purchase
      </div>
    </div>
  `;

  const fab = document.getElementById('uchatFab');
  const panel = document.getElementById('uchatPanel');
  const closeBtn = document.getElementById('uchatClose');
  const messagesEl = document.getElementById('uchatMessages');
  const suggestionsEl = document.getElementById('uchatSuggestions');
  const input = document.getElementById('uchatInput');
  const sendBtn = document.getElementById('uchatSend');

  function openChat() {
    isOpen = true;
    panel.classList.add('open');
    fab.classList.add('hidden');
    input.focus();
    if (messagesEl.children.length === 0) {
      addBotMessage(CHATBOT_CONFIG.greeting);
      renderSuggestions();
    }
  }

  function closeChat() {
    isOpen = false;
    panel.classList.remove('open');
    fab.classList.remove('hidden');
  }

  fab.addEventListener('click', openChat);
  closeBtn.addEventListener('click', closeChat);

  function addBotMessage(text) {
    const div = document.createElement('div');
    div.className = 'uchat-msg bot';
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'uchat-msg user';
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'uchat-msg system';
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'uchat-typing';
    div.id = 'uchatTyping';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const typing = document.getElementById('uchatTyping');
    if (typing) typing.remove();
  }

  function renderSuggestions() {
    suggestionsEl.innerHTML = CHATBOT_CONFIG.suggestions
      .map(s => `<button class="uchat-chip" data-text="${s}">${s}</button>`)
      .join('');
    suggestionsEl.querySelectorAll('.uchat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        sendMessage(chip.dataset.text);
      });
    });
  }

  function hideSuggestions() {
    suggestionsEl.style.display = 'none';
  }

  async function sendMessage(text) {
    if (!text || isLoading) return;

    hideSuggestions();
    addUserMessage(text);
    history.push({ role: 'user', content: text });

    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;
    isLoading = true;

    showTyping();

    try {
      const res = await fetch(CHATBOT_CONFIG.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });

      hideTyping();

      if (!res.ok) {
        addBotMessage("I'm having trouble connecting right now. Please call us at 780-236-1276 or email hello@unfazedmotors.ca and we'll help you out.");
        return;
      }

      const data = await res.json();
      const reply = data.reply || "Sorry, I didn't catch that. Could you try rephrasing?";

      addBotMessage(reply);
      history.push({ role: 'assistant', content: reply });

      if (data.leadCreated) {
        setTimeout(() => {
          addSystemMessage("✓ Submitted — our team will reach out shortly");
        }, 500);
      }

    } catch (err) {
      console.error('Chat error:', err);
      hideTyping();
      addBotMessage("Connection issue. Please call 780-236-1276 or email hello@unfazedmotors.ca.");
    } finally {
      isLoading = false;
      sendBtn.disabled = input.value.trim().length === 0;
    }
  }

  // Input handling
  input.addEventListener('input', () => {
    sendBtn.disabled = input.value.trim().length === 0 || isLoading;
    // Auto-resize textarea
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value.trim());
    }
  });

  sendBtn.addEventListener('click', () => {
    sendMessage(input.value.trim());
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeChat();
  });
})();
