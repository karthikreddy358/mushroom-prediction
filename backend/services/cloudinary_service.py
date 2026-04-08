import cloudinary.uploader

def upload_image(file_path):
    result = cloudinary.uploader.upload(file_path)
    return result["secure_url"]