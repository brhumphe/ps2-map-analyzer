export enum Faction {
  NONE = 0,
  VS = 1, // Vanu Sovereignty
  NC = 2, // New Conglomerate
  TR = 3, // Terran Republic
  NSO = 4, // NS Operatives
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
