// ============================================================
// FILE: Conversations.jsx
// PURPOSE:
// Complete customer inbox / conversation management.
//
// FEATURES:
// - Search conversations
// - Select customer
// - View customer message
// - View automatic reply
// - Type message directly in inbox
// - Send message
// - Enter = Send
// - Shift + Enter = New line
// - Delete conversation
// - Refresh conversations
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";

import {
    Search,
    RefreshCw,
    MessageCircle,
    Trash2,
    User,
    Mail,
    Clock,
    Bot,
    Send,
    X,
    MoreVertical
} from "lucide-react";

import {
    getConversations,
    getConversation,
    sendConversationMessage,
    updateConversation,
    deleteConversation,
    createConversation
} from "../services/api";

export default function Conversations() {

    // ============================================================
    // STATE: CONVERSATIONS
    // ============================================================

    const [conversations, setConversations] = useState([]);

    const [selectedConversation, setSelectedConversation] =
        useState(null);

    const [messages, setMessages] = useState([]);

    const [loadingMessages, setLoadingMessages] = useState(false);

    const selectionRequest = useRef(0);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);

    const [sending, setSending] = useState(false);

    const [error, setError] = useState("");

    // Status filter: 'all', 'active', 'replied', 'pending', 'closed'
    const [filterStatus, setFilterStatus] = useState("all");

    // Composer mode: 'agent' (Reply as human support) vs 'customer' (Simulate customer inquiry)
    const [composerSender, setComposerSender] = useState("agent");


    // ============================================================
    // STATE: MESSAGE COMPOSER
    // ============================================================

    const [message, setMessage] = useState("");

    const [showCreateForm, setShowCreateForm] =
        useState(false);

    const [customerName, setCustomerName] =
        useState("");

    const [customerEmail, setCustomerEmail] =
        useState("");


    // ============================================================
    // FEATURE: LOAD CONVERSATIONS
    // ============================================================

    async function loadConversations() {

        try {

            setLoading(true);
            setError("");

            const data = await getConversations();

            setConversations(data);

            // Keep currently selected conversation updated
            if (selectedConversation) {

                const updated = data.find(
                    item =>
                        item.id === selectedConversation.id
                );

                if (updated) {
                    setSelectedConversation(updated);
                } else {
                    setSelectedConversation(null);
                    setMessages([]);
                }
            }

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                "Unable to load conversations."
            );

        } finally {

            setLoading(false);

        }
    }


    // ============================================================
    // FEATURE: INITIAL LOAD
    // ============================================================

    useEffect(() => {

        loadConversations();

    }, []);


    // ============================================================
    // FEATURE: SEARCH & STATUS FILTER
    // ============================================================

    const filteredConversations =
        useMemo(() => {
            let list = conversations;

            if (filterStatus !== "all") {
                list = list.filter(
                    c => (c.status || "active").toLowerCase() === filterStatus.toLowerCase()
                );
            }

            const searchText =
                search.toLowerCase().trim();

            if (!searchText) {
                return list;
            }

            return list.filter(
                conversation => {

                    const searchableText = `
            ${conversation.customer_name}
            ${conversation.customer_email || ""}
            ${conversation.message || ""}
            ${conversation.reply || ""}
            ${conversation.status || ""}
          `.toLowerCase();

                    return searchableText.includes(
                        searchText
                    );

                }
            );

        }, [conversations, search, filterStatus]);


    // ============================================================
    // FEATURE: SELECT CONVERSATION
    // ============================================================

    async function handleSelect(conversation) {

        const requestId = ++selectionRequest.current;

        setSelectedConversation(
            conversation
        );

        setMessages([]);
        setLoadingMessages(true);
        setError("");
        setMessage("");

        try {
            const details = await getConversation(conversation.id);
            if (requestId === selectionRequest.current) {
                setSelectedConversation(details);
                setMessages(details.messages || []);
            }
        } catch (err) {
            if (requestId === selectionRequest.current) {
                console.error(err);
                setError(err.message || "Unable to load conversation messages.");
            }
        } finally {
            if (requestId === selectionRequest.current) {
                setLoadingMessages(false);
            }
        }

    }


    // ============================================================
    // FEATURE: DELETE CONVERSATION
    // ============================================================

    async function handleDelete(id) {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this conversation?"
            );

        if (!confirmed) {
            return;
        }

        try {

            await deleteConversation(id);

            setConversations(
                previous =>
                    previous.filter(
                        conversation =>
                            conversation.id !== id
                    )
            );

            if (
                selectedConversation?.id === id
            ) {

                selectionRequest.current += 1;
                setSelectedConversation(null);
                setMessages([]);

            }

        } catch (err) {

            console.error(err);

            alert(
                err.message ||
                "Unable to delete conversation."
            );

        }
    }


    // ============================================================
    // FEATURE: UPDATE CONVERSATION STATUS
    // ============================================================

    async function handleStatusChange(newStatus) {
        if (!selectedConversation) return;

        try {
            await updateConversation(selectedConversation.id, {
                status: newStatus
            });

            setSelectedConversation(prev => ({
                ...prev,
                status: newStatus
            }));

            setConversations(prev =>
                prev.map(item =>
                    item.id === selectedConversation.id
                        ? { ...item, status: newStatus }
                        : item
                )
            );
        } catch (err) {
            console.error(err);
            alert("Unable to update conversation status.");
        }
    }


    // ============================================================
    // FEATURE: SEND MESSAGE (Agent or simulated customer)
    // ============================================================

    async function handleSendMessage(event) {

        if (event) {
            event.preventDefault();
        }

        if (!selectedConversation) {
            return;
        }

        if (!message.trim()) {
            return;
        }

        try {

            setSending(true);

            await sendConversationMessage(
                selectedConversation.id,
                message.trim(),
                composerSender
            );


            // ========================================================
            // RELOAD DATA FROM SQLITE
            // ========================================================

            const updated =
                await getConversations();

            setConversations(updated);


            // ========================================================
            // REFRESH CONVERSATION DETAIL
            // ========================================================

            const refreshedConversation =
                updated.find(
                    conversation =>
                        conversation.id ===
                        selectedConversation.id
                );


            if (refreshedConversation) {
                await handleSelect(refreshedConversation);
            }


            // Clear composer
            setMessage("");

        } catch (err) {

            console.error(err);

            alert(
                err.message ||
                "Unable to send message."
            );

        } finally {

            setSending(false);

        }
    }


    // ============================================================
    // FEATURE: KEYBOARD SEND
    //
    // Enter       = Send
    // Shift+Enter = New line
    // ============================================================

    function handleMessageKeyDown(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            handleSendMessage();

        }
    }


    // ============================================================
    // FEATURE: NEW CONVERSATION
    // ============================================================

    async function handleCreateConversation(event) {

        event.preventDefault();

        if (
            !customerName.trim() ||
            !message.trim()
        ) {

            alert(
                "Customer name and message are required."
            );

            return;
        }

        try {

            setSending(true);

            const result =
                await createConversation({

                    customer_name:
                        customerName.trim(),

                    customer_email:
                        customerEmail.trim() || null,

                    message:
                        message.trim()

                });


            const updated =
                await getConversations();

            setConversations(updated);


            const newConversation =
                updated.find(
                    conversation =>
                        conversation.id ===
                        result.conversation_id
                );


            if (newConversation) {
                await handleSelect(newConversation);
            }


            setCustomerName("");
            setCustomerEmail("");
            setMessage("");

            setShowCreateForm(false);

        } catch (err) {

            console.error(err);

            alert(
                err.message ||
                "Unable to create conversation."
            );

        } finally {

            setSending(false);

        }
    }


    // ============================================================
    // FEATURE: FORMAT DATE
    // ============================================================

    function formatDate(dateString) {

        if (!dateString) {
            return "Unknown";
        }

        try {

            return new Date(
                dateString
            ).toLocaleString();

        } catch {

            return dateString;

        }
    }


    // ============================================================
    // FEATURE: FORMAT SHORT TIME
    // ============================================================

    function formatTime(dateString) {

        if (!dateString) {
            return "";
        }

        try {

            return new Date(
                dateString
            ).toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        } catch {

            return "";

        }
    }


    // ============================================================
    // FEATURE: CUSTOMER INITIAL
    // ============================================================

    function getInitial(name) {

        return (
            name
                ?.charAt(0)
                ?.toUpperCase() ||
            "?"
        );

    }


    // ============================================================
    // UI
    // ============================================================

    return (

        <div className="inbox-page">

            {/* ======================================================
          PAGE HEADER
      ====================================================== */}

            <div className="page-heading">

                <div>

                    <div className="eyebrow">
                        CUSTOMER SUPPORT
                    </div>

                    <h2>
                        Inbox
                    </h2>

                    <p>
                        Manage customer messages and automatic replies.
                    </p>

                </div>


                <div className="heading-actions">

                    <button
                        className="secondary-button"
                        onClick={loadConversations}
                    >

                        <RefreshCw size={16} />

                        Refresh

                    </button>


                    <button
                        className="primary-button"
                        onClick={() =>
                            setShowCreateForm(true)
                        }
                    >

                        <Send size={16} />

                        New Conversation

                    </button>

                </div>

            </div>


            {/* ======================================================
          ERROR
      ====================================================== */}

            {error && (

                <div className="error-banner">

                    <strong>
                        Unable to load conversations
                    </strong>

                    <span>
                        {error}
                    </span>

                </div>

            )}


            {/* ======================================================
          INBOX CONTAINER
      ====================================================== */}

            <div className="inbox-container">


                {/* ====================================================
            LEFT SIDEBAR
        ==================================================== */}

                <aside className="inbox-sidebar">


                    {/* SEARCH */}

                    <div className="inbox-search">

                        <Search size={17} />

                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={search}
                            onChange={event =>
                                setSearch(event.target.value)
                            }
                        />

                    </div>

                    {/* STATUS FILTER PILLS */}
                    <div style={{ display: "flex", gap: "5px", padding: "0 14px 10px", flexWrap: "wrap" }}>
                        {["all", "active", "replied", "pending", "closed"].map(st => (
                            <button
                                key={st}
                                type="button"
                                onClick={() => setFilterStatus(st)}
                                style={{
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    padding: "3px 9px",
                                    borderRadius: "12px",
                                    textTransform: "capitalize",
                                    background: filterStatus === st ? "var(--primary)" : "var(--surface-soft)",
                                    color: filterStatus === st ? "#fff" : "var(--text-secondary)",
                                    border: `1px solid ${filterStatus === st ? "var(--primary)" : "var(--border)"}`,
                                    cursor: "pointer",
                                    transition: "all 0.15s ease"
                                }}
                            >
                                {st}
                            </button>
                        ))}
                    </div>


                    {/* SIDEBAR HEADER */}

                    <div className="inbox-sidebar-title">

                        <div>

                            <strong>
                                Messages
                            </strong>

                            <span>
                                {filteredConversations.length}
                            </span>

                        </div>

                    </div>


                    {/* CONVERSATION LIST */}

                    <div className="conversation-list">

                        {loading ? (

                            <div className="empty-state">

                                <div className="spinner"></div>

                                <p>
                                    Loading conversations...
                                </p>

                            </div>

                        ) : filteredConversations.length === 0 ? (

                            <div className="empty-state">

                                <MessageCircle size={32} />

                                <h3>
                                    No conversations
                                </h3>

                                <p>
                                    Start a new customer conversation.
                                </p>

                            </div>

                        ) : (

                            filteredConversations.map(
                                conversation => (

                                    <button
                                        key={conversation.id}
                                        className={
                                            selectedConversation?.id ===
                                                conversation.id
                                                ? "inbox-conversation selected"
                                                : "inbox-conversation"
                                        }
                                        onClick={() =>
                                            handleSelect(conversation)
                                        }
                                    >

                                        {/* AVATAR */}

                                        <div className="conversation-avatar">

                                            {getInitial(
                                                conversation.customer_name
                                            )}

                                        </div>


                                        {/* CONTENT */}

                                        <div className="conversation-preview">

                                            <div className="conversation-preview-top">

                                                <strong>
                                                    {conversation.customer_name}
                                                </strong>

                                                <span>
                                                    {formatTime(
                                                        conversation.created_at
                                                    )}
                                                </span>

                                            </div>


                                            <p>
                                                {conversation.message}
                                            </p>


                                            <div className="conversation-preview-bottom">

                                                <span
                                                    className={
                                                        conversation.status ===
                                                            "replied"
                                                            ? "mini-status replied"
                                                            : "mini-status pending"
                                                    }
                                                >
                                                    {conversation.status}
                                                </span>

                                            </div>

                                        </div>

                                    </button>

                                )
                            )

                        )}

                    </div>

                </aside>


                {/* ====================================================
            RIGHT CHAT
        ==================================================== */}

                <main className="inbox-chat">

                    {!selectedConversation ? (

                        <div className="conversation-empty">

                            <div className="empty-chat-icon">

                                <MessageCircle size={30} />

                            </div>

                            <h3>
                                Your messages
                            </h3>

                            <p>
                                Select a conversation to start chatting.
                            </p>

                        </div>

                    ) : (

                        <>

                            {/* ==================================================
                  CHAT HEADER
              ================================================== */}

                            <div className="chat-header">

                                <div className="chat-customer">

                                    <div className="large-avatar">

                                        {getInitial(
                                            selectedConversation.customer_name
                                        )}

                                    </div>


                                    <div>

                                        <h3>
                                            {selectedConversation.customer_name}
                                        </h3>

                                        <span>
                                            {selectedConversation.customer_email ||
                                                `Customer #${selectedConversation.id}`}
                                        </span>

                                    </div>

                                </div>


                                <div className="chat-header-actions">

                                    <span className="online-indicator">
                                        <span></span>
                                        Active
                                    </span>

                                    <button
                                        className="delete-button"
                                        onClick={() =>
                                            handleDelete(
                                                selectedConversation.id
                                            )
                                        }
                                        title="Delete conversation"
                                    >

                                        <Trash2 size={17} />

                                    </button>

                                    <button
                                        className="chat-more-button"
                                        title="More options"
                                    >

                                        <MoreVertical size={18} />

                                    </button>

                                </div>

                            </div>


                            {/* ==================================================
                  CUSTOMER DETAILS
              ================================================== */}

                            <div className="customer-details">

                                <div>

                                    <Mail size={14} />

                                    <span>
                                        {selectedConversation.customer_email ||
                                            "No email provided"}
                                    </span>

                                </div>


                                <div>

                                    <Clock size={14} />

                                    <span>
                                        {formatDate(
                                            selectedConversation.created_at
                                        )}
                                    </span>

                                </div>


                                <span
                                    className={
                                        selectedConversation.status ===
                                            "replied"
                                            ? "status-badge replied"
                                            : "status-badge pending"
                                    }
                                >
                                    {selectedConversation.status}
                                </span>

                                {/* Quick Status Changer */}
                                <div style={{ display: "flex", gap: "5px", alignItems: "center", marginLeft: "auto" }}>
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>Status:</span>
                                    {["active", "replied", "pending", "closed"].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => handleStatusChange(s)}
                                            style={{
                                                fontSize: "10.5px",
                                                fontWeight: 700,
                                                padding: "2px 8px",
                                                borderRadius: "10px",
                                                textTransform: "capitalize",
                                                background: selectedConversation.status === s ? "var(--primary)" : "transparent",
                                                color: selectedConversation.status === s ? "#fff" : "var(--text-secondary)",
                                                border: `1px solid ${selectedConversation.status === s ? "var(--primary)" : "var(--border)"}`,
                                                cursor: "pointer",
                                                transition: "all 0.15s ease"
                                            }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>

                            </div>


                            {/* ==================================================
                  CHAT MESSAGES
              ================================================== */}

                            <div className="chat-content">

                                {loadingMessages ? (
                                    <div className="empty-state">
                                        <div className="spinner"></div>
                                        <p>Loading messages...</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="empty-state">
                                        <MessageCircle size={32} />
                                        <p>No messages in this conversation yet.</p>
                                    </div>
                                ) : messages.map(chatMessage => (
                                    <div key={chatMessage.id}>
                                        {chatMessage.sender === "agent" ? (
                                            <div className="chat-message-row" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "14px" }}>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", maxWidth: "75%" }}>
                                                    <div style={{ display: "flex", gap: "6px", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
                                                        <strong style={{ color: "var(--primary)" }}>Support Agent</strong>
                                                        <span>{formatTime(chatMessage.created_at)}</span>
                                                    </div>
                                                    <div style={{
                                                        background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                                                        color: "#ffffff",
                                                        padding: "10px 16px",
                                                        borderRadius: "16px 16px 4px 16px",
                                                        fontSize: "13.5px",
                                                        lineHeight: "1.5",
                                                        boxShadow: "0 2px 8px rgba(217, 119, 6, 0.2)"
                                                    }}>
                                                        {chatMessage.message}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    width: "34px",
                                                    height: "34px",
                                                    borderRadius: "50%",
                                                    background: "var(--primary)",
                                                    color: "#ffffff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontWeight: "800",
                                                    fontSize: "12px",
                                                    flexShrink: 0
                                                }}>
                                                    SA
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="chat-message-row customer-row">
                                                    <div className="message-avatar customer-avatar">
                                                        {getInitial(selectedConversation.customer_name)}
                                                    </div>
                                                    <div className="message-column">
                                                        <div className="message-meta">
                                                            <strong>{selectedConversation.customer_name}</strong>
                                                            <span>{formatTime(chatMessage.created_at)}</span>
                                                        </div>
                                                        <div className="message-bubble customer-bubble">
                                                            {chatMessage.message}
                                                        </div>
                                                    </div>
                                                </div>

                                                {chatMessage.reply && (
                                                    <div className="chat-message-row bot-row">
                                                        <div className="message-column bot-column">
                                                            <div className="message-meta bot-meta">
                                                                <span>{formatTime(chatMessage.created_at)}</span>
                                                                <strong>Auto Reply</strong>
                                                            </div>
                                                            <div className="message-bubble bot-bubble">
                                                                <Bot size={14} />
                                                                <span>{chatMessage.reply}</span>
                                                            </div>
                                                        </div>
                                                        <div className="message-avatar bot-avatar">
                                                            <Bot size={16} />
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}

                            </div>


                            {/* ==================================================
                  MESSAGE COMPOSER
              ================================================== */}

                            <form
                                className="message-composer"
                                onSubmit={handleSendMessage}
                            >

                                <div className="composer-box">

                                    {/* Sender Mode Switcher */}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "8px 14px",
                                        background: "var(--surface-soft)",
                                        borderBottom: "1px solid var(--border)",
                                        fontSize: "12px"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Mode:</span>
                                            <button
                                                type="button"
                                                onClick={() => setComposerSender("agent")}
                                                style={{
                                                    padding: "3px 10px",
                                                    borderRadius: "14px",
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    background: composerSender === "agent" ? "var(--primary)" : "transparent",
                                                    color: composerSender === "agent" ? "#ffffff" : "var(--text-secondary)",
                                                    border: `1px solid ${composerSender === "agent" ? "var(--primary)" : "var(--border)"}`,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                👤 Agent Reply (Human)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setComposerSender("customer")}
                                                style={{
                                                    padding: "3px 10px",
                                                    borderRadius: "14px",
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    background: composerSender === "customer" ? "var(--accent)" : "transparent",
                                                    color: composerSender === "customer" ? "#ffffff" : "var(--text-secondary)",
                                                    border: `1px solid ${composerSender === "customer" ? "var(--accent)" : "var(--border)"}`,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                🤖 Simulate Customer
                                            </button>
                                        </div>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                            {composerSender === "agent" ? "Marks as replied" : "Triggers bot rule"}
                                        </span>
                                    </div>

                                    <textarea
                                        value={message}
                                        onChange={event =>
                                            setMessage(
                                                event.target.value
                                            )
                                        }
                                        onKeyDown={
                                            handleMessageKeyDown
                                        }
                                        placeholder={composerSender === "agent" ? "Reply to customer as Support Agent..." : "Simulate customer message to test auto-reply..."}
                                        rows={1}
                                        disabled={sending}
                                    />


                                    <div className="composer-bottom">

                                        <span>
                                            Enter to send · Shift + Enter for new line
                                        </span>


                                        <button
                                            type="submit"
                                            className="send-message-button"
                                            disabled={
                                                sending ||
                                                !message.trim()
                                            }
                                        >

                                            {sending ? (

                                                <div className="send-spinner"></div>

                                            ) : (

                                                <Send size={17} />

                                            )}

                                        </button>

                                    </div>

                                </div>

                            </form>

                        </>

                    )}

                </main>

            </div>


            {/* ======================================================
          NEW CONVERSATION MODAL
      ====================================================== */}

            {showCreateForm && (

                <div className="modal-overlay">

                    <div className="modal">

                        <div className="modal-header">

                            <div>

                                <h3>
                                    New Conversation
                                </h3>

                                <p>
                                    Start a new customer conversation.
                                </p>

                            </div>


                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowCreateForm(false)
                                }
                            >

                                <X size={19} />

                            </button>

                        </div>


                        <form
                            className="modal-form"
                            onSubmit={
                                handleCreateConversation
                            }
                        >

                            <div className="form-group">

                                <label>
                                    Customer Name *
                                </label>

                                <input
                                    value={customerName}
                                    onChange={event =>
                                        setCustomerName(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Rahul Sharma"
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Customer Email
                                </label>

                                <input
                                    type="email"
                                    value={customerEmail}
                                    onChange={event =>
                                        setCustomerEmail(
                                            event.target.value
                                        )
                                    }
                                    placeholder="rahul@gmail.com"
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Customer Message *
                                </label>

                                <textarea
                                    value={message}
                                    onChange={event =>
                                        setMessage(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Hello, I need help with my order..."
                                    rows={5}
                                />

                            </div>


                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        setShowCreateForm(false)
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={sending}
                                >

                                    <Send size={15} />

                                    {sending
                                        ? "Sending..."
                                        : "Send Message"}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}