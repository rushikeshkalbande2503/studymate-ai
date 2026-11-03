
from app.services.ai_service import generate_ai_response


def generate_pdf_summary(document_text: str) -> dict:
    """
    Generate an exam-oriented summary from extracted PDF text.
    """

    if not document_text or not document_text.strip():
        raise ValueError("Document text is empty.")

    # Limit prompt size for predictable API usage.
    max_characters = 25000
    text = document_text[:max_characters]

    prompt = f"""
You are StudyMate AI, an expert academic study assistant.

Analyze the following study material and generate a structured,
exam-oriented summary for engineering students.

Use the following format:

# 1. Document Overview
Explain the subject and main purpose.

# 2. Important Topics
List the major topics covered.

# 3. Detailed Summary
Explain the important concepts in simple language.

# 4. Important Definitions
Provide key definitions.

# 5. Important Formulas
List formulas if present in the document.
Do not invent formulas.

# 6. Exam Preparation Points
List important points students should remember.

# 7. Quick Revision
Provide 5-10 short revision points.

IMPORTANT:
- Use only information supported by the supplied document.
- Do not invent facts or references.
- Use clear academic language.
- Preserve important technical terminology.

DOCUMENT CONTENT:
{text}
"""

    return generate_ai_response(prompt)
