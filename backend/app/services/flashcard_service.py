
import json
import logging
import re

from app.services.ai_service import (
    generate_ai_response,
    AIProviderError
)

logger = logging.getLogger(__name__)


def generate_flashcards(
    document_text: str,
    difficulty: str = "medium",
    number_of_cards: int = 10
) -> dict:

    if not document_text or not document_text.strip():
        raise ValueError("Document text cannot be empty.")

    if difficulty not in ["easy", "medium", "hard"]:
        raise ValueError("Invalid difficulty level.")

    if not 3 <= number_of_cards <= 30:
        raise ValueError(
            "Number of flashcards must be between 3 and 30."
        )

    # Limit document context to control API usage.
    document_text = document_text[:30000]

    prompt = f"""
You are StudyMate AI, an expert academic learning assistant.

Generate exactly {number_of_cards} useful study flashcards
from the provided PDF content.

DIFFICULTY LEVEL: {difficulty}

INSTRUCTIONS:

1. Use only information supported by the document.
2. Each flashcard must contain one clear question.
3. Provide a concise but informative answer.
4. Include a short explanation that helps students understand
   the concept.
5. Avoid duplicate questions.
6. Cover different important topics from the document.
7. Match the requested difficulty level.
8. Do not invent facts or information.
9. Questions should be suitable for engineering students.
10. Return exactly {number_of_cards} flashcards.

OUTPUT FORMAT:

Return ONLY valid JSON.
Do not include Markdown code fences or additional text.

{{
    "flashcards": [
        {{
            "question": "What is cloud computing?",
            "answer": "Cloud computing provides computing services over the internet.",
            "explanation": "It allows users to access resources such as servers, storage and software on demand."
        }}
    ]
}}

DOCUMENT CONTENT:

<document_content>
{document_text}
</document_content>
"""

    # Generate response using Gemini/Groq fallback.
    ai_result = generate_ai_response(prompt)

    raw_response = ai_result.get("response", "").strip()

    if not raw_response:
        raise AIProviderError(
            "AI provider returned an empty flashcard response."
        )

    # Remove Markdown code fences if the AI includes them.
    raw_response = re.sub(
        r"^```(?:json)?\s*",
        "",
        raw_response,
        flags=re.IGNORECASE
    )

    raw_response = re.sub(
        r"\s*```$",
        "",
        raw_response
    )

    try:
        parsed_response = json.loads(raw_response)

    except json.JSONDecodeError as error:
        logger.error(
            "Invalid JSON returned by AI flashcard generator."
        )
        raise ValueError(
            "AI returned an invalid flashcard format. Please try again."
        ) from error

    flashcards = parsed_response.get("flashcards")

    if not isinstance(flashcards, list):
        raise ValueError(
            "AI response does not contain a valid flashcards list."
        )

    if len(flashcards) != number_of_cards:
        raise ValueError(
            f"Expected {number_of_cards} flashcards, "
            f"but received {len(flashcards)}."
        )

    validated_flashcards = []

    for index, card in enumerate(flashcards):

        if not isinstance(card, dict):
            raise ValueError(
                f"Flashcard {index + 1} has an invalid format."
            )

        question = card.get("question")
        answer = card.get("answer")
        explanation = card.get("explanation", "")

        if not isinstance(question, str) or len(question.strip()) < 3:
            raise ValueError(
                f"Flashcard {index + 1} has an invalid question."
            )

        if not isinstance(answer, str) or not answer.strip():
            raise ValueError(
                f"Flashcard {index + 1} has an invalid answer."
            )

        if not isinstance(explanation, str):
            explanation = ""

        validated_flashcards.append({
            "question": question.strip(),
            "answer": answer.strip(),
            "explanation": explanation.strip()
        })

    return {
        "flashcards": validated_flashcards,
        "provider": ai_result.get("provider", "Unknown"),
        "model": ai_result.get("model", "Unknown")
    }
