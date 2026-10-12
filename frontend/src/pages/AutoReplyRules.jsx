// ============================================================
// FILE: AutoReplyRules.jsx
// PURPOSE:
// Complete Auto-Reply Engine configuration interface:
// - Interactive Real-Time Tester Playground
// - Keyword search & filtering
// - Add / Edit modal with active toggle
// - Delete confirmation
// - Priority word boundary matching overview
// ============================================================

import { useEffect, useState, useMemo } from "react";
import {
    Plus,
    RefreshCw,
    Edit,
    Trash2,
    X,
    Save,
    Search,
    Zap,
    CheckCircle2,
    HelpCircle
} from "lucide-react";

import {
    getAutoReplyRules,
    createAutoReplyRule,
    updateAutoReplyRule,
    deleteAutoReplyRule,
    testAutoReply
} from "../services/api";

export default function AutoReplyRules() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [keyword, setKeyword] = useState("");
    const [reply, setReply] = useState("");
    const [status, setStatus] = useState("active");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Interactive Playground State
    const [testInput, setTestInput] = useState("");
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // ============================================================
    // LOAD RULES
    // ============================================================
    async function loadRules() {
        try {
            setLoading(true);
            setError("");
            const data = await getAutoReplyRules();
            setRules(data.map(rule => ({
                ...rule,
                status: rule.active ? "active" : "inactive"
            })));
        } catch (err) {
            console.error(err);
            setError(err.message || "Unable to load auto-reply rules.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadRules();
    }, []);

    // Filtered rules
    const filteredRules = useMemo(() => {
        if (!searchQuery.trim()) return rules;
        const q = searchQuery.toLowerCase().trim();
        return rules.filter(r =>
            r.keyword.toLowerCase().includes(q) ||
            r.reply.toLowerCase().includes(q)
        );
    }, [rules, searchQuery]);

    // ============================================================
    // MODAL HANDLERS
    // ============================================================
    function handleCreate() {
        setEditingRule(null);
        setKeyword("");
        setReply("");
        setStatus("active");
        setShowModal(true);
    }

    function handleEdit(rule) {
        setEditingRule(rule);
        setKeyword(rule.keyword);
        setReply(rule.reply);
        setStatus(rule.active ? "active" : "inactive");
        setShowModal(true);
    }

    function closeModal() {
        if (saving) return;
        setShowModal(false);
        setEditingRule(null);
        setKeyword("");
        setReply("");
        setStatus("active");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!keyword.trim()) {
            alert("Please enter a keyword or phrase.");
            return;
        }
        if (!reply.trim()) {
            alert("Please enter an automatic reply.");
            return;
        }

        try {
            setSaving(true);
            if (editingRule) {
                await updateAutoReplyRule(editingRule.id, {
                    keyword: keyword.trim(),
                    reply: reply.trim(),
                    active: status === "active"
                });
            } else {
                await createAutoReplyRule({
                    keyword: keyword.trim(),
                    reply: reply.trim(),
                    active: status === "active"
                });
            }
            await loadRules();
            closeModal();
        } catch (err) {
            console.error(err);
            alert(err.message || "Failed to save rule.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("Are you sure you want to delete this auto-reply rule?")) return;
        try {
            await deleteAutoReplyRule(id);
            setRules(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error(err);
            alert(err.message || "Failed to delete rule.");
        }
    }

    async function handleToggleStatus(rule) {
        const nextStatus = rule.status === "active" ? "inactive" : "active";
        try {
            await updateAutoReplyRule(rule.id, {
                active: nextStatus === "active"
            });
            setRules(prev =>
                prev.map(item =>
                    item.id === rule.id
                        ? { ...item, status: nextStatus, active: nextStatus === "active" }
                        : item
                )
            );
        } catch (err) {
            console.error(err);
            alert("Unable to update rule status.");
        }
    }

    // ============================================================
    // TEST SIMULATOR
    // ============================================================
    async function handleTest(e) {
        if (e) e.preventDefault();
        if (!testInput.trim()) return;

        try {
            setTesting(true);
            const res = await testAutoReply(testInput.trim());
            setTestResult(res);
        } catch (err) {
            console.error(err);
            alert("Failed to test rule: " + (err.message || "Unknown error"));
        } finally {
            setTesting(false);
        }
    }

    function formatDate(dateString) {
        if (!dateString) return "";
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return dateString;
        }
    }

    return (
        <div className="rules-page">
            {/* Header */}
            <div className="page-heading">
                <div>
                    <div className="eyebrow">AUTOMATION SUITE</div>
                    <h2>Auto-Reply Rules</h2>
                    <p>Configure keywords and intelligent automatic answers for customer inquiries.</p>
                </div>
                <div className="heading-actions">
                    <button className="secondary-button" onClick={loadRules} title="Reload rules">
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    <button className="primary-button" onClick={handleCreate}>
                        <Plus size={16} />
                        Add New Rule
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-banner">
                    <strong>Unable to load rules: </strong>
                    <span>{error}</span>
                </div>
            )}

            {/* ======================================================
                INTERACTIVE TESTING PLAYGROUND
            ====================================================== */}
            <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "20px 24px",
                marginBottom: "24px",
                boxShadow: "var(--shadow-sm)"
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                            width: "28px", height: "28px", borderRadius: "8px",
                            background: "var(--primary-soft)", color: "var(--primary)",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <Zap size={16} />
                        </div>
                        <div>
                            <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                                Live Auto-Reply Simulator
                            </strong>
                            <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>
                                Test any message in real time to verify which keyword triggers and review the resulting response.
                            </span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleTest} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                        type="text"
                        placeholder="Type a sample customer question (e.g. 'Can you tell me your pricing options?')"
                        value={testInput}
                        onChange={e => setTestInput(e.target.value)}
                        style={{
                            flex: 1,
                            height: "42px",
                            padding: "0 14px",
                            background: "var(--surface-soft)",
                            border: "1px solid var(--border)",
                            borderRadius: "10px",
                            color: "var(--text-primary)",
                            fontSize: "13.5px"
                        }}
                    />
                    <button
                        type="submit"
                        className="amber-button"
                        disabled={testing || !testInput.trim()}
                        style={{ height: "42px", padding: "0 20px" }}
                    >
                        {testing ? "Testing…" : "Test Rule ⚡"}
                    </button>
                </form>

                {testResult && (
                    <div style={{
                        marginTop: "16px",
                        padding: "14px 18px",
                        background: testResult.matched ? "var(--primary-soft)" : "var(--surface-soft)",
                        border: `1px solid ${testResult.matched ? "var(--primary-border)" : "var(--border)"}`,
                        borderRadius: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                color: testResult.matched ? "var(--primary-dark)" : "var(--text-secondary)",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}>
                                {testResult.matched ? (
                                    <>
                                        <CheckCircle2 size={15} color="var(--success)" />
                                        MATCH FOUND · Keyword: "{testResult.matched_keyword}" ({testResult.match_type})
                                    </>
                                ) : (
                                    <>
                                        <HelpCircle size={15} color="var(--text-muted)" />
                                        NO KEYWORD MATCHED · Using Default Fallback Reply
                                    </>
                                )}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>
                                Rule #{testResult.rule_id || "Fallback"}
                            </span>
                        </div>
                        <div style={{
                            fontSize: "13.5px",
                            color: "var(--text-primary)",
                            marginTop: "2px",
                            fontWeight: "500",
                            lineHeight: "1.5"
                        }}>
                            "{testResult.reply}"
                        </div>
                    </div>
                )}
            </div>

            {/* ======================================================
                RULES LIST / TABLE
            ====================================================== */}
            <div className="rules-container">
                <div className="rules-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <strong>Configured Rules</strong>
                        <span>{filteredRules.length} of {rules.length} total</span>
                    </div>
                    <div style={{ position: "relative", width: "260px" }}>
                        <Search size={15} style={{ position: "absolute", left: "10px", top: "12px", color: "var(--text-muted)" }} />
                        <input
                            type="text"
                            placeholder="Filter by keyword or reply…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%",
                                height: "36px",
                                paddingLeft: "32px",
                                paddingRight: "10px",
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                                fontSize: "12.5px",
                                color: "var(--text-primary)"
                            }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="rules-loading">
                        <div className="loading-spinner" />
                        <p>Loading rules…</p>
                    </div>
                ) : filteredRules.length === 0 ? (
                    <div className="rules-empty">
                        <p>{searchQuery ? "No rules match your search filter." : "No auto-reply rules configured yet."}</p>
                    </div>
                ) : (
                    <div className="rules-table-wrapper">
                        <table className="rules-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>KEYWORD / PHRASE</th>
                                    <th>AUTOMATIC REPLY</th>
                                    <th>STATUS</th>
                                    <th>CREATED</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRules.map(rule => (
                                    <tr key={rule.id}>
                                        <td>#{rule.id}</td>
                                        <td>
                                            <span className="keyword-badge">
                                                {rule.keyword}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="rule-reply" title={rule.reply}>
                                                {rule.reply}
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                className={`rule-status ${rule.status === "active" ? "active" : "inactive"}`}
                                                onClick={() => handleToggleStatus(rule)}
                                                title="Click to toggle active state"
                                            >
                                                <span className="status-dot" />
                                                {rule.status}
                                            </button>
                                        </td>
                                        <td>
                                            <span className="date-text">
                                                {formatDate(rule.created_at)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="rule-actions">
                                                <button
                                                    className="icon-button edit"
                                                    onClick={() => handleEdit(rule)}
                                                    title="Edit rule"
                                                >
                                                    <Edit size={15} />
                                                </button>
                                                <button
                                                    className="icon-button delete"
                                                    onClick={() => handleDelete(rule.id)}
                                                    title="Delete rule"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ======================================================
                ADD / EDIT MODAL
            ====================================================== */}
            {showModal && (
                <div className="modal-overlay" onClick={() => closeModal()}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>{editingRule ? "Edit Auto-Reply Rule" : "Create Auto-Reply Rule"}</h3>
                                <p>Set up automatic replies triggered by incoming customer keywords.</p>
                            </div>
                            <button className="modal-close-btn" onClick={() => closeModal()}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Trigger Keyword or Phrase *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. pricing, refund, order, shipping"
                                        value={keyword}
                                        onChange={e => setKeyword(e.target.value)}
                                        required
                                    />
                                    <small style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px", display: "block" }}>
                                        Matches case-insensitively using smart word boundaries.
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label>Automated Response Message *</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Enter the message sent immediately to the customer..."
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Rule Status</label>
                                    <select
                                        value={status}
                                        onChange={e => setStatus(e.target.value)}
                                    >
                                        <option value="active">Active (Replies enabled)</option>
                                        <option value="inactive">Inactive (Paused)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="secondary-button" onClick={() => closeModal()}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-button" disabled={saving}>
                                    <Save size={15} />
                                    {saving ? "Saving…" : editingRule ? "Save Changes" : "Create Rule"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}