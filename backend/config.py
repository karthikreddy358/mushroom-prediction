import os
from dotenv import load_dotenv


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Support both standard backend/.env and current backend/uploads/.env placement.
ENV_CANDIDATES = [
    os.path.join(BASE_DIR, ".env"),
    os.path.join(BASE_DIR, "uploads", ".env"),
]

for env_path in ENV_CANDIDATES:
    if os.path.exists(env_path):
        load_dotenv(env_path, override=False)


def _normalize_supabase_url(value: str | None) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    if raw.startswith("http://") or raw.startswith("https://"):
        return raw
    # If user provided only project ref, build full hosted URL.
    if "." not in raw and "/" not in raw:
        return f"https://{raw}.supabase.co"
    return raw

class Config:
    SUPABASE_URL = _normalize_supabase_url(os.getenv("SUPABASE_URL"))
    SUPABASE_KEY = (os.getenv("SUPABASE_KEY") or "").strip()

    CLOUD_NAME = (os.getenv("CLOUDINARY_CLOUD_NAME") or os.getenv("CLOUD_NAME") or "").strip()
    API_KEY = (os.getenv("CLOUDINARY_API_KEY") or os.getenv("API_KEY") or "").strip()
    API_SECRET = (os.getenv("CLOUDINARY_API_SECRET") or os.getenv("API_SECRET") or "").strip()