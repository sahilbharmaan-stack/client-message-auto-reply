// ============================================================
// FILE: Analytics.jsx
// PURPOSE:
// Displays Pandas-powered analytics from FastAPI.
// ============================================================

import {
    useEffect,
    useState
} from "react";

import {
    BarChart3,
    RefreshCw
} from "lucide-react";

import {
    getDashboardStats,
    getDailyAnalytics
} from "../services/api";


export default function Analytics() {

    const [stats, setStats] =
        useState(null);

    const [daily, setDaily] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // ==========================================================
    // LOAD ANALYTICS
    // ==========================================================

    async function loadAnalytics() {

        try {

            setLoading(true);
            setError("");

            const [
                dashboardData,
                dailyData
            ] = await Promise.all([
                getDashboardStats(),
                getDailyAnalytics()
            ]);

            setStats(dashboardData);
            setDaily(dailyData);

        } catch (error) {

            console.error(error);
            setError(error.message || "Unable to load analytics.");

        } finally {

            setLoading(false);

        }
    }


    useEffect(() => {

        loadAnalytics();

    }, []);


    if (loading) {

        return (
            <div className="loading-screen">

                <div className="spinner"></div>

                <p>
                    Loading analytics...
                </p>

            </div>
        );
    }


    return (
        <div>


            <div className="page-heading">

                <div>

                    <div className="eyebrow">
                        DATA & INSIGHTS
                    </div>

                    {error && (
                        <div className="error-banner">
                            <strong>Unable to load analytics</strong>
                            <span>{error}</span>
                        </div>
                    )}

                    <h2>
                        Analytics
                    </h2>

                    <p>
                        Conversation analytics powered by Pandas.
                    </p>

                </div>


                <button
                    className="secondary-button"
                    onClick={loadAnalytics}
                >
                    <RefreshCw size={16} />

                    Refresh
                </button>

            </div>


            {/* ====================================================
          SUMMARY
      ===================================================== */}

            <div className="analytics-summary">

                <div className="analytics-card">

                    <span>
                        Conversations
                    </span>

                    <strong>
                        {stats?.total_conversations ?? 0}
                    </strong>

                </div>


                <div className="analytics-card">

                    <span>
                        Replied
                    </span>

                    <strong>
                        {stats?.replied_conversations ?? 0}
                    </strong>

                </div>


                <div className="analytics-card">

                    <span>
                        Pending
                    </span>

                    <strong>
                        {stats?.pending_conversations ?? 0}
                    </strong>

                </div>


                <div className="analytics-card">

                    <span>
                        Auto Reply Rate
                    </span>

                    <strong>
                        {stats?.auto_reply_percentage ?? 0}%
                    </strong>

                </div>

            </div>


            {/* ====================================================
          DAILY DATA
      ===================================================== */}

            <div className="dashboard-panel">

                <div className="panel-header">

                    <div>

                        <h3>
                            Daily Conversations
                        </h3>

                        <p>
                            Conversations grouped by date.
                        </p>

                    </div>

                    <BarChart3 size={21} />

                </div>


                {daily.length === 0 ? (

                    <div className="empty-state">

                        <BarChart3 size={38} />

                        <h3>
                            No analytics data
                        </h3>

                        <p>
                            Create conversations to generate analytics.
                        </p>

                    </div>

                ) : (

                    <div className="daily-list">

                        {daily.map(item => (

                            <div
                                className="daily-row"
                                key={item.date}
                            >

                                <span>
                                    {item.date}
                                </span>

                                <div className="bar-container">

                                    <div
                                        className="bar"
                                        style={{
                                            width: `${Math.min(
                                                item.conversation_count * 10,
                                                100
                                            )}%`
                                        }}
                                    />

                                </div>

                                <strong>
                                    {item.conversation_count}
                                </strong>

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>
    );
}