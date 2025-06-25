import json

from services.sanctuary.models.zone import ZoneDataResponse


def test_zone_response_data():
    with open("data/hossin-map-info-combined.json") as f:
        data = json.load(f)
    resp = ZoneDataResponse(**data)
    assert len(resp.zone_list) == 1
    assert resp.zone_list[0].zone_id == 4
    assert resp.zone_list[0].regions[0].facility_name == "Sharpe's Run"
