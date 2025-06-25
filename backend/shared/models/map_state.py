from shared.models.common import Faction, Continent


class FacilityState:
    world_id: int
    zone_id: Continent
    facility_id: int
    owning_faction_id: Faction
    last_updated: int


class MapState:
    world_id: int
    zone_id: Continent
    facility_states: dict[int, FacilityState]
