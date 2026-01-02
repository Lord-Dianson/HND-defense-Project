// HostelBot - AI Chatbot for HosteLink Platform
// Powered by OpenRouter API (GPT-5.2-pro)

const OPENROUTER_API_KEY = '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';
const MODEL_NAME = 'deepseek/deepseek-v3.2-speciale';

// System prompt with HosteLink platform knowledge
const SYSTEM_PROMPT = `You are HostelBot, a helpful AI assistant for HosteLink - a modern hostel booking and management platform in Cameroon.

**Platform Overview:**
HosteLink connects students and professionals with verified hostels in Cameroon, with a focus on university areas like Molyko, Buea. The platform offers hostel booking, receipt generation, and agent management.

**Key Features:**

1. **User Authentication:**
   - Signup: Users register with email, phone, role (student/agent/admin), and profile photo (uploaded to Cloudinary)
   - OTP Verification: After signup, users receive an OTP via email for verification
   - Login: Email/password authentication with JWT tokens
   - Password Reset: Users can reset forgotten passwords via email

2. **Hostel Browsing & Booking:**
   - Browse verified hostels with photos, amenities, pricing, and location
   - Filter by price range, amenities, and area
   - Book hostels for 1+ years with upfront payment
   - Students can view their booking history

3. **Receipt Generation:**
   - After successful payment, users can download a professional PDF receipt
   - Receipt includes: payer name, hostel name, booking period, rent amount, and total paid
   - "Golden Receipt" must be presented to landlord upon arrival
   - Download button available on receipt.html page

4. **Agent System:**
   - Agents can submit new hostel listings for verification
   - Admin verifies submissions before they go live
   - Agents earn commissions for successful bookings
   - Payment history tracking

5. **Navigation:**
   - Homepage: index.html - Platform overview and features
   - Auth Pages: login.html, signup.html, otp.html, forgotPassword.html
   - Hostel Pages: Browse and book hostels
   - Receipt Page: receipt.html - Generate and download payment receipts
   - Chatbot: botChatpage.html (this page)

**Your Role:**
- Guide users through signup, login, and booking processes
- Answer questions about hostel features and platform functionality
- Help troubleshoot common issues
- Provide code examples when asked about API integration
- Be friendly, helpful, and concise

**Communication Style:**
- Be friendly and conversational
- Use emojis sparingly for warmth
- Keep responses concise but informative
- When showing code, use proper syntax highlighting
- Guide users step-by-step for complex tasks`;

class HostelBot {
    constructor() {
        this.messages = [];
        this.isChatActive = false;
        this.isTyping = false;

        // Initialize DOM elements
        this.body = document.body;
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-btn');
        this.messagesContainer = document.getElementById('messages-container');
        this.suggestionBtns = document.querySelectorAll('.suggestion-btn');

        this.init();
    }

    init() {
        // Add system prompt to messages
        this.messages.push({
            role: 'system',
            content: SYSTEM_PROMPT
        });

        // Event listeners
        this.sendBtn.addEventListener('click', () => this.handleSend());
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });

        this.suggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.textContent.trim();
                this.startChat(text);
            });
        });
    }

    handleSend() {
        const text = this.chatInput.value.trim();
        if (text) {
            this.startChat(text);
        }
    }

    async startChat(userMessage) {
        if (!userMessage || this.isTyping) return;

        // Activate chat mode
        if (!this.isChatActive) {
            this.isChatActive = true;
            this.body.classList.add('chat-mode');
        }

        // Add user message
        this.addMessage(userMessage, 'user');
        this.chatInput.value = '';

        // Add user message to conversation history
        this.messages.push({
            role: 'user',
            content: userMessage
        });

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Call OpenRouter API
            const response = await this.callOpenRouterAPI();

            // Hide typing indicator
            this.hideTypingIndicator();

            if (response && response.content) {
                // Add assistant message to history
                const assistantMessage = {
                    role: 'assistant',
                    content: response.content
                };

                // Preserve reasoning details if present
                if (response.reasoning_details) {
                    assistantMessage.reasoning_details = response.reasoning_details;
                }

                this.messages.push(assistantMessage);

                // Display bot response with markdown
                this.addMessage(response.content, 'bot');
            }
        } catch (error) {
            console.error('Error calling AI:', error);
            console.error('Error details:', error.message);
            this.hideTypingIndicator();

            // Show detailed error to user
            let errorMsg = 'Sorry, I encountered an error. 😔';
            if (error.message.includes('API error:')) {
                errorMsg += '\n\n' + error.message;
            }
            this.addMessage(errorMsg, 'bot');
        }
    }

    async callOpenRouterAPI() {
        console.log('🤖 Calling OpenRouter API');
        console.log('Model:', MODEL_NAME);
        console.log('Messages count:', this.messages.length);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: this.messages,
                reasoning: { enabled: true }
            })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('API Error Response:', errorData);
            throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('✅ API Response received');
        console.log('Response data:', data);
        return data.choices[0].message;
    }

    showTypingIndicator() {
        this.isTyping = true;
        const div = document.createElement('div');
        div.id = 'typing-indicator';
        div.className = 'w-full flex justify-start items-start gap-4 mb-8 message-anim';
        div.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-blue-500/20">
                <i class="fas fa-sparkles text-white text-xs"></i>
            </div>
            <div class="glass-panel px-6 py-4 rounded-2xl rounded-tl-sm border border-white/5 shadow-lg backdrop-blur-2xl">
                <div class="flex gap-1.5">
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
                    <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
                </div>
            </div>
        `;
        this.messagesContainer.appendChild(div);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    addMessage(text, type) {
        const div = document.createElement('div');
        div.className = 'w-full flex mb-8 message-anim';

        if (type === 'user') {
            div.classList.add('justify-end');
            div.innerHTML = `
                <div class="bg-gradient-to-br from-[#2b2d31] to-[#1e2024] text-white px-6 py-3.5 rounded-2xl rounded-tr-sm max-w-[85%] md:max-w-[70%] text-[16px] leading-relaxed shadow-lg border border-white/5 tracking-wide">
                    ${this.escapeHtml(text)}
                </div>
            `;
        } else {
            div.classList.add('justify-start', 'items-start', 'gap-4');
            const renderedContent = this.renderMarkdown(text);
            div.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-blue-500/20">
                    <i class="fas fa-sparkles text-white text-xs"></i>
                </div>
                <div class="glass-panel text-gray-100 px-6 py-4 rounded-2xl rounded-tl-sm max-w-[85%] md:max-w-[70%] border border-white/5 text-[16px] leading-relaxed shadow-lg backdrop-blur-2xl markdown-content">
                    ${renderedContent}
                </div>
            `;
        }

        this.messagesContainer.appendChild(div);

        // Add copy buttons to code blocks
        if (type === 'bot') {
            this.addCopyButtonsToCodeBlocks(div);
        }

        this.scrollToBottom();
    }

    renderMarkdown(text) {
        // Use marked.js to render markdown
        if (typeof marked !== 'undefined') {
            // Configure marked for better code highlighting
            marked.setOptions({
                highlight: function (code, lang) {
                    if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                        return hljs.highlight(code, { language: lang }).value;
                    }
                    return code;
                },
                breaks: true,
                gfm: true
            });
            return marked.parse(text);
        }
        // Fallback: basic markdown rendering
        return this.basicMarkdownRender(text);
    }

    basicMarkdownRender(text) {
        // Simple fallback markdown rendering
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
            .replace(/\n/g, '<br>');
    }

    addCopyButtonsToCodeBlocks(container) {
        const codeBlocks = container.querySelectorAll('pre code');
        codeBlocks.forEach(codeBlock => {
            const pre = codeBlock.parentElement;

            // Wrap in relative container if not already
            if (!pre.parentElement.classList.contains('code-block-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper relative my-4';
                pre.parentElement.insertBefore(wrapper, pre);
                wrapper.appendChild(pre);
            }

            // Add copy button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-2';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';

            copyBtn.addEventListener('click', () => {
                const code = codeBlock.textContent;
                navigator.clipboard.writeText(code).then(() => {
                    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    copyBtn.classList.add('bg-green-600');
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
                        copyBtn.classList.remove('bg-green-600');
                    }, 2000);
                });
            });

            pre.parentElement.appendChild(copyBtn);
        });
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTo({
                top: this.messagesContainer.scrollHeight + 100,
                behavior: 'smooth'
            });
        }, 100);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.hostelBot = new HostelBot();
    });
} else {
    window.hostelBot = new HostelBot();
}
