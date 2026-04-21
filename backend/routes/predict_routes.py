from flask import Blueprint, request, jsonify
import os
from datetime import timedelta
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from services.ml_service import predict_image
from services.cloudinary_service import upload_image
from services.supabase_service import save_prediction, get_predictions
from config import Config

predict_bp = Blueprint("predict", __name__)

UPLOAD_FOLDER = "uploads"


def _get_serializer():
    secret_key = Config.SUPABASE_KEY or Config.CLOUD_NAME or "smart-mushroom-ai"
    return URLSafeTimedSerializer(secret_key)


def _decode_access_token(token, max_age_minutes=30):
    return _get_serializer().loads(token, max_age=timedelta(minutes=max_age_minutes).seconds)


def _get_user_email_from_auth_header():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()

    if not token:
        return None

    try:
        payload = _decode_access_token(token)
        return payload.get("email")
    except (SignatureExpired, BadSignature):
        return None

@predict_bp.route("/predict", methods=["POST"])
def predict():
    user_email = _get_user_email_from_auth_header()
    if not user_email:
        return jsonify({"error": "Missing or invalid token"}), 401

    file = request.files.get("image")

    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    # Save locally
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        # Run ML model
        predictions = predict_image(file_path)

        # Upload to cloud
        image_url = upload_image(file_path)

        # Save results
        for pred in predictions:
            save_prediction(image_url, pred["stage"], pred["confidence"], user_email=user_email)
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503

    return jsonify({
        "image_url": image_url,
        "predictions": predictions
    })


@predict_bp.route("/history", methods=["GET"])
def history():
    user_email = _get_user_email_from_auth_header()
    if not user_email:
        return jsonify({"error": "Missing or invalid token"}), 401

    try:
        records = get_predictions(user_email=user_email, limit=100)
    except RuntimeError as exc:
        if "Supabase request failed" in str(exc):
            return jsonify({"history": []}), 200
        return jsonify({"error": "Unable to load history right now."}), 503

    filtered_records = [
        row for row in records.data
        if str(row.get("user_email") or "").strip().lower() == user_email.strip().lower()
    ]

    return jsonify({"history": filtered_records})