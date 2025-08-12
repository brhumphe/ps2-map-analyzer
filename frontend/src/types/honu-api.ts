// Types generated from Honu API world overview response

export interface HonuWorldOverview {
  worldID: number;
  worldName: string;
  playersOnline: number;
  zones: HonuZoneStatus[];
}

export interface HonuZoneStatus {
  zoneID: number;
  worldID: number;
  isOpened: boolean;
  unstableState: number;
  alert: HonuAlert | null;
  alertInfo: HonuAlertInfo | null;
  alertStart: string | null; // ISO date string
  alertEnd: string | null; // ISO date string
  lastLocked: string; // ISO date string
  playerCount: number;
  players: HonuPlayerCounts;
  territoryControl: HonuTerritoryControl;
}

export interface HonuAlert {
  id: number;
  timestamp: string; // ISO date string
  duration: number; // seconds
  zoneID: number;
  worldID: number;
  alertID: number;
  instanceID: number;
  name: string;
  victorFactionID: number | null;
  warpgateVS: number;
  warpgateNC: number;
  warpgateTR: number;
  zoneFacilityCount: number;
  countVS: number | null;
  countNC: number | null;
  countTR: number | null;
  participants: number;
}

export interface HonuAlertInfo {
  id: number;
  name: string;
  description: string;
  typeID: number;
  durationMinutes: number;
}

export interface HonuPlayerCounts {
  all: number;
  vs: number;
  nc: number;
  tr: number;
  unknown: number;
}

export interface HonuTerritoryControl {
  vs: number;
  nc: number;
  tr: number;
  total: number;
}
