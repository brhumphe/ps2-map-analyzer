from pydantic import BaseModel, computed_field, Field

from shared.models.common import Continent, FacilityID, FacilityType, HexType, RegionID


class Region(BaseModel):
    id: RegionID
    name: str
    facility_id: FacilityID
    facility_type: FacilityType
    location: tuple[float, float, float] = Field((0.0, 0.0, 0.0), repr=False)
    capture_reward: tuple[str, int] = Field(default=("", 0), repr=False)
    hexes: list[tuple[int, int, HexType]] = Field(default_factory=list, repr=False)


class Zone(BaseModel):
    """
    World-independent zone data.
    """

    zone_id: Continent
    name: str
    hex_size: int
    regions: dict[RegionID, Region] = Field(repr=False)
    lattice: dict[FacilityID, set[FacilityID]] = Field(
        repr=False, description="Bidirectional dictionary of links between facilities."
    )

    @computed_field
    def facility_to_region(self) -> dict[FacilityID, RegionID]:
        return {r.facility_id: r.id for r in self.regions.values()}
