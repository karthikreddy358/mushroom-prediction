import os

def ensure_upload_folder():
    if not os.path.exists("uploads"):
        os.makedirs("uploads")