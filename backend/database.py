# ============================================================
# FILE: database.py
# PURPOSE:
# SQLite database connection and table creation.
#
# STRUCTURE:
# conversations = one conversation/customer thread
# messages      = all messages inside that conversation
# auto_reply_rules = automatic reply rules
# ============================================================

import os
import sqlite3
from datetime import datetime
from pathlib import Path


# ============================================================
# DATABASE LOCATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DEFAULT_DATABASE_PATH = (
    Path("/tmp/chat_auto_reply")
    if os.environ.get("VERCEL")
    else BASE_DIR / "chat_auto_reply"
)
DATABASE_PATH = Path(os.environ.get("DATABASE_PATH", DEFAULT_DATABASE_PATH))
LEGACY_DATABASE_PATH = BASE_DIR / "chat_auto_reply.db"


def _timestamp_or_now(value):

    return value or datetime.now().isoformat()


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():

    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(
        DATABASE_PATH,
        check_same_thread=False
    )

    connection.row_factory = sqlite3.Row

    # Enable foreign keys
    connection.execute("PRAGMA foreign_keys = ON")

    return connection


def _migrate_legacy_conversations(connection):

    cursor = connection.cursor()
    conversation_columns = {
        row["name"]
        for row in cursor.execute("PRAGMA table_info(conversations)")
    }

    if "message" not in conversation_columns and "updated_at" in conversation_columns:
        return

    old_conversations = [
        dict(row)
        for row in cursor.execute("SELECT * FROM conversations")
    ]
    message_columns = {
        row["name"]
        for row in cursor.execute("PRAGMA table_info(messages)")
    }
    old_messages = (
        [dict(row) for row in cursor.execute("SELECT * FROM messages")]
        if message_columns
        else []
    )

    connection.execute("PRAGMA foreign_keys = OFF")
    cursor.execute("BEGIN")
    cursor.execute("DROP TABLE IF EXISTS conversations_migrated")
    cursor.execute("DROP TABLE IF EXISTS messages_migrated")
    cursor.execute(
        """
        CREATE TABLE conversations_migrated (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_email TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    for conversation in old_conversations:
        created_at = _timestamp_or_now(conversation.get("created_at"))
        cursor.execute(
            """
            INSERT INTO conversations_migrated
                (id, customer_name, customer_email, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                conversation["id"],
                conversation["customer_name"],
                conversation.get("customer_email"),
                conversation.get("status") or "active",
                created_at,
                conversation.get("updated_at") or created_at,
            ),
        )

    cursor.execute(
        """
        CREATE TABLE messages_migrated (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            sender TEXT NOT NULL,
            message TEXT NOT NULL,
            reply TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id)
                REFERENCES conversations_migrated(id)
                ON DELETE CASCADE
        )
        """
    )

    migrated_conversation_messages = set()
    for message in old_messages:
        cursor.execute(
            """
            INSERT INTO messages_migrated
                (id, conversation_id, sender, message, reply, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                message.get("id"),
                message["conversation_id"],
                message.get("sender") or "customer",
                message["message"],
                message.get("reply"),
                _timestamp_or_now(message.get("created_at")),
            ),
        )
        migrated_conversation_messages.add(message["conversation_id"])

    for conversation in old_conversations:
        legacy_message = conversation.get("message")
        if (
            legacy_message
            and conversation["id"] not in migrated_conversation_messages
        ):
            cursor.execute(
                """
                INSERT INTO messages_migrated
                    (conversation_id, sender, message, reply, created_at)
                VALUES (?, 'customer', ?, ?, ?)
                """,
                (
                    conversation["id"],
                    legacy_message,
                    conversation.get("reply"),
                    conversation.get("created_at") or "CURRENT_TIMESTAMP",
                ),
            )

    cursor.execute("DROP TABLE IF EXISTS messages")
    cursor.execute("DROP TABLE conversations")
    cursor.execute(
        "ALTER TABLE conversations_migrated RENAME TO conversations"
    )
    cursor.execute("ALTER TABLE messages_migrated RENAME TO messages")
    connection.commit()
    connection.execute("PRAGMA foreign_keys = ON")


def _import_legacy_database(connection):

    legacy_path = LEGACY_DATABASE_PATH
    if (
        not legacy_path.exists()
        or legacy_path.resolve() == Path(DATABASE_PATH).resolve()
    ):
        return

    cursor = connection.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name TEXT PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    migration_name = f"import_{legacy_path.name}"
    cursor.execute(
        "SELECT 1 FROM schema_migrations WHERE name = ?",
        (migration_name,),
    )
    if cursor.fetchone():
        return

    legacy = sqlite3.connect(legacy_path)
    legacy.row_factory = sqlite3.Row
    try:
        legacy_tables = {
            row["name"]
            for row in legacy.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }
        if "conversations" in legacy_tables:
            source_columns = {
                row["name"]
                for row in legacy.execute("PRAGMA table_info(conversations)")
            }
            if {"id", "customer_name"}.issubset(source_columns):
                has_messages_table = "messages" in legacy_tables
                source_messages = {}
                if has_messages_table:
                    source_messages = {
                        row["conversation_id"]: [
                            dict(message)
                            for message in legacy.execute(
                                """
                                SELECT *
                                FROM messages
                                WHERE conversation_id = ?
                                ORDER BY id
                                """,
                                (row["id"],),
                            )
                        ]
                        for row in legacy.execute("SELECT id FROM conversations")
                    }

                for row in legacy.execute("SELECT * FROM conversations"):
                    conversation = dict(row)
                    target = None
                    email = conversation.get("customer_email")
                    if email:
                        target = cursor.execute(
                            """
                            SELECT id
                            FROM conversations
                            WHERE customer_email = ?
                            ORDER BY id DESC
                            LIMIT 1
                            """,
                            (email,),
                        ).fetchone()

                    existing_id = cursor.execute(
                        "SELECT id FROM conversations WHERE id = ?",
                        (conversation["id"],),
                    ).fetchone()
                    if target is None and existing_id is None:
                        cursor.execute(
                            """
                            INSERT INTO conversations
                                (id, customer_name, customer_email, status, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?)
                            """,
                            (
                                conversation["id"],
                                conversation["customer_name"],
                                email,
                                conversation.get("status") or "active",
                                _timestamp_or_now(conversation.get("created_at")),
                                conversation.get("updated_at")
                                or conversation.get("created_at")
                                or _timestamp_or_now(None),
                            ),
                        )
                        conversation_id = conversation["id"]
                    elif target is not None:
                        conversation_id = target["id"]
                    else:
                        cursor.execute(
                            """
                            INSERT INTO conversations
                                (customer_name, customer_email, status, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?)
                            """,
                            (
                                conversation["customer_name"],
                                email,
                                conversation.get("status") or "active",
                                _timestamp_or_now(conversation.get("created_at")),
                                conversation.get("updated_at")
                                or conversation.get("created_at")
                                or _timestamp_or_now(None),
                            ),
                        )
                        conversation_id = cursor.lastrowid

                    messages = source_messages.get(conversation["id"], [])
                    if not messages and conversation.get("message"):
                        messages = [
                            {
                                "message": conversation["message"],
                                "reply": conversation.get("reply"),
                                "created_at": conversation.get("created_at"),
                                "sender": "customer",
                            }
                        ]

                    for message in messages:
                        message_text = message.get("message")
                        if not message_text:
                            continue
                        cursor.execute(
                            """
                            SELECT 1
                            FROM messages
                            WHERE conversation_id = ? AND message = ?
                            LIMIT 1
                            """,
                            (conversation_id, message_text),
                        )
                        if cursor.fetchone():
                            continue
                        cursor.execute(
                            """
                            INSERT INTO messages
                                (conversation_id, sender, message, reply, created_at)
                            VALUES (?, ?, ?, ?, ?)
                            """,
                            (
                                conversation_id,
                                message.get("sender") or "customer",
                                message_text,
                                message.get("reply"),
                                _timestamp_or_now(message.get("created_at")),
                            ),
                        )
    finally:
        legacy.close()

    cursor.execute(
        "INSERT INTO schema_migrations (name) VALUES (?)",
        (migration_name,),
    )
    connection.commit()


# ============================================================
# CREATE TABLES
# ============================================================

def init_database():

    connection = get_connection()
    cursor = connection.cursor()
    connection.execute("PRAGMA foreign_keys = OFF")

    # ========================================================
    # CONVERSATIONS
    #
    # One row = one customer conversation
    # ========================================================

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS conversations (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            customer_name TEXT NOT NULL,

            customer_email TEXT,

            status TEXT DEFAULT 'active',

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )
        """
    )

    # ========================================================
    # MESSAGES
    #
    # Every customer message / auto reply is stored here.
    #
    # conversation_id connects the message to one conversation.
    # ========================================================

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            conversation_id INTEGER NOT NULL,

            sender TEXT NOT NULL,

            message TEXT NOT NULL,

            reply TEXT,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (conversation_id)
                REFERENCES conversations(id)
                ON DELETE CASCADE

        )
        """
    )

    _migrate_legacy_conversations(connection)

    # ========================================================
    # AUTO REPLY RULES
    # ========================================================

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS auto_reply_rules (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            keyword TEXT NOT NULL,

            reply TEXT NOT NULL,

            active INTEGER DEFAULT 1,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )
        """
    )

    connection.commit()
    _import_legacy_database(connection)

    connection.close()


# ============================================================
# DEFAULT AUTO REPLY RULES
# ============================================================

def seed_default_rules():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT COUNT(*) FROM auto_reply_rules"
    )

    count = cursor.fetchone()[0]

    # Only insert if no rules exist
    if count == 0:

        rules = [

            (
                "hello",
                "Hi there! How can I help you?"
            ),

            (
                "hi",
                "Hi there! How can I help you?"
            ),

            (
                "hey",
                "Hi there! How can I help you?"
            ),

            (
                "good morning",
                "Good morning! How can I help you today?"
            ),

            (
                "good afternoon",
                "Good afternoon! How can I help you today?"
            ),

            (
                "good evening",
                "Good evening! How can I help you today?"
            ),

            (
                "good night",
                "Good night! If you need anything, we're here to help."
            ),

            (
                "price",
                "Sure! Please tell us which product or service you're interested in."
            ),

            (
                "pricing",
                "Sure! Please tell us which product or service you're interested in."
            ),

            (
                "order",
                "Sure! Please share your order ID so we can check it for you."
            ),

            (
                "refund",
                "Sure! Please share your order ID so we can help you with the refund."
            ),

            (
                "thank",
                "You're welcome! 😊 We're always happy to help."
            ),

            (
                "thanks",
                "You're welcome! 😊 We're always happy to help."
            ),

            (
                "help",
                "Of course! Please tell us what you need help with."
            )

        ]

        cursor.executemany(
            """
            INSERT INTO auto_reply_rules
            (
                keyword,
                reply,
                active
            )
            VALUES (?, ?, 1)
            """,
            rules
        )

        connection.commit()

    connection.close()