// ============================================================
// FILE: AutoReplyRules.jsx
// PURPOSE:
// Admin page for managing Auto Reply Rules.
// ============================================================

import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

export default function AutoReplyRules() {

    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);

    // ==========================================================
    // LOAD RULES
    // ==========================================================

    async function loadRules() {

        try {

            setLoading(true);

            const response = await fetch(
                `${API_URL}/auto-reply-rules`
            );

            if (!response.ok) {
                throw new Error("Failed to load rules");
            }

            const data = await response.json();

            setRules(data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }
    }


    // ==========================================================
    // LOAD ON PAGE OPEN
    // ==========================================================

    useEffect(() => {

        loadRules();

    }, []);


    // ==========================================================
    // DELETE RULE
    // ==========================================================

    async function deleteRule(id) {

        const confirmed =
            window.confirm(
                "Delete this auto reply rule?"
            );

        if (!confirmed) {
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}/auto-reply-rules/${id}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete rule");
            }

            loadRules();

        } catch (error) {

            console.error(error);

            alert("Failed to delete rule.");

        }
    }


    // ==========================================================
    // UI
    // ==========================================================

    return (

        <div style={{
            padding: "32px"
        }}>

            <h1>
                Auto Reply Rules
            </h1>

            <p>
                Manage automatic customer replies.
            </p>


            {loading ? (

                <p>
                    Loading rules...
                </p>

            ) : rules.length === 0 ? (

                <p>
                    No auto reply rules found.
                </p>

            ) : (

                <div style={{
                    marginTop: "24px"
                }}>

                    {rules.map((rule) => (

                        <div
                            key={rule.id}
                            style={{
                                padding: "16px",
                                marginBottom: "12px",
                                border: "1px solid #ddd",
                                borderRadius: "10px"
                            }}
                        >

                            <strong>
                                {rule.keyword}
                            </strong>

                            <p>
                                {rule.reply}
                            </p>

                            <small>
                                Status:{" "}
                                {rule.active
                                    ? "Active"
                                    : "Inactive"
                                }
                            </small>


                            <br />


                            <button
                                onClick={() =>
                                    deleteRule(rule.id)
                                }
                                style={{
                                    marginTop: "10px"
                                }}
                            >
                                Delete
                            </button>

                        </div>

                    ))}

                </div>

            )}

        </div>

    );
}