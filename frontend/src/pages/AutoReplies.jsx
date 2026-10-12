// ============================================================
// FILE: AutoReplies.jsx
// PURPOSE:
// Manage automatic reply rules.
// ============================================================

import {
    useEffect,
    useState
} from "react";

import {
    Bot,
    Plus,
    Trash2,
    RefreshCw
} from "lucide-react";

import {
    getAutoReplyRules,
    createAutoReplyRule,
    deleteAutoReplyRule
} from "../services/api";


export default function AutoReplies() {

    const [rules, setRules] =
        useState([]);

    const [keyword, setKeyword] =
        useState("");

    const [reply, setReply] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // ==========================================================
    // LOAD RULES
    // ==========================================================

    async function loadRules() {

        try {

            setLoading(true);
            setError("");

            const data =
                await getAutoReplyRules();

            setRules(data.map(rule => ({
                ...rule,
                status: rule.active ? "active" : "inactive"
            })));

        } catch (error) {

            console.error(error);
            setError(error.message || "Unable to load auto-reply rules.");

        } finally {

            setLoading(false);

        }
    }


    useEffect(() => {

        loadRules();

    }, []);


    // ==========================================================
    // CREATE RULE
    // ==========================================================

    async function handleCreate(event) {

        event.preventDefault();

        if (!keyword.trim() ||
            !reply.trim()) {

            alert(
                "Please enter keyword and reply."
            );

            return;
        }


        try {

            const result =
                await createAutoReplyRule({
                    keyword,
                    reply
                });


            setRules(previous => [

                {
                    id: result.id,
                    keyword,
                    reply,
                    active: true,
                    status: "active"
                },

                ...previous

            ]);


            setKeyword("");
            setReply("");

        } catch (error) {

            alert(error.message);

        }
    }


    // ==========================================================
    // DELETE RULE
    // ==========================================================

    async function handleDelete(id) {

        if (
            !window.confirm(
                "Delete this auto-reply rule?"
            )
        ) {
            return;
        }


        try {

            await deleteAutoReplyRule(id);

            setRules(
                previous =>
                    previous.filter(
                        rule => rule.id !== id
                    )
            );

        } catch (error) {

            alert(error.message);

        }
    }


    return (
        <div>


            <div className="page-heading">

                <div>

                    <div className="eyebrow">
                        AUTOMATION
                    </div>

                    {error && (
                        <div className="error-banner">
                            <strong>Unable to load auto-reply rules</strong>
                            <span>{error}</span>
                        </div>
                    )}

                    <h2>
                        Auto Replies
                    </h2>

                    <p>
                        Create keyword-based automatic responses.
                    </p>

                </div>


                <button
                    className="secondary-button"
                    onClick={loadRules}
                >
                    <RefreshCw size={16} />

                    Refresh
                </button>

            </div>


            {/* ====================================================
          CREATE RULE
      ===================================================== */}

            <div className="dashboard-panel">

                <div className="panel-header">

                    <div>

                        <h3>
                            Create Auto Reply
                        </h3>

                        <p>
                            Add a keyword and the response
                            customers should receive.
                        </p>

                    </div>

                </div>


                <form
                    className="rule-form"
                    onSubmit={handleCreate}
                >

                    <div className="form-group">

                        <label>
                            Keyword
                        </label>

                        <input
                            value={keyword}
                            onChange={event =>
                                setKeyword(
                                    event.target.value
                                )
                            }
                            placeholder="Example: hello"
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Automatic Reply
                        </label>

                        <input
                            value={reply}
                            onChange={event =>
                                setReply(
                                    event.target.value
                                )
                            }
                            placeholder="Example: Hi! How can I help?"
                        />

                    </div>


                    <button
                        className="primary-button"
                        type="submit"
                    >
                        <Plus size={17} />

                        Add Rule
                    </button>

                </form>

            </div>


            {/* ====================================================
          RULES
      ===================================================== */}

            <div className="dashboard-panel rules-panel">

                <div className="panel-header">

                    <div>

                        <h3>
                            Active Rules
                        </h3>

                        <p>
                            Rules currently stored in SQLite.
                        </p>

                    </div>

                    <span className="count-badge">
                        {rules.filter(rule => rule.active).length}
                    </span>

                </div>


                {loading ? (

                    <div className="empty-state">
                        Loading rules...
                    </div>

                ) : rules.filter(rule => rule.active).length === 0 ? (

                    <div className="empty-state">

                        <Bot size={38} />

                        <h3>
                            No rules yet
                        </h3>

                        <p>
                            Create your first automatic reply rule.
                        </p>

                    </div>

                ) : (

                    <div className="rules-list">

                        {rules.filter(rule => rule.active).map(rule => (

                            <div
                                className="rule-row"
                                key={rule.id}
                            >

                                <div className="rule-icon">
                                    <Bot size={18} />
                                </div>


                                <div className="rule-content">

                                    <div>

                                        <span className="keyword-tag">
                                            {rule.keyword}
                                        </span>

                                        <span className="arrow">
                                            →
                                        </span>

                                    </div>

                                    <p>
                                        {rule.reply}
                                    </p>

                                </div>


                                <span className="active-tag">
                                    Active
                                </span>


                                <button
                                    className="delete-button"
                                    onClick={() =>
                                        handleDelete(rule.id)
                                    }
                                >
                                    <Trash2 size={17} />
                                </button>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>
    );
}