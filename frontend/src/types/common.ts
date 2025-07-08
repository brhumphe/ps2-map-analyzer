export enum Faction {
  NONE = 0,
  VS = 1,   // Vanu Sovereignty
  NC = 2,   // New Conglomerate
  TR = 3,   // Terran Republic
  NSO = 4,  // NS Operatives
}

const FactionColor = new Map<Faction, number>([
    [Faction.NONE, 7500402],
    [Faction.VS, 4460130],
    [Faction.NC, 19328],
    [Faction.TR, 10357519],
    [Faction.NSO, 5662067]
]);


export enum Continent {
  INDAR = 2,
  HOSSIN = 4,
  AMERISH = 6,
  ESAMIR = 8
}

export type RegionID = number;
export type WorldID = number;
export type FacilityID = number;
