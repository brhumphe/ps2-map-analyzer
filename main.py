import json

import httpx
from fastapi import FastAPI

from map_tools import find_capturable_bases

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/capturable-bases/")
async def capturable_bases(world_id: int, zone_id: int, faction_id: int):
    # async with httpx.AsyncClient() as client:
    #     response = await client.get(
    #         f"https://census.daybreakgames.com/get/ps2:v2/zone?zone_id={zone_id}&c:join=map_region^list:1^inject_at:regions^hide:zone_id(map_hex^list:1^inject_at:hexes^hide:zone_id%27map_region_id)&c:lang=en", )
    #     response.raise_for_status()
    #     zone_list = response.json()
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://census.lithafalcon.cc/get/ps2/map_state",
                                    params={"world_id": world_id, "zone_id": zone_id, "c:censusJSON": False,
                                            "c:show": "world_id,zone_id,timestamp,owning_faction_id,map_region_id"
                                            })
        response.raise_for_status()
        map_state = response.json()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://census.lithafalcon.cc/get/ps2/map_region",
            params={"zone_id": zone_id, "c:censusJSON": False, "c:show": "map_region_id,facility_id,zone_id"}
        )
        response.raise_for_status()
        region_list = response.json()
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://census.lithafalcon.cc/get/ps2/facility_link",
                                    params={"zone_id": zone_id, "c:censusJSON": False}
                                    )
        response.raise_for_status()
        facility_links = response.json()

    return find_capturable_bases(faction_id, facility_links, map_state, region_list)
