from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class PlayerCounts(BaseModel):
    """Player counts by faction"""

    all: int
    vs: int  # Vanu Sovereignty
    nc: int  # New Conglomerate
    tr: int  # Terran Republic
    unknown: int


class TerritoryControl(BaseModel):
    """Territory control counts by faction"""

    vs: int  # Vanu Sovereignty territories
    nc: int  # New Conglomerate territories
    tr: int  # Terran Republic territories
    total: int  # Total territories in the zone


class AlertStatus(BaseModel):
    """Active alert information"""

    id: int
    timestamp: datetime
    duration: int  # Duration in seconds
    zoneID: int
    worldID: int
    alertID: int
    instanceID: int
    name: str
    victorFactionID: Optional[int]
    warpgateVS: int
    warpgateNC: int
    warpgateTR: int
    zoneFacilityCount: int
    countVS: Optional[int]
    countNC: Optional[int]
    countTR: Optional[int]
    participants: int

    class Config:
        populate_by_name = True


class AlertInfo(BaseModel):
    """Alert type information"""

    id: int
    name: str
    description: str
    typeID: int
    durationMinutes: int

    class Config:
        populate_by_name = True


class ZoneMetaState(BaseModel):
    """Zone/continent information"""

    zoneID: int
    worldID: int
    isOpened: bool
    unstableState: int
    alert: Optional[AlertStatus]
    alertInfo: Optional[AlertInfo]
    alertStart: Optional[datetime]
    alertEnd: Optional[datetime]
    lastLocked: Optional[datetime]
    playerCount: int
    players: PlayerCounts
    territoryControl: TerritoryControl

    class Config:
        populate_by_name = True


class WorldMetaState(BaseModel):
    """Game world/server information"""

    worldID: int
    worldName: str
    playersOnline: int
    zones: List[ZoneMetaState]

    class Config:
        populate_by_name = True


class MetaGameState(BaseModel):
    """Root model representing the complete game state"""

    worlds: List[WorldMetaState] = Field(alias="__root__")

    class Config:
        populate_by_name = True

    @classmethod
    def from_json_list(cls, data: List[dict]) -> "MetaGameState":
        """Create GameState from a list of world dictionaries"""
        return cls(worlds=data)


# Alternative root model if you prefer direct list access
WorldList = List[WorldMetaState]
