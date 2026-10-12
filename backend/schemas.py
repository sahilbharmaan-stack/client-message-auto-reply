# ============================================================
# FILE: schemas.py
# PURPOSE:
# Pydantic request/response schemas.
# ============================================================

from typing import Optional
from pydantic import BaseModel, Field


# ============================================================
# CONVERSATION SCHEMAS
# ============================================================

class ConversationCreate(BaseModel):
    customer_name: str = Field(
        ...,
        min_length=1,
        max_length=100
    )
    customer_email: Optional[str] = None
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000
    )


class ConversationUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    status: Optional[str] = None  # 'active', 'pending', 'replied', 'closed'


# ============================================================
# MESSAGE SCHEMAS
# ============================================================

class MessageCreate(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000
    )
    sender: Optional[str] = "customer"  # 'customer' or 'agent'


class AgentReplyCreate(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000
    )


# ============================================================
# AUTO REPLY RULE SCHEMAS
# ============================================================

class AutoReplyRuleCreate(BaseModel):
    keyword: str = Field(
        ...,
        min_length=1,
        max_length=200
    )
    reply: str = Field(
        ...,
        min_length=1,
        max_length=5000
    )
    active: bool = True


class AutoReplyRuleUpdate(BaseModel):
    keyword: Optional[str] = None
    reply: Optional[str] = None
    active: Optional[bool] = None


# ============================================================
# CHAT MESSAGE SCHEMA (TEST PLAYGROUND)
# ============================================================

class ChatMessage(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000
    )