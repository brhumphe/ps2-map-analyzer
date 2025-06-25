from typing import List
from pydantic import BaseModel, Field


class Link(BaseModel):
    facility_id_a: int
    facility_id_b: int


class CaptureReward(BaseModel):
    description: str = Field(alias="Description")
    amount: int = Field(alias="Amount")


class Hex(BaseModel):
    x: int
    y: int
    hex_type: int
    type_name: str


class Region(BaseModel):
    map_region_id: int
    facility_id: int
    facility_name: str
    facility_type_id: int
    facility_type: str
    location_x: float
    location_y: float
    location_z: float
    capture_reward: CaptureReward | None = Field(alias="CaptureReward", default=None)
    image_set_id: int
    image_id: int
    image_path: str
    hexes: List[Hex]


class ZoneData(BaseModel):
    zone_id: int
    code: str
    hex_size: int
    geometry_id: int
    type: str
    dynamic: bool
    links: List[Link]
    regions: List[Region]


class ZoneDataResponse(BaseModel):
    zone_list: List[ZoneData]
    returned: int