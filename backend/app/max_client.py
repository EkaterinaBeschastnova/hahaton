import sys

import httpx
import truststore

from .config import settings


# MAX должен использовать то же системное хранилище сертификатов Windows,
# что и основной процесс чат-бота.
if sys.platform == "win32":
    truststore.inject_into_ssl()


class MaxClient:
    async def send_message(self, user_id: str | int, text: str):
        if not settings.max_bot_token:
            return {"ok": False, "skipped": True, "reason": "MAX_BOT_TOKEN is empty"}

        headers = {
            "Authorization": settings.max_bot_token,
            "Content-Type": "application/json",
        }
        payload = {"text": text}
        async with httpx.AsyncClient(timeout=20, verify=False) as client:
            r = await client.post(
                f"{settings.max_api_url.rstrip('/')}/messages",
                params={"user_id": int(user_id)},
                headers=headers,
                json=payload,
            )
            r.raise_for_status()
            return r.json()

max_client = MaxClient()
