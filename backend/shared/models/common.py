from enum import Enum


class Faction(Enum):
    NEUTRAL = 0
    VS = 1
    NC = 2
    TR = 3
    NS = 4

class HexType(Enum):
    UNRESTRICTED = 0
    UNKNOWN = 1
    FACTION_RESTRICTED = 2

class FacilityType(Enum):
    DEFAULT = 1
    AMP_STATION = 2
    BIO_LAB = 3
    TECH_PLANT = 4
    LARGE_OUTPOST = 5
    SMALL_OUTPOST = 6
    WARPGATE = 7
    INTERLINK = 8
    CONSTRUCTION_OUTPOST = 9
    RELIC = 10
    CONTAINMENT_SITE = 11
    TRIDENT = 12
    SEAPOST = 13
    LARGE_CTF = 14
    SMALL_CTF = 15
    AMP_CTF = 16
    CONSTRUCTION_CTF = 17

class Continent(Enum):
    INDAR = 2
    HOSSIN = 4
    AMERISH = 6
    ESAMIR = 8
    OSHUR = 344
