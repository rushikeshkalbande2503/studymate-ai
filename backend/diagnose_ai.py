
import os
from dotenv import load_dotenv
from google import genai
from openai import OpenAI

load_dotenv()

gemini_key = os.getenv("GEMINI_API_KEY")
groq_key = os.getenv("GROQ_API_KEY")

gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

print("\n========== AI DIAGNOSTICS ==========")

# Test Gemini model access
print("\n1. GEMINI TEST")

try:
    if not gemini_key:
        raise ValueError("Gemini API key is missing.")

    client = genai.Client(api_key=gemini_key)

    info = client.models.get(model=gemini_model)
    print("Model accessible:", info.name)

    response = client.models.generate_content(
        model=gemini_model,
        contents="Reply with exactly: Gemini connection successful."
    )

    print("Gemini response:", response.text)

except Exception as error:
    print("Gemini error type:", type(error).__name__)
    print("Gemini error details:", str(error)[:1000])


# Test Groq model access
print("\n2. GROQ TEST")

try:
    if not groq_key:
        raise ValueError("Groq API key is missing.")

    client = OpenAI(
        api_key=groq_key,
        base_url="https://api.groq.com/openai/v1",
        timeout=30,
        max_retries=0
    )

    models = client.models.list()
    available_ids = [model.id for model in models.data]

    print("Groq authentication successful.")
    print("Configured model:", groq_model)
    print("Configured model available:", groq_model in available_ids)

    if groq_model not in available_ids:
        print("\nAvailable text model IDs:")
        for model_id in available_ids:
            print("-", model_id)

    else:
        response = client.chat.completions.create(
            model=groq_model,
            messages=[
                {
                    "role": "user",
                    "content": "Reply with exactly: Groq connection successful."
                }
            ],
            max_completion_tokens=100
        )

        print("Groq response:", response.choices[0].message.content)

except Exception as error:
    print("Groq error type:", type(error).__name__)
    print("Groq error details:", str(error)[:1000])

print("\n========== DIAGNOSTICS COMPLETE ==========")
