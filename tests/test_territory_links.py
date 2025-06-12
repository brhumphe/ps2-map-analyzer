import json

import pytest

from map_tools import find_capturable_bases


@pytest.fixture(scope="module")
def facility_links():
    with open("data/hossin-facility-links.json") as f:
        yield json.load(f)

@pytest.fixture(scope="module")
def map_state():
    with open("data/hossin-map_state.json") as f:
        yield json.load(f)

@pytest.fixture(scope="module")
def region_list():
    with open("data/hossin-region_list.json") as f:
        yield json.load(f)

def test_find_capturable_bases(facility_links, map_state, region_list):
    capturable = find_capturable_bases(1, facility_links, map_state, region_list)
    assert capturable  == {296000, 280000, 302020, 302030, 290000, 298000, 300020, 291000}
    capturable = find_capturable_bases(2, facility_links, map_state, region_list)
    assert capturable  == {292000, 280000, 281000, 297000, 287020, 298000, 275000}
    capturable = find_capturable_bases(3, facility_links, map_state, region_list)
    assert capturable  == {276000, 287000, 300000, 293000, 300010, 274000, 301010, 275000, 300030}
    capturable = find_capturable_bases(4, facility_links, map_state, region_list)
    assert capturable  == set()
