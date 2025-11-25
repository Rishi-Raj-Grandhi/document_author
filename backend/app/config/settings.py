import os
from dotenv import load_dotenv

# Load .env from backend/ automatically
ENV_PATH = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")), ".env")
load_dotenv(ENV_PATH)

class Settings:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4.1")

settings = Settings()

# Debug
#print("Loaded .env from:", ENV_PATH)
#print("OPENAI_API_KEY:", settings.OPENAI_API_KEY)
