from typing import cast, Any

from services.common import fetch_json
from services.honu.models.metagame import MetaGameState


async def fetch_metagame_data(client) -> MetaGameState:
    data = await fetch_json(client, "https://wt.honu.pw/api/world/overview")
    return MetaGameState.from_json_list(cast(list[dict[str, Any]], data))
