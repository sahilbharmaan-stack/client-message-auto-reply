// ============================================================
// FILE: api.js
// PURPOSE:
// Central API service for the entire React application.
// Connects to FastAPI backend via Vite proxy (/api) or direct host.
// ============================================================

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "/api" : "");

// Auth token storage key
const TOKEN_KEY = "autoreply_admin_token";

export function getStoredToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        localStorage.removeItem(TOKEN_KEY);
    }
}

// ============================================================
// GENERIC API REQUEST
// ============================================================

async function request(endpoint, options = {}) {
    const token = getStoredToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error(
                "Could not connect to the API. Check VITE_API_BASE_URL and make sure the API service is running."
            );
        }
        throw error;
    }

    if (!response.ok) {
        if (response.status === 401 && token) {
            setStoredToken(null);
            window.dispatchEvent(new Event("admin-auth-expired"));
        }

        const contentType = response.headers.get("content-type") || "";
        let message = `API Error: ${response.status}`;

        if (contentType.includes("application/json")) {
            try {
                const errorData = await response.json();
                message = errorData.detail || errorData.message || message;
            } catch {
                // Keep default message
            }
        } else {
            const text = await response.text().catch(() => "");
            if (text) message = text.slice(0, 150);
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/csv")) {
        return response.blob();
    }

    if (!contentType.includes("application/json")) {
        return response.text();
    }

    return response.json();
}


// ============================================================
// AUTHENTICATION
// ============================================================

export async function loginAdmin(email, password) {
    const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
    if (data?.access_token) {
        setStoredToken(data.access_token);
    }
    return data;
}

export function logoutAdmin() {
    setStoredToken(null);
}


// ============================================================
// CONVERSATIONS
// ============================================================

export function getConversations(status = "all", search = "") {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status);
    if (search && search.trim()) params.append("search", search.trim());
    const query = params.toString() ? `?${params.toString()}` : "";
    return request(`/conversations${query}`);
}

export function getConversation(id) {
    return request(`/conversations/${id}`);
}

export function createConversation(data) {
    return request("/conversations", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

export function sendConversationMessage(id, message, sender = "customer") {
    return request(`/conversations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message, sender })
    });
}

export function sendAgentReply(id, message) {
    return request(`/conversations/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({ message })
    });
}

export function updateConversation(id, data) {
    return request(`/conversations/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

export function deleteConversation(id) {
    return request(`/conversations/${id}`, {
        method: "DELETE"
    });
}


// ============================================================
// AUTO REPLY RULES
// ============================================================

export function getAutoReplyRules() {
    return request("/auto-reply-rules");
}

export function createAutoReplyRule(data) {
    return request("/auto-reply-rules", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

export function updateAutoReplyRule(id, data) {
    return request(`/auto-reply-rules/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

export function deleteAutoReplyRule(id) {
    return request(`/auto-reply-rules/${id}`, {
        method: "DELETE"
    });
}

export function testAutoReply(message) {
    return request("/test-auto-reply", {
        method: "POST",
        body: JSON.stringify({ message })
    });
}


// ============================================================
// ANALYTICS
// ============================================================

export function getDashboardStats() {
    return request("/analytics/dashboard");
}

export function getDailyAnalytics() {
    return request("/analytics/daily");
}


// ============================================================
// DEMO SEEDING & EXPORT
// ============================================================

export function seedDemoData() {
    return request("/seed", { method: "POST" });
}

export function resetAndReseedData() {
    return request("/seed/reset", { method: "POST" });
}

export const API_BASE = API_BASE_URL;

export async function exportConversations() {
    const blob = await request("/conversations/export");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "conversations_export.csv";
    link.click();
    URL.revokeObjectURL(url);
}