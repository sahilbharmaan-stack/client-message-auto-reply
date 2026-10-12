# ============================================================
# FILE: auto_reply.py
# PURPOSE:
# Smart Auto-Reply Matcher Engine.
# Features:
# - Word-boundary matching (prevents "hi" from triggering inside "this" or "white")
# - Multi-word phrase support ("good morning", "pricing plans")
# - Longest-keyword priority (more specific rules match first)
# - Detail extraction for testing & analytics
# ============================================================

import re

try:
    from backend.database import get_connection
except ImportError:
    from database import get_connection


# ============================================================
# DEFAULT FALLBACK REPLY
# ============================================================

DEFAULT_REPLY = (
    "Thanks for your message! "
    "Our support team has received your inquiry and will get back to you shortly."
)


# ============================================================
# NORMALIZE TEXT
# ============================================================

def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower().strip()
    # Normalize spaces
    text = re.sub(r"\s+", " ", text)
    return text


# ============================================================
# SMART MATCH DETAIL FINDER
# ============================================================

def match_auto_reply_detail(message: str) -> dict:
    """
    Returns full match details:
    {
        "reply": str,
        "matched": bool,
        "keyword": Optional[str],
        "rule_id": Optional[int],
        "match_type": str  # 'exact', 'phrase', 'word_boundary', 'fallback'
    }
    """
    normalized_message = normalize_text(message)

    if not normalized_message:
        return {
            "reply": DEFAULT_REPLY,
            "matched": False,
            "keyword": None,
            "rule_id": None,
            "match_type": "fallback"
        }

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            id,
            keyword,
            reply,
            active
        FROM auto_reply_rules
        WHERE active = 1
        ORDER BY LENGTH(keyword) DESC, id DESC
        """
    )

    rules = cursor.fetchall()
    connection.close()

    # Clean punctuation for word-token checking
    words_only_msg = re.sub(r"[^\w\s]", " ", normalized_message)

    for rule in rules:
        keyword = normalize_text(rule["keyword"])
        if not keyword:
            continue

        # 1. Exact match
        if normalized_message == keyword:
            return {
                "reply": rule["reply"],
                "matched": True,
                "keyword": rule["keyword"],
                "rule_id": rule["id"],
                "match_type": "exact"
            }

        # 2. Multi-word phrase match (e.g. "good morning", "order status")
        if " " in keyword:
            if keyword in normalized_message:
                return {
                    "reply": rule["reply"],
                    "matched": True,
                    "keyword": rule["keyword"],
                    "rule_id": rule["id"],
                    "match_type": "phrase"
                }
        else:
            # 3. Single-word match with word boundary (prevents "hi" matching in "this" or "machine")
            pattern = rf"\b{re.escape(keyword)}\b"
            if re.search(pattern, normalized_message) or re.search(pattern, words_only_msg):
                return {
                    "reply": rule["reply"],
                    "matched": True,
                    "keyword": rule["keyword"],
                    "rule_id": rule["id"],
                    "match_type": "word_boundary"
                }

    return {
        "reply": DEFAULT_REPLY,
        "matched": False,
        "keyword": None,
        "rule_id": None,
        "match_type": "fallback"
    }


# ============================================================
# COMPATIBILITY FUNCTION
# ============================================================

def find_auto_reply(message: str) -> str:
    """
    Returns just the reply string for direct customer messages.
    """
    result = match_auto_reply_detail(message)
    return result["reply"]