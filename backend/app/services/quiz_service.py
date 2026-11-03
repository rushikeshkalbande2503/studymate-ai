
import json
import re

from app.services.ai_service import generate_ai_response, AIProviderError


def generate_quiz(document_text: str, difficulty: str, number_of_questions: int):
    """
    Generate MCQ questions from uploaded PDF content.
    """

    if not document_text or not document_text.strip():
        raise ValueError("Document content is empty.")

    # Limit document content to avoid excessively large API requests.
    document_content = document_text[:25000]

    prompt = f"""
You are StudyMate AI, an expert educational quiz generator.

Generate exactly {number_of_questions} multiple-choice questions
based ONLY on the provided document content.

Difficulty level: {difficulty.upper()}

STRICT INSTRUCTIONS:
1. Generate exactly {number_of_questions} questions.
2. Every question must have exactly four options.
3. Only one option must be correct.
4. correct_answer must be the zero-based index:
   0 = option A
   1 = option B
   2 = option C
   3 = option D
5. Provide a clear explanation for each correct answer.
6. Questions must match the requested difficulty.
7. Do not generate questions unrelated to the document.
8. Do not include introductory or concluding text.
9. Return valid JSON only. Do not use Markdown code fences.

REQUIRED JSON FORMAT:

{{
  "questions": [
    {{
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": 0,
      "explanation": "Explanation of the correct answer."
    }}
  ]
}}

DOCUMENT CONTENT:
-------------------------
{document_content}
-------------------------
"""

    # Generate response using Gemini/Groq fallback service.
    ai_result = generate_ai_response(prompt)

    response_text = ai_result.get("response", "").strip()

    # Remove Markdown code fences if the AI includes them.
    response_text = re.sub(
        r"^```(?:json)?\s*|\s*```$",
        "",
        response_text,
        flags=re.IGNORECASE
    ).strip()

    # Parse the JSON response.
    try:
        quiz_data = json.loads(response_text)
    except json.JSONDecodeError as error:
        raise AIProviderError(
            "AI returned an invalid quiz format. Please generate again."
        ) from error

    questions = quiz_data.get("questions")

    if not isinstance(questions, list):
        raise AIProviderError("AI returned an invalid questions list.")

    if len(questions) != number_of_questions:
        raise AIProviderError(
            f"Expected {number_of_questions} questions, "
            f"but received {len(questions)}."
        )

    # Validate every question before returning it.
    for index, question in enumerate(questions):

        if not isinstance(question, dict):
            raise AIProviderError(
                f"Invalid question format at question {index + 1}."
            )

        options = question.get("options")
        correct_answer = question.get("correct_answer")

        if (
            not isinstance(options, list)
            or len(options) != 4
            or not all(isinstance(option, str) and option.strip() for option in options)
        ):
            raise AIProviderError(
                f"Question {index + 1} must have four valid options."
            )

        if (
            not isinstance(correct_answer, int)
            or isinstance(correct_answer, bool)
            or correct_answer not in range(4)
        ):
            raise AIProviderError(
                f"Invalid correct answer index in question {index + 1}."
            )

        if not isinstance(question.get("question"), str) or not question["question"].strip():
            raise AIProviderError(
                f"Question {index + 1} has no valid question text."
            )

        if not isinstance(question.get("explanation"), str) or not question["explanation"].strip():
            raise AIProviderError(
                f"Question {index + 1} has no valid explanation."
            )

    return {
        "questions": questions,
        "provider": ai_result["provider"],
        "model": ai_result["model"]
    }
