import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl, unquote
from .config import settings

def validate_max_init_data(init_data: str, max_age_seconds: int = 86400):
    if not init_data or not settings.max_bot_token:
        return None

    # MAX docs: WebAppData is itself a URL-encoded key/value string.
    outer = dict(parse_qsl(init_data, keep_blank_values=True))
    web_app_data = outer.get("WebAppData")
    if not web_app_data:
        # Some environments may expose the WebAppData string directly.
        web_app_data = init_data

    pairs = parse_qsl(web_app_data, keep_blank_values=True)
    if sum(1 for k, _ in pairs if k == "hash") != 1:
        return None

    original_hash = next(v for k, v in pairs if k == "hash")
    data = [(k, v) for k, v in pairs if k != "hash"]
    data.sort(key=lambda x: x[0])
    launch_params = "\n".join(f"{k}={v}" for k, v in data)

    secret_key = hmac.new(
        b"WebAppData",
        settings.max_bot_token.encode(),
        hashlib.sha256
    ).digest()

    calculated = hmac.new(
        secret_key,
        launch_params.encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(calculated, original_hash):
        return None

    auth_date = next((v for k, v in data if k == "auth_date"), None)
    if auth_date and time.time() - int(auth_date) > max_age_seconds:
        return None

    user_raw = next((v for k, v in data if k == "user"), None)
    if not user_raw:
        return None

    try:
        return json.loads(unquote(user_raw))
    except json.JSONDecodeError:
        return None
