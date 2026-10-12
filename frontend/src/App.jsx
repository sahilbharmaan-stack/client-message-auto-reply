// ============================================================
// FILE: App.jsx
// PURPOSE:
// Main application routing with ThemeProvider and AdminLayout.
// Connects full Admin Suite (Dashboard, Conversations, Rules,
// Quick Replies, Analytics, Settings) and Live Customer Portal.
// ============================================================

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import { ThemeProvider } from "./context/ThemeContext";
import AdminLayout from "./components/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";

import Dashboard from "./pages/Dashboard";
import Conversations from "./pages/Conversation";
import AutoReplyRules from "./pages/AutoReplyRules";
import AutoReplies from "./pages/AutoReplies";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

import CustomerChat from "./pages/customer/CustomerChat";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />

          {/* ==================================================
              ADMIN SUITE (Protected & Wrapped in AdminLayout)
          ================================================== */}
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/auto-reply-rules" element={<AutoReplyRules />} />
            <Route path="/auto-replies" element={<AutoReplies />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />

            {/* Admin URL aliases */}
            <Route path="/admin" element={<Navigate to="/" replace />} />
            <Route path="/admin/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/admin/conversations" element={<Navigate to="/conversations" replace />} />
            <Route path="/admin/auto-reply-rules" element={<Navigate to="/auto-reply-rules" replace />} />
          </Route>

          {/* ==================================================
              LIVE CUSTOMER CHAT PORTAL
          ================================================== */}
          <Route path="/customer" element={<CustomerChat />} />
          <Route path="/chat" element={<CustomerChat />} />

          {/* ==================================================
              FALLBACK ROUTE
          ================================================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}