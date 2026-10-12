// ============================================================
// FILE: Dashboard.jsx
// PURPOSE:
// Main dashboard for Chat Auto Reply System.
// Shows:
// - Total conversations
// - Replied conversations
// - Pending conversations
// - Auto reply percentage
// - Daily conversation analytics
// ============================================================

import { useEffect, useState } from "react";

import {
    MessageCircle,
    Bot,
    Clock,
    Percent,
    RefreshCw,
    TrendingUp
} from "lucide-react";

import {
    getDashboardStats,
    getDailyAnalytics
} from "../services/api";


export default function Dashboard() {

    // ============================================================
    // STATE
    // ============================================================

    const [stats, setStats] = useState({
        total_conversations: 0,
        replied_conversations: 0,
        pending_conversations: 0,
        auto_reply_percentage: 0
    });

    const [dailyData, setDailyData] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // ============================================================
    // LOAD DASHBOARD DATA
    // ============================================================

    async function loadDashboard() {

        try {

            setLoading(true);

            setError("");

            const [
                dashboardStats,
                dailyAnalytics
            ] = await Promise.all([
                getDashboardStats(),
                getDailyAnalytics()
            ]);

            setStats(dashboardStats);

            setDailyData(dailyAnalytics);

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                "Unable to load dashboard data."
            );

        } finally {

            setLoading(false);

        }
    }


    // ============================================================
    // LOAD DATA WHEN PAGE OPENS
    // ============================================================

    useEffect(() => {

        loadDashboard();

    }, []);


    // ============================================================
    // FORMAT DATE
    // ============================================================

    function formatDate(dateString) {

        if (!dateString) {
            return "";
        }

        const date = new Date(dateString);

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short"
            }
        );
    }


    // ============================================================
    // GET MAXIMUM VALUE FOR CHART
    // ============================================================

    const maximumValue =
        dailyData.length > 0
            ? Math.max(
                ...dailyData.map(
                    item => item.conversation_count
                )
            )
            : 1;


    // ============================================================
    // UI
    // ============================================================

    return (

        <div>

            {/* ======================================================
          PAGE HEADER
      ====================================================== */}

            <div className="page-heading">

                <div>

                    <div className="eyebrow">
                        OVERVIEW
                    </div>

                    <h2>
                        Dashboard
                    </h2>

                    <p>
                        Monitor your customer conversations and
                        automatic replies.
                    </p>

                </div>


                <button
                    className="secondary-button"
                    onClick={loadDashboard}
                >

                    <RefreshCw size={16} />

                    Refresh

                </button>

            </div>


            {/* ======================================================
          ERROR
      ====================================================== */}

            {error && (

                <div className="error-banner">

                    <strong>
                        Dashboard Error
                    </strong>

                    <span>
                        {error}
                    </span>

                </div>

            )}


            {/* ======================================================
          LOADING
      ====================================================== */}

            {loading ? (

                <div className="dashboard-loading">

                    <div className="spinner"></div>

                    <p>
                        Loading dashboard...
                    </p>

                </div>

            ) : (

                <>

                    {/* ==================================================
              STAT CARDS
          ================================================== */}

                    <div className="stats-grid">


                        {/* TOTAL */}

                        <div className="stat-card">

                            <div className="stat-card-top">

                                <div className="stat-icon">
                                    <MessageCircle size={19} />
                                </div>

                            </div>

                            <div className="stat-value">
                                {stats.total_conversations}
                            </div>

                            <div className="stat-label">
                                Total Conversations
                            </div>

                        </div>


                        {/* REPLIED */}

                        <div className="stat-card">

                            <div className="stat-card-top">

                                <div className="stat-icon">
                                    <Bot size={19} />
                                </div>

                            </div>

                            <div className="stat-value">
                                {stats.replied_conversations}
                            </div>

                            <div className="stat-label">
                                Replied Conversations
                            </div>

                        </div>


                        {/* PENDING */}

                        <div className="stat-card">

                            <div className="stat-card-top">

                                <div className="stat-icon">
                                    <Clock size={19} />
                                </div>

                            </div>

                            <div className="stat-value">
                                {stats.pending_conversations}
                            </div>

                            <div className="stat-label">
                                Pending Conversations
                            </div>

                        </div>


                        {/* PERCENTAGE */}

                        <div className="stat-card">

                            <div className="stat-card-top">

                                <div className="stat-icon">
                                    <Percent size={19} />
                                </div>

                            </div>

                            <div className="stat-value">

                                {stats.auto_reply_percentage}%

                            </div>

                            <div className="stat-label">
                                Auto Reply Rate
                            </div>

                        </div>

                    </div>


                    {/* ==================================================
              DAILY ANALYTICS
          ================================================== */}

                    <div className="analytics-card">

                        <div className="analytics-header">

                            <div>

                                <div className="analytics-title">

                                    <TrendingUp size={17} />

                                    Daily Conversations

                                </div>

                                <p>
                                    Conversation volume over time
                                </p>

                            </div>

                        </div>


                        {dailyData.length === 0 ? (

                            <div className="analytics-empty">

                                <MessageCircle size={28} />

                                <p>
                                    No conversation data available yet.
                                </p>

                            </div>

                        ) : (

                            <div className="bar-chart">

                                {dailyData.map(item => {

                                    const height =
                                        (item.conversation_count /
                                            maximumValue) *
                                        100;

                                    return (

                                        <div
                                            className="chart-column"
                                            key={item.date}
                                        >

                                            <div className="chart-value">

                                                {item.conversation_count}

                                            </div>

                                            <div className="chart-bar-area">

                                                <div
                                                    className="chart-bar"
                                                    style={{
                                                        height: `${height}%`
                                                    }}
                                                />

                                            </div>

                                            <div className="chart-label">

                                                {formatDate(item.date)}

                                            </div>

                                        </div>

                                    );

                                })}

                            </div>

                        )}

                    </div>

                </>

            )}

        </div>

    );
}