from pydantic import BaseModel
from typing import List

from shared.models.common import Continent, Faction, RegionID
from shared.models.map_state import RegionState, MapState


class RegionStateResponse(BaseModel):
    world_id: int
    zone_id: Continent
    timestamp: int
    map_region_id: RegionID
    owning_faction_id: Faction

    def as_region_state(self) -> RegionState:
        return RegionState(
            map_region_id=self.map_region_id,
            owning_faction_id=self.owning_faction_id,
            last_updated=self.timestamp,
        )


class MapStateResponse(BaseModel):
    map_state_list: List[RegionStateResponse]
    returned: int

    def as_map_state(self) -> MapState:
        zone_state = self.map_state_list[0]
        world_id = zone_state.world_id
        zone_id = zone_state.zone_id
        return MapState(
            world_id=world_id,
            zone_id=zone_id,
            region_states={s.map_region_id: s.as_region_state() for s in self.map_state_list},
        )
