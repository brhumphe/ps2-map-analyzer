export enum Faction {
  NONE = 0,
  VS = 1, // Vanu Sovereignty
  NC = 2, // New Conglomerate
  TR = 3, // Terran Republic
  NSO = 4, // NS Operatives
}

export enum FacilityType {
  DEFAULT = 1,
  AMP_STATION = 2,
  BIO_LAB = 3,
  TECH_PLANT = 4,
  LARGE_OUTPOST = 5,
  SMALL_OUTPOST = 6,
  WARPGATE = 7,
  INTERLINK_FACILITY = 8,
  CONSTRUCTION_OUTPOST = 9,
  RELIC_OUTPOST = 10,
  CONTAINMENT_SITE = 11,
  TRIDENT = 12,
  SEAPOST = 13,
  LARGE_OUTPOST_CTF = 14,
  SMALL_OUTPOST_CTF = 15,
  AMP_STATION_CTF = 16,
  CONSTRUCTION_OUTPOST_CTF = 17,
}

export enum Continent {
  INDAR = 2,
  HOSSIN = 4,
  AMERISH = 6,
  ESAMIR = 8,
  OSHUR = 344,
}

export const ContinentName = new Map<Continent, string>([
  [Continent.INDAR, 'Indar'],
  [Continent.HOSSIN, 'Hossin'],
  [Continent.AMERISH, 'Amerish'],
  [Continent.ESAMIR, 'Esamir'],
  [Continent.OSHUR, 'Oshur'],
]);

export enum World {
  Osprey = 1,
  Wainwright = 10,
  Jaeger = 19,
  SolTech = 40,
}

export const WorldName = new Map<World, string>([
  [World.Osprey, 'Osprey'],
  [World.Wainwright, 'Wainwright'],
  [World.Jaeger, 'Jaeger'],
  [World.SolTech, 'SolTech'],
]);

export type RegionID = number;
export type WorldID = number;
export type FacilityID = number;
