import json
from dataclasses import dataclass
from urllib import error, parse, request

from config import Config


@dataclass
class SupabaseResponse:
    data: list


def _is_missing_user_email_column_error(exc):
    message = str(exc).lower()
    return (
        "pgrst204" in message
        or "42703" in message
        or "could not find the 'user_email' column" in message
        or "predictions.user_email" in message
    )


def _service_headers():
    if not Config.SUPABASE_URL or not Config.SUPABASE_KEY:
        raise RuntimeError(
            "Missing SUPABASE_URL or SUPABASE_KEY. Add them to backend/.env (or backend/uploads/.env temporarily)."
        )

    return {
        "apikey": Config.SUPABASE_KEY,
        "Authorization": f"Bearer {Config.SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Prefer": "return=representation",
    }


def _rest_url(table_name, query_string=""):
    base_url = Config.SUPABASE_URL.rstrip("/")
    suffix = f"/rest/v1/{table_name}"
    if query_string:
        suffix = f"{suffix}?{query_string}"
    return f"{base_url}{suffix}"


def _request_json(url, method, body=None):
    payload = None if body is None else json.dumps(body).encode("utf-8")
    req = request.Request(url, data=payload, method=method, headers=_service_headers())

    try:
        with request.urlopen(req, timeout=30) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else []
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Supabase request failed ({exc.code}): {details or exc.reason}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"Supabase request failed: {exc.reason}") from exc


# Save user
def create_user(name, email, password):
    data = _request_json(
        _rest_url("users"),
        "POST",
        {
            "full_name": name,
            "email": email,
            "password": password,
        },
    )
    return SupabaseResponse(data=data)


# Get user
def get_user(email):
    query_string = parse.urlencode({"email": f"eq.{email}", "select": "*"})
    data = _request_json(_rest_url("users", query_string), "GET")
    return SupabaseResponse(data=data)


# Save prediction
def save_prediction(image_url, stage, confidence, user_email=None):
    payload = {
        "image_url": image_url,
        "stage": stage,
        "confidence": confidence,
    }

    if user_email:
        payload["user_email"] = user_email

    try:
        data = _request_json(_rest_url("predictions"), "POST", payload)
    except RuntimeError as exc:
        # Older schemas may not have predictions.user_email yet.
        # Retry without that field so the prediction flow still succeeds.
        if user_email and _is_missing_user_email_column_error(exc):
            fallback_payload = {
                "image_url": image_url,
                "stage": stage,
                "confidence": confidence,
            }
            try:
                data = _request_json(_rest_url("predictions"), "POST", fallback_payload)
            except RuntimeError:
                return SupabaseResponse(data=[])
        else:
            raise

    if user_email:
        has_user_email = any(
            str((row or {}).get("user_email") or "").strip().lower() == user_email.strip().lower()
            for row in (data or [])
        )
        if not has_user_email:
            return SupabaseResponse(data=[])

    return SupabaseResponse(data=data)


def get_predictions(user_email=None, limit=50):
    base_query = {"select": "*", "order": "created_at.desc", "limit": str(limit)}

    try:
        data = _request_json(_rest_url("predictions", parse.urlencode(base_query)), "GET")
    except RuntimeError as exc:
        # Older schemas may not have predictions.user_email yet.
        # Retry without user_email filtering, then safely filter in Python.
        if user_email and _is_missing_user_email_column_error(exc):
            fallback_query = {"select": "*", "order": "created_at.desc", "limit": str(limit)}
            try:
                data = _request_json(_rest_url("predictions", parse.urlencode(fallback_query)), "GET")
            except RuntimeError:
                return SupabaseResponse(data=[])
        else:
            raise

    if user_email:
        # Only return rows matching the user's email (new analyses).
        # Don't include rows with null user_email - they have ambiguous ownership.
        data = [
            row for row in (data or [])
            if str((row or {}).get("user_email") or "").strip().lower() == user_email.strip().lower()
        ]

    return SupabaseResponse(data=data)