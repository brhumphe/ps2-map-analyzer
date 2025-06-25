from typing import Any

import httpx

from services.sanctuary.models.map_state import MapStateResponse
from services.sanctuary.models.zone import ZoneData, ZoneDataResponse


async def fetch_json(client: httpx.AsyncClient, url: str, params: dict = None) -> dict[str, Any]:
    response = await client.get(url, params=params)
    response.raise_for_status()
    return response.json()


async def fetch_map_state(client, world_id, zone_id) -> MapStateResponse:
    data = await fetch_json(client, "https://census.lithafalcon.cc/get/ps2/map_state",
                            params={"world_id": world_id, "zone_id": zone_id, "c:censusJSON": False,
                                    "c:show": "world_id,zone_id,timestamp,owning_faction_id,map_region_id"})
    return MapStateResponse(**data)


async def fetch_zone_data(client, zone_id) -> ZoneData:
    """
    https://census.lithafalcon.cc/get/ps2/zone?zone_id=2&c:join=map_region^list:1^inject_at:regions^hide:zone_id(map_hex^list:1^inject_at:hexes^hide:zone_id'map_region_id)&c:lang=en&c:censusJSON=false
    """
    data = await fetch_json(client, "https://census.lithafalcon.cc/get/ps2/zone",
                            params={"zone_id": zone_id,
                                    "c:join": "map_region^list:1^inject_at:regions^hide:zone_id(map_hex^list:1^inject_at:hexes^hide:zone_id'map_region_id)",
                                    "c:lang": "en", "c:censusJSON": "false"})
    response = ZoneDataResponse(**data)
    assert len(response.zone_list) == 1
    return response.zone_list[0]

__all__ = ["fetch_map_state", "fetch_zone_data"]
