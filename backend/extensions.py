from config import Config


class _MissingDependencyClient:
    def __init__(self, package_name: str):
        self.package_name = package_name

    def __getattr__(self, name):
        raise RuntimeError(
            f"The optional dependency '{self.package_name}' is not installed. Install the backend dependencies to use this feature."
        )


try:
    import cloudinary
    _HAS_CLOUDINARY = True
except ModuleNotFoundError:
    cloudinary = _MissingDependencyClient("cloudinary")
    _HAS_CLOUDINARY = False

# Cloudinary config
if _HAS_CLOUDINARY and Config.CLOUD_NAME and Config.API_KEY and Config.API_SECRET:
    cloudinary.config(
        cloud_name=Config.CLOUD_NAME,
        api_key=Config.API_KEY,
        api_secret=Config.API_SECRET
    )