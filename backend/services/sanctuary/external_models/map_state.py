from pydantic import BaseModel
from typing import List


class RegionState(BaseModel):
    world_id: int
    zone_id: int
    timestamp: int
    map_region_id: int
    owning_faction_id: int


class MapStateResponse(BaseModel):
    map_state_list: List[RegionState]
    returned: int
