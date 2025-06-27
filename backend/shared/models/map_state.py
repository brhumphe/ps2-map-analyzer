from pydantic import BaseModel

from shared.models.common import FacilityID, Faction, Continent


class FacilityState(BaseModel):
    facility_id: FacilityID
    owning_faction_id: Faction
    last_updated: int


class MapState(BaseModel):
    world_id: int
    zone_id: Continent
    facility_states: dict[FacilityID, FacilityState]
