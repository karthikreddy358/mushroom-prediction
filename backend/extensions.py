from supabase import create_client
import cloudinary
from config import Config

# Supabase client
if not Config.SUPABASE_URL or not Config.SUPABASE_KEY:
    raise RuntimeError(
        "Missing SUPABASE_URL or SUPABASE_KEY. Add them to backend/.env "
        "(or backend/uploads/.env temporarily)."
    )

supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

# Cloudinary config
cloudinary.config(
    cloud_name=Config.CLOUD_NAME,
    api_key=Config.API_KEY,
    api_secret=Config.API_SECRET
)