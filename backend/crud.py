# ============================================================
# FILE: crud.py
# PURPOSE:
# Standard database CRUD operations for conversations & rules.
# ============================================================

from datetime import datetime
from typing import Optional, List, Dict, Any

try:
    from backend.database import get_connection
except ImportError:
    from database import get_connection


# ============================================================
# AUTO-REPLY RULES CRUD
# ============================================================

def create_auto_reply_rule(keyword: str, reply: str, active: bool = True) -> int:
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        INSERT INTO auto_reply_rules (keyword, reply, active, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        """,
        (keyword.lower().strip(), reply.strip(), int(active))
    )
    connection.commit()
    rule_id = cursor.lastrowid
    connection.close()
    return rule_id


def get_all_auto_reply_rules() -> List[Dict[str, Any]]:
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM auto_reply_rules ORDER BY id DESC")
    rules = [dict(r) for r in cursor.fetchall()]
    connection.close()
    return rules


def get_auto_reply_rule(rule_id: int) -> Optional[Dict[str, Any]]:
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM auto_reply_rules WHERE id = ?", (rule_id,))
    row = cursor.fetchone()
    connection.close()
    return dict(row) if row else None


def update_auto_reply_rule(rule_id: int, keyword: Optional[str] = None, reply: Optional[str] = None, active: Optional[bool] = None) -> bool:
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM auto_reply_rules WHERE id = ?", (rule_id,))
    existing = cursor.fetchone()
    if not existing:
        connection.close()
        return False

    k = keyword.lower().strip() if keyword is not None else existing["keyword"]
    r = reply.strip() if reply is not None else existing["reply"]
    a = int(active) if active is not None else existing["active"]

    cursor.execute(
        """
        UPDATE auto_reply_rules
        SET keyword = ?, reply = ?, active = ?
        WHERE id = ?
        """,
        (k, r, a, rule_id)
    )
    connection.commit()
    connection.close()
    return True


def delete_auto_reply_rule(rule_id: int) -> bool:
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("DELETE FROM auto_reply_rules WHERE id = ?", (rule_id,))
    connection.commit()
    rows_affected = cursor.rowcount
    connection.close()
    return rows_affected > 0


# ============================================================
# CONVERSATIONS CRUD
# ============================================================

def get_all_conversations(status: Optional[str] = None) -> List[Dict[str, Any]]:
    connection = get_connection()
    cursor = connection.cursor()
    query = "SELECT * FROM conversations"
    params = []
    if status and status != "all":
        query += " WHERE status = ?"
        params.append(status.lower())
    query += " ORDER BY updated_at DESC, id DESC"
    cursor.execute(query, tuple(params))
    rows = [dict(r) for r in cursor.fetchall()]
    connection.close()
    return rows


def get_conversation_by_id(conversation_id: int) -> Optional[Dict[str, Any]]:
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM conversations WHERE id = ?", (conversation_id,))
    row = cursor.fetchone()
    if not row:
        connection.close()
        return None
    conv = dict(row)
    cursor.execute("SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC", (conversation_id,))
    conv["messages"] = [dict(m) for m in cursor.fetchall()]
    connection.close()
    return conv


def delete_conversation_by_id(conversation_id: int) -> bool:
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
    cursor.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
    connection.commit()
    deleted = cursor.rowcount > 0
    connection.close()
    return deleted