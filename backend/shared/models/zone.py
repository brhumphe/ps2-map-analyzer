from pydantic import BaseModel


class Facility(BaseModel):
    id: int
    name: str
    type_id: int
    type: str
    location: tuple[float, float, float] = (0.0, 0.0, 0.0)
    capture_reward: tuple[str, int] = (
        "None",
        0,
    )
    hexes: list[tuple[int, int, int]] = []

class Zone(BaseModel):
    world_id: int
    zone_id: int
    name: str
    hex_size: int
    type: str
    dynamic: bool
    lattice: dict[int, set[int]]
