// ============================================================
// FILE: CustomerChat.jsx
// PURPOSE:
// Modern customer-facing live chat widget with:
// - Typing indicator simulation
// - Pre-built inquiry chips (Pricing, Order, Refund, Hours)
// - Real-time auto reply feedback
// - Auto-scroll to bottom
// - Session reset & new chat capability
// - Direct link to Admin console for seamless evaluation
// ============================================================

import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  createConversation,
  sendConversationMessage
} from "../../services/api";

import "./CustomerChat.css";

const QUICK_PROMPTS = [
  { label: "💰 Pricing Plans", text: "Hi! Can you tell me your pricing options?" },
  { label: "📦 Track Order", text: "What is the status of my order #84920?" },
  { label: "🔄 Refund Policy", text: "How do I request a refund for my purchase?" },
  { label: "🕒 Support Hours", text: "What are your live customer support hours?" },
  { label: "👋 Say Hello", text: "Hello there!" }
];

export default function CustomerChat() {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [errorBanner, setErrorBanner] = useState("");

  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  function formatTime(date = new Date()) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true
    }).format(date);
  }

  async function handleSend(textToSend = null) {
    const content = (textToSend || message).trim();
    if (!content) return;

    if (!customerName.trim()) {
      setErrorBanner("Please provide your name before sending a message.");
      return;
    }
    setErrorBanner("");

    const currentTime = formatTime();

    // Optimistically add customer message
    setMessages(prev => [
      ...prev,
      { sender: "customer", message: content, time: currentTime }
    ]);
    if (!textToSend) setMessage("");
    setLoading(true);
    setIsTyping(true);

    try {
      if (!conversationId) {
        // Start new conversation
        const result = await createConversation({
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim() || undefined,
          message: content
        });

        setConversationId(result.conversation_id);

        // Natural typing pause (500ms) for realistic UX
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [
            ...prev,
            {
              sender: "bot",
              message: result.reply,
              time: formatTime(),
              matchType: result.match_type,
              keyword: result.matched_keyword
            }
          ]);
          setLoading(false);
        }, 550);
      } else {
        // Continue existing conversation
        const result = await sendConversationMessage(conversationId, content, "customer");

        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [
            ...prev,
            {
              sender: "bot",
              message: result.reply,
              time: formatTime(),
              matchType: result.match_type,
              keyword: result.matched_keyword
            }
          ]);
          setLoading(false);
        }, 550);
      }
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setLoading(false);
      setErrorBanner(err.message || "Failed to reach server. Make sure FastAPI is running on port 8000.");
    }
  }

  function handleResetChat() {
    if (messages.length > 0 && !window.confirm("Start a new chat session?")) return;
    setConversationId(null);
    setMessages([]);
    setMessage("");
    setErrorBanner("");
  }

  function handlePromptClick(promptText) {
    if (!customerName.trim()) {
      setCustomerName("Guest Customer");
    }
    handleSend(promptText);
  }

  return (
    <div className="customer-page">
      <div className="customer-chat">
        {/* ==================================================
            HEADER
        ================================================== */}
        <div className="customer-header">
          <div className="support-profile">
            <div className="support-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a8 8 0 0 0-8 8v12l3-3h5a8 8 0 0 0 8-8V10a8 8 0 0 0-8-8z"/>
              </svg>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1>AutoReply Support</h1>
                <span className="ai-badge">Instant AI Bot</span>
              </div>
              <div className="online-status">
                <span className="online-dot" />
                <span>Active 24/7 · Typically replies in under 1 second</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {conversationId && (
              <button
                className="reset-chat-btn"
                onClick={handleResetChat}
                title="Start a fresh conversation"
              >
                🔄 New Chat
              </button>
            )}
            <Link to="/" className="admin-portal-link" title="Open Admin Control Center">
              ⚡ Admin Panel ↗
            </Link>
          </div>
        </div>

        {/* Error Banner */}
        {errorBanner && (
          <div className="customer-error-banner">
            <span>⚠️ {errorBanner}</span>
            <button onClick={() => setErrorBanner("")}>✕</button>
          </div>
        )}

        {/* ==================================================
            CUSTOMER IDENTITY FORM (First message)
        ================================================== */}
        {!conversationId && (
          <div className="customer-info">
            <div className="info-title">
              👋 Welcome! Let's get started
            </div>
            <p>
              Enter your name and email to connect with our automated support desk.
            </p>
            <div className="info-fields">
              <input
                type="text"
                placeholder="Your full name *"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="customer-input"
              />
              <input
                type="email"
                placeholder="Your email (optional)"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                className="customer-input"
              />
            </div>
          </div>
        )}

        {/* ==================================================
            CHAT MESSAGE HISTORY
        ================================================== */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-chat">
              <div className="empty-icon">💬</div>
              <h2>How can we help you today?</h2>
              <p>
                Type any message or select one of the popular quick topics below.
                Our intelligent auto-responder will answer instantly!
              </p>
            </div>
          )}

          {messages.map((item, index) => (
            <div
              key={index}
              className={`message-wrapper ${item.sender === "customer" ? "customer-wrapper" : "bot-wrapper"}`}
            >
              <div className={`message ${item.sender === "customer" ? "customer-message" : "bot-message"}`}>
                <div className="message-text">{item.message}</div>
                <div className="message-time">
                  {item.time || "Just now"}
                  {item.sender === "bot" && item.keyword && (
                    <span className="rule-match-pill" title={`Matched keyword: ${item.keyword}`}>
                      • {item.keyword}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="message-wrapper bot-wrapper">
              <div className="message bot-message typing-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ==================================================
            QUICK PROMPT CHIPS
        ================================================== */}
        <div className="quick-prompts-bar">
          <span className="quick-prompts-title">Quick questions:</span>
          <div className="quick-prompts-list">
            {QUICK_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                className="quick-chip"
                onClick={() => handlePromptClick(p.text)}
                disabled={loading}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ==================================================
            INPUT COMPOSER
        ================================================== */}
        <div className="message-input">
          <input
            type="text"
            placeholder={
              customerName.trim()
                ? "Ask anything (e.g. pricing, order status, refund)..."
                : "Enter your name above, or type your message here..."
            }
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !message.trim()}
          >
            {loading ? "Sending…" : "Send ↵"}
          </button>
        </div>
      </div>
    </div>
  );
}