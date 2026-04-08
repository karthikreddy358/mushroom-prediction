from datetime import timedelta

from flask import Blueprint, request, jsonify
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from services.supabase_service import create_user, get_user
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config

auth_bp = Blueprint("auth", __name__)


def _get_serializer():
    secret_key = Config.SUPABASE_KEY or Config.CLOUD_NAME or "smart-mushroom-ai"
    return URLSafeTimedSerializer(secret_key)


def _create_access_token(email):
    return _get_serializer().dumps({"email": email})


def _decode_access_token(token, max_age_minutes=30):
    return _get_serializer().loads(token, max_age=timedelta(minutes=max_age_minutes).seconds)


def _get_payload():
    return request.get_json(silent=True) or request.form or {}

@auth_bp.route("/register", methods=["POST"])
def register():
    data = _get_payload()

    name = data.get("name") or data.get("full_name") or ""
    email = data.get("email", "")
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400

    hashed_password = generate_password_hash(password)

    create_user(name, email, hashed_password)

    return jsonify({"message": "User registered successfully"})


@auth_bp.route("/login", methods=["POST"])
def login():
    data = _get_payload()

    email = data.get("email") or data.get("username")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = get_user(email)

    if user.data:
        stored_user = user.data[0]

        if check_password_hash(stored_user["password"], password):
            access_token = _create_access_token(stored_user["email"])
            safe_user = {
                "id": stored_user.get("id"),
                "full_name": stored_user.get("full_name"),
                "email": stored_user.get("email"),
            }
            return jsonify({
                "message": "Login successful",
                "access_token": access_token,
                "token_type": "bearer",
                "user": safe_user
            })

    return jsonify({"error": "Invalid credentials"}), 401


@auth_bp.route("/me", methods=["GET"])
def me():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()

    if not token:
        return jsonify({"error": "Missing token"}), 401

    try:
        payload = _decode_access_token(token)
    except SignatureExpired:
        return jsonify({"error": "Token expired"}), 401
    except BadSignature:
        return jsonify({"error": "Invalid token"}), 401

    user = get_user(payload.get("email"))
    if not user.data:
        return jsonify({"error": "User not found"}), 404

    stored_user = user.data[0]
    return jsonify({
        "id": stored_user.get("id"),
        "full_name": stored_user.get("full_name"),
        "email": stored_user.get("email"),
    })