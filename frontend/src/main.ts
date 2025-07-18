import * as L from 'leaflet';
import {ZoneService} from "@/services/zone_service";
import {Continent} from "@/types/common";
import {
  configureMapTileLayer,
  drawLattice,
  drawRegion,
  initMouseCoordinatesPopup,
  placeRegionMarkers
} from "@/utilities/leaflet_utils"


// Map creation
const map = L.map('map_div', {
  crs: L.CRS.Simple, center: [0, 0],
}).setView([-2250, -2250], 0);
initMouseCoordinatesPopup(map);
configureMapTileLayer(map);

// Fetch map data
const zoneService = new ZoneService();
const zone = await zoneService.fetchZone(Continent.INDAR);
placeRegionMarkers(zone, map);
drawLattice(zone, map);

for (const region of zone.regions) {
  drawRegion(zone, region.map_region_id, map)
}
// drawRegion(zone, 2419, map)
