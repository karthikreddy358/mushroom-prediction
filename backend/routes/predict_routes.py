from flask import Blueprint, request, jsonify
import os
from services.ml_service import predict_image
from services.cloudinary_service import upload_image
from services.supabase_service import save_prediction

predict_bp = Blueprint("predict", __name__)

UPLOAD_FOLDER = "uploads"

@predict_bp.route("/predict", methods=["POST"])
def predict():
    file = request.files.get("image")

    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    # Save locally
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # Run ML model
    predictions = predict_image(file_path)

    # Upload to cloud
    image_url = upload_image(file_path)

    # Save results
    for pred in predictions:
        save_prediction(image_url, pred["stage"], pred["confidence"])

    return jsonify({
        "image_url": image_url,
        "predictions": predictions
    })