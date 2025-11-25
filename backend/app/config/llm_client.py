# app/config/llm_client.py

from openai import OpenAI
from app.config.settings import settings


# Load OpenAI with the key from .env
client = OpenAI(api_key=settings.OPENAI_API_KEY)


def generate_text(prompt: str, model: str = None) -> str:
    """
    Wrapper for OpenAI text generation.

    Parameters
    ----------
    prompt : str
        Prompt to send to the LLM.
    model : str, optional
        Allows overriding the model per-call.

    Returns
    -------
    str
        Cleaned LLM output text.
    """
    model_name = model or settings.MODEL_NAME

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful and precise assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        raise RuntimeError(f"LLM request failed: {e}")
