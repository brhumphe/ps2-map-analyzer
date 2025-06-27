from shared.models.common import Faction
from shared.models.map_state import MapState
from shared.models.zone import Zone


def find_capturable_bases(faction_id, links, map_state, region_list):
    facilities = {}
    map_region_to_facility = {
        data["map_region_id"]: data["facility_id"]
        for data in region_list["map_region_list"]
        if "facility_id" in data
    }
    for facility_state in map_state["map_state_list"]:
        facility_state["facility_id"] = map_region_to_facility[facility_state["map_region_id"]]
        facilities[facility_state["facility_id"]] = facility_state
    capturable_facilities = set()
    for link in links["facility_link_list"]:
        facility_a = facilities.get(link["facility_id_a"])
        if not facility_a:
            continue
        faction_a = facility_a.get("owning_faction_id")
        facility_b = facilities.get(link["facility_id_b"])
        if not facility_b:
            continue
        faction_b = facility_b["owning_faction_id"]
        if (faction_a == faction_id or faction_b == faction_id) and faction_a != faction_b:
            if facility_a["owning_faction_id"] == faction_id:
                capturable_facilities.add(facility_b["facility_id"])
            else:
                capturable_facilities.add(facility_a["facility_id"])
    return capturable_facilities


def find_capturable_bases_v2(faction: Faction, state: MapState, zone: Zone):
    raise NotImplementedError
