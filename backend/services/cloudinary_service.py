def upload_image(file_path):
    try:
        import cloudinary.uploader
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "The optional dependency 'cloudinary' is not installed. Install the backend dependencies to use image uploads."
        ) from exc

    try:
        result = cloudinary.uploader.upload(file_path)
    except Exception as exc:
        raise RuntimeError(
            "Cloudinary upload failed. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env or backend/uploads/.env."
        ) from exc

    return result["secure_url"]