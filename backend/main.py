import asyncio
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from map_tools import find_capturable_bases


async def fetch_json(client, url, params=None):
    response = await client.get(url, params=params)
    response.raise_for_status()
    return response.json()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # customize settings
    limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
    timeout = httpx.Timeout(5.0, read=15.0)  # 15s timeout on read. 5s timeout elsewhere.

    # Initialize the Client on startup and add it to the state
    async with httpx.AsyncClient(limits=limits, timeout=timeout) as client:
        yield {'client': client}
        # The Client closes on shutdown


app = FastAPI(lifespan=lifespan)

# Add CORS middleware for PyCharm's built-in web server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:63342",  # PyCharm's built-in web server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/ping")
async def ping():
    return {"message": "pong", "status": "healthy"}


@app.get("/api/capturable-bases/")
async def capturable_bases(world_id: int, zone_id: int, faction_id: int, request: Request):
    client = request.state.client
    map_state_co = fetch_json(client, "https://census.lithafalcon.cc/get/ps2/map_state",
                              params={"world_id": world_id, "zone_id": zone_id, "c:censusJSON": False,
                                      "c:show": "world_id,zone_id,timestamp,owning_faction_id,map_region_id"})

    region_list_co = fetch_json(client, "https://census.lithafalcon.cc/get/ps2/map_region",
                                params={"zone_id": zone_id, "c:censusJSON": False,
                                        "c:show": "map_region_id,facility_id,zone_id"})

    facility_links_co = fetch_json(client, "https://census.lithafalcon.cc/get/ps2/facility_link",
                                   params={"zone_id": zone_id, "c:censusJSON": False})

    map_state, region_list, facility_links = await asyncio.gather(map_state_co,
                                                                  region_list_co,
                                                                  facility_links_co)

    return find_capturable_bases(faction_id, facility_links, map_state, region_list)
