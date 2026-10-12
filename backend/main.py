# ============================================================
# FILE: main.py
# PURPOSE:
# Main FastAPI application for Customer Message Auto Reply.
# ============================================================

import csv
import os
from io import StringIO
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

try:
    from backend.auth import verify_token
    from backend.database import get_connection, init_database, seed_default_rules
    from backend.schemas import (
        ConversationCreate,
        ConversationUpdate,
        MessageCreate,
        AgentReplyCreate,
        AutoReplyRuleCreate,
        AutoReplyRuleUpdate,
        ChatMessage,
    )
    from backend.auto_reply import (
        find_auto_reply,
        match_auto_reply_detail,
        DEFAULT_REPLY,
    )
    from backend.routers.auth import router as auth_router
    from backend.analytics import get_dashboard_stats as calc_dashboard_stats, get_daily_conversations
except ImportError:
    from auth import verify_token
    from database import get_connection, init_database, seed_default_rules
    from schemas import (
        ConversationCreate,
        ConversationUpdate,
        MessageCreate,
        AgentReplyCreate,
        AutoReplyRuleCreate,
        AutoReplyRuleUpdate,
        ChatMessage,
    )
    from auto_reply import (
        find_auto_reply,
        match_auto_reply_detail,
        DEFAULT_REPLY,
    )
    from routers.auth import router as auth_router
    from analytics import get_dashboard_stats as calc_dashboard_stats, get_daily_conversations


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="Customer Message Auto Reply API",
    description="Automated customer service inbox and rule engine",
    version="2.0.0",
)

# Mount authentication router
app.include_router(auth_router)

admin_bearer = HTTPBearer(auto_error=False)


def _verify_admin_credentials(
    credentials: Optional[HTTPAuthorizationCredentials],
):
    token_data = verify_token(credentials.credentials if credentials else "")
    if not token_data or token_data.get("role") != "admin":
        raise HTTPException(
            status_code=401,
            detail="A valid admin login is required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data


def require_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(admin_bearer),
):
    return _verify_admin_credentials(credentials)


# ============================================================
# CORS MIDDLEWARE
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# STARTUP EVENT
# ============================================================

@app.on_event("startup")
def startup():
    init_database()
    seed_default_rules()


# ============================================================
# ROOT & HEALTH
# ============================================================

@app.get("/")
def root():
    if os.environ.get("VERCEL"):
        return RedirectResponse(url="/login")
    return {
        "message": "Customer Message Auto Reply API is running",
        "version": "2.0.0",
        "status": "ok",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# ============================================================
# CONVERSATIONS - LIST ALL
# ============================================================

@app.get("/conversations", dependencies=[Depends(require_admin)])
def get_conversations(status: Optional[str] = None, search: Optional[str] = None):
    connection = get_connection()
    cursor = connection.cursor()

    query = """
        SELECT
            c.id,
            c.customer_name,
            c.customer_email,
            c.status,
            c.created_at,
            c.updated_at,
            m.message,
            m.reply,
            m.sender,
            m.created_at AS message_created_at
        FROM conversations c
        LEFT JOIN messages m
            ON m.id = (
                SELECT id
                FROM messages
                WHERE conversation_id = c.id
                ORDER BY id DESC
                LIMIT 1
            )
    """
    conditions = []
    params = []

    if status and status.lower() != "all":
        conditions.append("c.status = ?")
        params.append(status.lower())

    if search:
        search_term = f"%{search.strip().lower()}%"
        conditions.append("(LOWER(c.customer_name) LIKE ? OR LOWER(COALESCE(c.customer_email, '')) LIKE ? OR LOWER(COALESCE(m.message, '')) LIKE ?)")
        params.extend([search_term, search_term, search_term])

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY c.updated_at DESC, c.id DESC"

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    connection.close()

    return [dict(row) for row in rows]


# ============================================================
# CONVERSATIONS - EXPORT AS CSV
# ============================================================

@app.get("/conversations/export", dependencies=[Depends(require_admin)])
def export_conversations():
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        SELECT
            c.id,
            c.customer_name,
            c.customer_email,
            c.status,
            c.created_at,
            c.updated_at,
            m.message,
            m.reply
        FROM conversations c
        LEFT JOIN messages m
            ON m.id = (
                SELECT id
                FROM messages
                WHERE conversation_id = c.id
                ORDER BY id DESC
                LIMIT 1
            )
        ORDER BY c.updated_at DESC, c.id DESC
        """
    )
    rows = cursor.fetchall()
    connection.close()

    output = StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(
        [
            "ID",
            "Customer Name",
            "Customer Email",
            "Status",
            "Created At",
            "Updated At",
            "Latest Message",
            "Latest Reply",
        ]
    )
    for row in rows:
        writer.writerow(
            [
                row["id"],
                row["customer_name"],
                row["customer_email"] or "",
                row["status"],
                row["created_at"],
                row["updated_at"],
                row["message"] or "",
                row["reply"] or "",
            ]
        )

    return Response(
        content=output.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="conversations_export.csv"'},
    )


# ============================================================
# CONVERSATION - GET SINGLE DETAILS
# ============================================================

@app.get("/conversations/{conversation_id}", dependencies=[Depends(require_admin)])
def get_conversation(conversation_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT id, customer_name, customer_email, status, created_at, updated_at
        FROM conversations
        WHERE id = ?
        """,
        (conversation_id,),
    )
    conversation = cursor.fetchone()

    if conversation is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Conversation not found")

    cursor.execute(
        """
        SELECT id, conversation_id, sender, message, reply, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY id ASC
        """,
        (conversation_id,),
    )
    messages = cursor.fetchall()
    connection.close()

    return {
        "id": conversation["id"],
        "customer_name": conversation["customer_name"],
        "customer_email": conversation["customer_email"],
        "status": conversation["status"],
        "created_at": conversation["created_at"],
        "updated_at": conversation["updated_at"],
        "messages": [dict(m) for m in messages],
    }


# ============================================================
# CONVERSATIONS - CREATE OR RE-OPEN
# ============================================================

@app.post("/conversations")
def create_conversation(data: ConversationCreate):
    connection = get_connection()
    cursor = connection.cursor()

    conversation = None

    # Check for existing customer conversation by email
    if data.customer_email:
        cursor.execute(
            """
            SELECT * FROM conversations
            WHERE customer_email = ?
            ORDER BY id DESC LIMIT 1
            """,
            (data.customer_email.strip(),),
        )
        conversation = cursor.fetchone()

    # Fallback to customer name match
    if conversation is None:
        cursor.execute(
            """
            SELECT * FROM conversations
            WHERE customer_name = ?
            ORDER BY id DESC LIMIT 1
            """,
            (data.customer_name.strip(),),
        )
        conversation = cursor.fetchone()

    match_result = match_auto_reply_detail(data.message)
    reply = match_result["reply"]

    if conversation is None:
        cursor.execute(
            """
            INSERT INTO conversations (customer_name, customer_email, status)
            VALUES (?, ?, 'active')
            """,
            (
                data.customer_name.strip(),
                data.customer_email.strip() if data.customer_email else None,
            ),
        )
        conversation_id = cursor.lastrowid
    else:
        conversation_id = conversation["id"]
        cursor.execute(
            """
            UPDATE conversations
            SET customer_name = ?,
                customer_email = ?,
                updated_at = CURRENT_TIMESTAMP,
                status = 'active'
            WHERE id = ?
            """,
            (
                data.customer_name.strip(),
                data.customer_email.strip() if data.customer_email else conversation["customer_email"],
                conversation_id,
            ),
        )

    # Save customer message & auto reply
    cursor.execute(
        """
        INSERT INTO messages (conversation_id, sender, message, reply)
        VALUES (?, 'customer', ?, ?)
        """,
        (conversation_id, data.message.strip(), reply),
    )
    message_id = cursor.lastrowid

    cursor.execute(
        "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (conversation_id,),
    )
    connection.commit()
    connection.close()

    return {
        "conversation_id": conversation_id,
        "message_id": message_id,
        "customer_name": data.customer_name,
        "customer_email": data.customer_email,
        "message": data.message,
        "reply": reply,
        "match_type": match_result["match_type"],
        "matched_keyword": match_result["keyword"],
        "status": "replied",
    }


# ============================================================
# SEND MESSAGE TO CONVERSATION
# Handles both customer message (triggers bot) & agent message
# ============================================================

@app.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: int,
    data: MessageCreate,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(admin_bearer),
):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM conversations WHERE id = ?",
        (conversation_id,),
    )
    conversation = cursor.fetchone()
    if conversation is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Conversation not found")

    sender = (data.sender or "customer").lower()

    if sender in ["agent", "admin", "support"]:
        _verify_admin_credentials(credentials)
        # Manual agent reply: no bot trigger, mark as replied
        cursor.execute(
            """
            INSERT INTO messages (conversation_id, sender, message, reply)
            VALUES (?, 'agent', ?, NULL)
            """,
            (conversation_id, data.message.strip()),
        )
        message_id = cursor.lastrowid
        cursor.execute(
            """
            UPDATE conversations
            SET updated_at = CURRENT_TIMESTAMP, status = 'replied'
            WHERE id = ?
            """,
            (conversation_id,),
        )
        connection.commit()
        connection.close()

        return {
            "conversation_id": conversation_id,
            "message_id": message_id,
            "sender": "agent",
            "message": data.message.strip(),
            "reply": None,
        }

    # Customer message: compute auto reply
    match_result = match_auto_reply_detail(data.message)
    reply = match_result["reply"]

    cursor.execute(
        """
        INSERT INTO messages (conversation_id, sender, message, reply)
        VALUES (?, 'customer', ?, ?)
        """,
        (conversation_id, data.message.strip(), reply),
    )
    message_id = cursor.lastrowid

    cursor.execute(
        """
        UPDATE conversations
        SET updated_at = CURRENT_TIMESTAMP, status = 'active'
        WHERE id = ?
        """,
        (conversation_id,),
    )
    connection.commit()
    connection.close()

    return {
        "conversation_id": conversation_id,
        "message_id": message_id,
        "sender": "customer",
        "message": data.message.strip(),
        "reply": reply,
        "match_type": match_result["match_type"],
        "matched_keyword": match_result["keyword"],
    }


# ============================================================
# AGENT DIRECT MANUAL REPLY
# ============================================================

@app.post(
    "/conversations/{conversation_id}/reply",
    dependencies=[Depends(require_admin)],
)
def reply_as_agent(conversation_id: int, data: AgentReplyCreate):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM conversations WHERE id = ?",
        (conversation_id,),
    )
    conversation = cursor.fetchone()
    if conversation is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Conversation not found")

    cursor.execute(
        """
        INSERT INTO messages (conversation_id, sender, message, reply)
        VALUES (?, 'agent', ?, NULL)
        """,
        (conversation_id, data.message.strip()),
    )
    message_id = cursor.lastrowid

    cursor.execute(
        """
        UPDATE conversations
        SET updated_at = CURRENT_TIMESTAMP, status = 'replied'
        WHERE id = ?
        """,
        (conversation_id,),
    )
    connection.commit()
    connection.close()

    return {
        "conversation_id": conversation_id,
        "message_id": message_id,
        "sender": "agent",
        "message": data.message.strip(),
        "status": "replied",
    }


# ============================================================
# UPDATE CONVERSATION (Status, details)
# ============================================================

@app.put(
    "/conversations/{conversation_id}",
    dependencies=[Depends(require_admin)],
)
def update_conversation(conversation_id: int, data: ConversationUpdate):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM conversations WHERE id = ?",
        (conversation_id,),
    )
    existing = cursor.fetchone()
    if existing is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Conversation not found")

    customer_name = data.customer_name if data.customer_name is not None else existing["customer_name"]
    customer_email = data.customer_email if data.customer_email is not None else existing["customer_email"]
    status = data.status.lower() if data.status is not None else existing["status"]

    cursor.execute(
        """
        UPDATE conversations
        SET customer_name = ?, customer_email = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (customer_name, customer_email, status, conversation_id),
    )
    connection.commit()
    connection.close()

    return {
        "id": conversation_id,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "status": status,
    }


# ============================================================
# DELETE CONVERSATION
# ============================================================

@app.delete(
    "/conversations/{conversation_id}",
    dependencies=[Depends(require_admin)],
)
def delete_conversation(conversation_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT id FROM conversations WHERE id = ?",
        (conversation_id,),
    )
    if cursor.fetchone() is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Conversation not found")

    cursor.execute(
        "DELETE FROM messages WHERE conversation_id = ?",
        (conversation_id,),
    )
    cursor.execute(
        "DELETE FROM conversations WHERE id = ?",
        (conversation_id,),
    )
    connection.commit()
    connection.close()

    return {"message": "Conversation deleted successfully", "id": conversation_id}


# ============================================================
# AUTO REPLY RULES CRUD
# ============================================================

@app.get("/auto-reply-rules", dependencies=[Depends(require_admin)])
def get_auto_reply_rules():
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        SELECT id, keyword, reply, active, created_at
        FROM auto_reply_rules
        ORDER BY id DESC
        """
    )
    rows = cursor.fetchall()
    connection.close()
    return [dict(row) for row in rows]


@app.post("/auto-reply-rules", dependencies=[Depends(require_admin)])
def create_auto_reply_rule(data: AutoReplyRuleCreate):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute(
        """
        INSERT INTO auto_reply_rules (keyword, reply, active)
        VALUES (?, ?, ?)
        """,
        (data.keyword.strip(), data.reply.strip(), int(data.active)),
    )
    connection.commit()
    rule_id = cursor.lastrowid
    connection.close()

    return {
        "id": rule_id,
        "keyword": data.keyword.strip(),
        "reply": data.reply.strip(),
        "active": data.active,
    }


@app.put(
    "/auto-reply-rules/{rule_id}",
    dependencies=[Depends(require_admin)],
)
def update_auto_reply_rule(rule_id: int, data: AutoReplyRuleUpdate):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM auto_reply_rules WHERE id = ?", (rule_id,))
    existing = cursor.fetchone()
    if existing is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Auto reply rule not found")

    keyword = data.keyword.strip() if data.keyword is not None else existing["keyword"]
    reply = data.reply.strip() if data.reply is not None else existing["reply"]
    active = int(data.active) if data.active is not None else existing["active"]

    cursor.execute(
        """
        UPDATE auto_reply_rules
        SET keyword = ?, reply = ?, active = ?
        WHERE id = ?
        """,
        (keyword, reply, active, rule_id),
    )
    connection.commit()
    connection.close()

    return {
        "id": rule_id,
        "keyword": keyword,
        "reply": reply,
        "active": bool(active),
    }


@app.delete(
    "/auto-reply-rules/{rule_id}",
    dependencies=[Depends(require_admin)],
)
def delete_auto_reply_rule(rule_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT id FROM auto_reply_rules WHERE id = ?", (rule_id,))
    if cursor.fetchone() is None:
        connection.close()
        raise HTTPException(status_code=404, detail="Auto reply rule not found")

    cursor.execute("DELETE FROM auto_reply_rules WHERE id = ?", (rule_id,))
    connection.commit()
    connection.close()

    return {"message": "Auto reply rule deleted successfully", "id": rule_id}


# ============================================================
# TEST PLAYGROUND FOR AUTO REPLIES
# ============================================================

@app.post("/test-auto-reply", dependencies=[Depends(require_admin)])
def test_auto_reply(data: ChatMessage):
    result = match_auto_reply_detail(data.message)
    return {
        "message": data.message,
        "reply": result["reply"],
        "matched": result["matched"],
        "matched_keyword": result["keyword"],
        "rule_id": result["rule_id"],
        "match_type": result["match_type"],
    }


# ============================================================
# ANALYTICS ENDPOINTS
# ============================================================

@app.get("/analytics/dashboard", dependencies=[Depends(require_admin)])
def get_dashboard_analytics():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT COUNT(*) FROM conversations")
    total = cursor.fetchone()[0]

    cursor.execute(
        """
        SELECT COUNT(DISTINCT conversation_id)
        FROM messages
        WHERE (reply IS NOT NULL AND TRIM(reply) != '')
           OR sender = 'agent'
        """
    )
    replied = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM auto_reply_rules WHERE active = 1")
    active_rules = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM conversations WHERE status = 'pending'")
    pending_count = cursor.fetchone()[0]

    connection.close()

    pending = pending_count if pending_count > 0 else max(0, total - replied)
    rate = round((replied / total) * 100, 2) if total else 0

    return {
        "total_conversations": total,
        "replied_conversations": replied,
        "pending_conversations": pending,
        "auto_reply_percentage": rate,
        "active_rules": active_rules,
    }


@app.get("/analytics/daily", dependencies=[Depends(require_admin)])
def get_daily_analytics_data():
    return get_daily_conversations()


# ============================================================
# SEED DEMO DATA
# ============================================================

@app.post("/seed", dependencies=[Depends(require_admin)])
def seed_demo_data():
    examples = [
        (
            "Sophia Martinez",
            "sophia.m@example.com",
            "Hi there! Can you send me your pricing tiers?",
            "active",
        ),
        (
            "David Chen",
            "david.chen@techcorp.io",
            "What is the status of my order #84920?",
            "replied",
        ),
        (
            "Elena Rostova",
            "elena@designhub.co",
            "I would like to request a refund for my recent renewal.",
            "pending",
        ),
        (
            "Marcus Brody",
            "marcus@brodyagency.com",
            "Good morning! Do you offer API webhooks integration?",
            "active",
        ),
        (
            "Amina Zahra",
            "amina@cloudscale.net",
            "Thank you so much for the swift setup yesterday!",
            "closed",
        ),
        (
            "Liam O'Connor",
            "liam@vertexlogic.com",
            "Hey, what are your live customer support hours?",
            "active",
        ),
    ]

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT COUNT(*) FROM conversations")
    existing_count = cursor.fetchone()[0]

    if existing_count > 0:
        connection.close()
        return {"seeded": False, "message": f"Already contains {existing_count} conversations."}

    for name, email, msg_text, status in examples:
        cursor.execute(
            """
            INSERT INTO conversations (customer_name, customer_email, status)
            VALUES (?, ?, ?)
            """,
            (name, email, status),
        )
        cid = cursor.lastrowid

        match_res = match_auto_reply_detail(msg_text)
        reply = match_res["reply"]

        cursor.execute(
            """
            INSERT INTO messages (conversation_id, sender, message, reply)
            VALUES (?, 'customer', ?, ?)
            """,
            (cid, msg_text, reply),
        )

        # For closed or replied, add a follow-up agent note
        if status in ["replied", "closed"]:
            cursor.execute(
                """
                INSERT INTO messages (conversation_id, sender, message, reply)
                VALUES (?, 'agent', 'Followed up with customer confirmation.', NULL)
                """,
                (cid,),
            )

    connection.commit()
    connection.close()
    return {"seeded": True, "count": len(examples)}


@app.post("/seed/reset", dependencies=[Depends(require_admin)])
def reset_and_reseed_data():
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("DELETE FROM messages")
    cursor.execute("DELETE FROM conversations")
    connection.commit()
    connection.close()
    return seed_demo_data()