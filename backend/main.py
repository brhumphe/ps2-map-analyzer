import asyncio
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from analysis.territory import find_capturable_bases
from services.sanctuary.client import fetch_map_state, fetch_zone_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    # customize settings
    limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
    timeout = httpx.Timeout(5.0, read=15.0)  # 15s timeout on read. 5s timeout elsewhere.

    # Initialize the Client on startup and add it to the state
    async with httpx.AsyncClient(limits=limits, timeout=timeout) as client:
        yield {"client": client}
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
    map_state_co = fetch_map_state(client, world_id, zone_id)

    zone_data_co = fetch_zone_data(client, zone_id)

    map_state, zone_data = await asyncio.gather(map_state_co, zone_data_co)

    return find_capturable_bases(faction_id, map_state, zone_data)
