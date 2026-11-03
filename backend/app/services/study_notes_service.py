
from app.services.ai_service import generate_ai_response


def generate_study_notes(document_text: str) -> dict:
    """
    Generate detailed, structured academic study notes
    from extracted PDF text.
    """

    if not document_text or not document_text.strip():
        raise ValueError("Document text is empty.")

    # Limit input size to control API usage.
    max_characters = 25000
    text = document_text[:max_characters]

    prompt = f"""
You are StudyMate AI, an expert academic educator
and technical study-notes generator.

Analyze the supplied academic PDF content and create
comprehensive, well-organized study notes for engineering students.

Follow this structure:

# 1. Document Overview
- Subject and main topic
- Purpose of the material
- Main learning objectives, if available

# 2. Chapter-wise Topics
- Identify the topics and subtopics.
- Organize them using clear headings.
- Preserve the original topic terminology.

# 3. Detailed Study Notes
- Explain every major concept in simple academic language.
- Use headings and subheadings.
- Include step-by-step explanations where appropriate.
- Include examples only when supported by the document.

# 4. Important Definitions
- List important technical terms.
- Give clear and accurate definitions.

# 5. Important Formulas
- Extract formulas present in the document.
- Explain their variables where information is available.
- Do not invent formulas.

# 6. Advantages and Disadvantages
- Include these wherever discussed in the document.
- Do not add unsupported comparisons.

# 7. Important Comparisons
- Present comparisons in Markdown tables where applicable.
- Use only information supported by the document.

# 8. Exam Preparation
- Highlight important concepts.
- Identify topics suitable for descriptive answers.
- Include important points students should remember.

# 9. Quick Revision
- Provide 10 to 15 concise revision points.

IMPORTANT RULES:
- Use the supplied PDF as the primary and only factual source.
- Do not invent information, examples, formulas or references.
- If a requested section is not covered in the PDF,
  write "Not specified in the supplied document."
- Preserve technical terminology.
- Avoid unnecessary repetition.
- Use clear Markdown formatting.
- Make the notes detailed enough for engineering examination preparation.

DOCUMENT CONTENT:
<document_content>
{text}
</document_content>
"""

    return generate_ai_response(prompt)
