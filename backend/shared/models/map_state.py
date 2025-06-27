from pydantic import BaseModel

from shared.models.common import Continent, Faction, RegionID, WorldID


class RegionState(BaseModel):
    map_region_id: RegionID
    owning_faction_id: Faction
    last_updated: int


class MapState(BaseModel):
    world_id: WorldID
    zone_id: Continent
    region_states: dict[RegionID, RegionState]
