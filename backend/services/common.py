from typing import Any

import httpx


async def fetch_json(client: httpx.AsyncClient, url: str, params: dict = None) -> dict[str, Any]:
    response = await client.get(url, params=params)
    response.raise_for_status()
    return response.json()
