
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# ==========================================
# DOCUMENT SCHEMAS
# ==========================================

class DocumentBase(BaseModel):
    filename: str


class DocumentCreate(DocumentBase):
    file_path: str
    extracted_text: str | None = None


class DocumentResponse(DocumentBase):
    id: int
    file_path: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentDetail(DocumentResponse):
    extracted_text: str | None = None
    updated_at: datetime


# ==========================================
# STUDY ACTIVITY SCHEMAS
# ==========================================

class ActivityCreate(BaseModel):
    document_id: int
    activity_type: str
    result: str | None = None


class ActivityResponse(BaseModel):
    id: int
    document_id: int
    activity_type: str
    result: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# CHAT WITH PDF SCHEMAS
# ==========================================

class ChatMessage(BaseModel):
    role: str = Field(
        ...,
        pattern="^(user|assistant)$"
    )

    content: str = Field(
        ...,
        min_length=1,
        max_length=4000
    )


class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=2,
        max_length=4000
    )

    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=8
    )


class ChatResponse(BaseModel):
    success: bool
    document_id: int
    filename: str
    question: str
    answer: str
    provider: str
    model: str
    activity_id: int
    created_at: datetime


# ==========================================
# AI QUIZ GENERATOR SCHEMAS
# ==========================================

class QuizRequest(BaseModel):
    document_id: int = Field(..., gt=0)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    number_of_questions: int = Field(
        default=5,
        ge=3,
        le=15
    )


class QuizQuestion(BaseModel):
    question: str
    options: list[str] = Field(
        ...,
        min_length=4,
        max_length=4
    )
    correct_answer: int = Field(
        ...,
        ge=0,
        le=3
    )
    explanation: str


class QuizResponse(BaseModel):
    success: bool
    document_id: int
    filename: str
    difficulty: str
    total_questions: int
    questions: list[QuizQuestion]
    provider: str
    model: str
    activity_id: int


# ==========================================
# AI FLASHCARDS GENERATOR SCHEMAS
# ==========================================

class FlashcardRequest(BaseModel):
    document_id: int = Field(..., gt=0)

    number_of_cards: int = Field(
        default=10,
        ge=3,
        le=30
    )

    difficulty: Literal["easy", "medium", "hard"] = "medium"


class FlashcardItem(BaseModel):
    question: str = Field(
        ...,
        min_length=3
    )

    answer: str = Field(
        ...,
        min_length=2
    )

    explanation: str = ""


class FlashcardResponse(BaseModel):
    success: bool

    document_id: int
    filename: str

    difficulty: str

    total_cards: int
    flashcards: list[FlashcardItem]

    provider: str
    model: str

    activity_id: int


# ==========================================
# FLASHCARD PROGRESS SCHEMAS
# ==========================================

class FlashcardProgressRequest(BaseModel):
    card_index: int = Field(..., ge=0)

    status: Literal["known", "revision"]
