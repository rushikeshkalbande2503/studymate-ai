
import os
import logging

from dotenv import load_dotenv
from google import genai
from google.genai import types
from openai import OpenAI


# ==========================================
# ENVIRONMENT CONFIGURATION
# ==========================================

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.8-flash"
)

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-120b"
)

# Provider timeout settings
GEMINI_TIMEOUT_MS = 45000
GROQ_TIMEOUT_SECONDS = 60.0


# ==========================================
# GEMINI CLIENT
# ==========================================

gemini_client = None

if GEMINI_API_KEY:
    gemini_client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options=types.HttpOptions(
            timeout=GEMINI_TIMEOUT_MS
        )
    )


# ==========================================
# GROQ CLIENT
# ==========================================

groq_client = None

if GROQ_API_KEY:
    groq_client = OpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
        timeout=GROQ_TIMEOUT_SECONDS,
        max_retries=0
    )


# ==========================================
# CUSTOM AI EXCEPTION
# ==========================================

class AIProviderError(Exception):
    """Raised when all configured AI providers fail."""
    pass


# ==========================================
# GEMINI RESPONSE GENERATION
# ==========================================

def generate_with_gemini(prompt: str) -> str:

    if not gemini_client:
        raise AIProviderError(
            "Gemini API key is not configured."
        )

    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt
    )

    result = response.text

    if not result or not result.strip():
        raise AIProviderError(
            "Gemini returned an empty response."
        )

    return result.strip()


# ==========================================
# GROQ RESPONSE GENERATION
# ==========================================

def generate_with_groq(prompt: str) -> str:

    if not groq_client:
        raise AIProviderError(
            "Groq API key is not configured."
        )

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.4,
        max_completion_tokens=2048
    )

    result = response.choices[0].message.content

    if not result or not result.strip():
        raise AIProviderError(
            "Groq returned an empty response."
        )

    return result.strip()


# ==========================================
# MAIN AI RESPONSE GENERATOR
# ==========================================

def generate_ai_response(prompt: str) -> dict:
    """
    Generate an AI response using provider fallback.

    Execution order:
        1. Gemini
        2. Groq

    Gemini has a 45-second HTTP timeout.
    Groq has a 60-second HTTP timeout.

    Returns:
        {
            "success": True,
            "provider": "Gemini or Groq",
            "model": "model name",
            "response": "generated content"
        }
    """

    if not prompt or not prompt.strip():
        raise ValueError(
            "Prompt cannot be empty."
        )

    # Stop immediately if no provider is configured.
    if not gemini_client and not groq_client:
        raise AIProviderError(
            "No AI provider is configured. "
            "Please configure Gemini or Groq API credentials."
        )

    providers = []

    if gemini_client:
        providers.append({
            "name": "Gemini",
            "model": GEMINI_MODEL,
            "function": generate_with_gemini
        })

    if groq_client:
        providers.append({
            "name": "Groq",
            "model": GROQ_MODEL,
            "function": generate_with_groq
        })

    # Try providers sequentially.
    for provider in providers:

        provider_name = provider["name"]

        try:
            logger.info(
                "Starting AI request using %s (%s)",
                provider_name,
                provider["model"]
            )

            result = provider["function"](prompt)

            logger.info(
                "AI response generated successfully using %s",
                provider_name
            )

            return {
                "success": True,
                "provider": provider_name,
                "model": provider["model"],
                "response": result
            }

        except Exception as error:

            # Log the exception type without exposing API credentials.
            logger.warning(
                "%s request failed: %s",
                provider_name,
                type(error).__name__
            )

            logger.info(
                "Attempting the next available AI provider."
            )

    # All configured providers failed.
    logger.error(
        "All configured AI providers failed."
    )

    raise AIProviderError(
        "All AI providers are currently unavailable. "
        "Please try again later."
    )
