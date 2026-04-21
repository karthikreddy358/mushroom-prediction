import os

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    load_dotenv = None


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Support both standard backend/.env and current backend/uploads/.env placement.
ENV_CANDIDATES = [
    os.path.join(BASE_DIR, ".env"),
    os.path.join(BASE_DIR, "uploads", ".env"),
]


def _load_env_file(env_path: str) -> None:
    if not os.path.exists(env_path):
        return

    with open(env_path, "r", encoding="utf-8") as env_file:
        for raw_line in env_file:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")

            if key and key not in os.environ:
                os.environ[key] = value


for env_path in ENV_CANDIDATES:
    if load_dotenv and os.path.exists(env_path):
        load_dotenv(env_path, override=False)
    else:
        _load_env_file(env_path)


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