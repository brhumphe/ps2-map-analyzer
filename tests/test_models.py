import json

from services.sanctuary.external_models.map_state import MapStateResponse
from services.sanctuary.external_models.zone import ZoneDataResponse
from shared.models.common import Continent, FacilityType, Faction


def test_zone_response_data():
    with open("data/hossin-map-info-combined.json") as f:
        data = json.load(f)
    resp = ZoneDataResponse(**data)
    assert len(resp.zone_list) == 1
    assert resp.zone_list[0].zone_id == Continent.HOSSIN
    assert resp.zone_list[0].regions[0].facility_name == "Sharpe's Run"
    assert resp.zone_list[0].regions[0].facility_type_id == FacilityType.SMALL_OUTPOST


def test_zone_data_as_zone_model():
    with open("data/hossin-map-info-combined.json") as f:
        data = json.load(f)
    resp = ZoneDataResponse(**data)
    region = resp.zone_list[0].regions[0].as_region()
    assert region.name == "Sharpe's Run"
    zone = resp.zone_list[0].as_zone()
    assert zone.name == "Hossin"
    assert zone.zone_id == Continent.HOSSIN
    assert zone.lattice[302020] == {297000, 302010, 302000}
    assert 302020 in zone.lattice[297000]


def test_map_state_response():
    with open("data/hossin-map_state.json") as f:
        data = json.load(f)
    resp = MapStateResponse(**data)
    assert resp.map_state_list[0].map_region_id == 4101
    assert resp.map_state_list[0].owning_faction_id == Faction.VS


def test_map_state_as_map_state():
    with open("data/hossin-map_state.json") as f:
        data = json.load(f)
    state = MapStateResponse(**data).as_map_state()
    assert state.zone_id == Continent.HOSSIN
    assert state.region_states[4101].owning_faction_id == Faction.VS
