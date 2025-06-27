from typing import List
from pydantic import BaseModel, computed_field, Field

from shared.models.common import Continent, FacilityID, FacilityType, RegionID
from shared.models.zone import Region, Zone


class Link(BaseModel):
    facility_id_a: int
    facility_id_b: int


class CaptureReward(BaseModel):
    description: str = Field(alias="Description")
    amount: int = Field(alias="Amount")


class HexData(BaseModel):
    x: int
    y: int
    hex_type: int
    type_name: str


class RegionData(BaseModel):
    map_region_id: RegionID
    facility_id: FacilityID
    facility_name: str
    facility_type_id: FacilityType
    location_x: float
    location_y: float
    location_z: float
    capture_reward: CaptureReward | None = Field(alias="CaptureReward", default=None)
    hexes: List[HexData]

    def as_region(self) -> Region:
        return Region(
            id=self.map_region_id,
            facility_id=self.facility_id,
            name=self.facility_name,
            facility_type=self.facility_type_id,
            location=(self.location_x, self.location_y, self.location_z),
        )


class ZoneData(BaseModel):
    zone_id: Continent
    code: str
    hex_size: int
    geometry_id: int
    type: str
    dynamic: bool
    links: List[Link] = Field(repr=False)
    regions: List[RegionData] = Field(repr=False)

    def as_zone(self) -> Zone:
        regions = {z.map_region_id: z.as_region() for z in self.regions}
        return Zone(
            zone_id=self.zone_id,
            name=self.code,
            hex_size=self.hex_size,
            lattice=self.lattice,
            regions=regions,
        )

    @computed_field
    def lattice(self) -> dict[FacilityID, set[FacilityID]]:
        lattice = {}
        for link in self.links:
            lattice.setdefault(link.facility_id_a, set()).add(link.facility_id_b)
            lattice.setdefault(link.facility_id_b, set()).add(link.facility_id_a)
        return lattice


class ZoneDataResponse(BaseModel):
    zone_list: List[ZoneData]
    returned: int
