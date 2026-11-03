
from app.services.ai_service import generate_ai_response, AIProviderError

prompt = """
Explain Artificial Intelligence in simple language.
Give five important points for engineering students.
"""

try:
    result = generate_ai_response(prompt)

    print("\nAI CONNECTION SUCCESSFUL")
    print("Provider:", result["provider"])
    print("Model:", result["model"])
    print("\nAI RESPONSE:")
    print(result["response"])

except AIProviderError as error:
    print("\nAI CONNECTION FAILED:")
    print(error)

except Exception as error:
    print("\nUNEXPECTED ERROR:")
    print(type(error).__name__, str(error))
