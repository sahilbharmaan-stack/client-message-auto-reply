# ============================================================
# FILE: analytics.py
# PURPOSE:
# Analytical reporting for conversation data from SQLite.
# Handles data frames safely with full compatibility for joined messages.
# ============================================================

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from backend.database import get_connection
except ImportError:
    from database import get_connection


# ============================================================
# GET CONVERSATION DATA
# ============================================================

def get_conversation_dataframe():
    connection = get_connection()

    query = """
        SELECT
            c.id,
            c.customer_name,
            c.customer_email,
            c.status,
            c.created_at,
            c.updated_at,
            m.message AS latest_message,
            m.reply AS latest_reply,
            m.sender AS latest_sender
        FROM conversations c
        LEFT JOIN messages m
            ON m.id = (
                SELECT id
                FROM messages
                WHERE conversation_id = c.id
                ORDER BY id DESC
                LIMIT 1
            )
        ORDER BY c.created_at ASC
    """

    if pd is not None:
        try:
            df = pd.read_sql_query(query, connection)
            connection.close()
            return df
        except Exception:
            pass

    # Fallback to sqlite rows if pandas fails
    cursor = connection.cursor()
    cursor.execute(query)
    rows = [dict(r) for r in cursor.fetchall()]
    connection.close()
    return rows


# ============================================================
# GET DASHBOARD STATISTICS
# ============================================================

def get_dashboard_stats():
    data = get_conversation_dataframe()

    if isinstance(data, list):
        total = len(data)
        if total == 0:
            return {
                "total_conversations": 0,
                "replied_conversations": 0,
                "pending_conversations": 0,
                "auto_reply_percentage": 0,
            }
        replied = sum(
            1 for c in data
            if (c.get("status") == "replied") or (c.get("latest_reply") and str(c.get("latest_reply")).strip())
        )
        pending = total - replied
        rate = round((replied / total) * 100, 2)
        return {
            "total_conversations": total,
            "replied_conversations": replied,
            "pending_conversations": pending,
            "auto_reply_percentage": rate,
        }

    # Pandas DataFrame path
    if data.empty:
        return {
            "total_conversations": 0,
            "replied_conversations": 0,
            "pending_conversations": 0,
            "auto_reply_percentage": 0,
        }

    total = len(data)
    has_reply = data["latest_reply"].fillna("").str.strip() != ""
    is_replied = (data["status"] == "replied") | has_reply
    replied = int(is_replied.sum())
    pending = total - replied
    auto_reply_percentage = round((replied / total) * 100, 2) if total else 0

    return {
        "total_conversations": total,
        "replied_conversations": replied,
        "pending_conversations": pending,
        "auto_reply_percentage": auto_reply_percentage,
    }


# ============================================================
# CONVERSATIONS BY DATE
# ============================================================

def get_daily_conversations():
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        SELECT
            DATE(created_at) AS date,
            COUNT(*) AS conversation_count
        FROM conversations
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
        """
    )
    rows = cursor.fetchall()
    connection.close()

    return [
        {
            "date": str(row["date"]),
            "conversation_count": int(row["conversation_count"])
        }
        for row in rows
        if row["date"] is not None
    ]