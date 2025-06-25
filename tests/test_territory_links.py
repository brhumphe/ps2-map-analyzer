import json

import pytest

from backend.map_tools import find_capturable_bases
from services.sanctuary.models.zone import ZoneDataResponse


@pytest.fixture(scope="module")
def map_state():
    with open("data/hossin-map_state.json") as f:
        yield json.load(f)

@pytest.fixture(scope="module")
def zone_info():
    with open("data/hossin-map-info-combined.json") as f:
        data = json.load(f)
        response = ZoneDataResponse(**data)
        yield response.zone_list[0]


def test_find_capturable_bases(map_state, zone_info):
    capturable = find_capturable_bases(1, map_state, zone_info)
    assert capturable  == {296000, 280000, 302020, 302030, 290000, 298000, 300020, 291000}
    capturable = find_capturable_bases(2, map_state, zone_info)
    assert capturable  == {292000, 280000, 281000, 297000, 287020, 298000, 275000}
    capturable = find_capturable_bases(3, map_state, zone_info)
    assert capturable  == {276000, 287000, 300000, 293000, 300010, 274000, 301010, 275000, 300030}
    capturable = find_capturable_bases(4, map_state, zone_info)
    assert capturable  == set()
