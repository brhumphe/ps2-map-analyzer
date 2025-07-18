import { reactive, computed } from 'vue'
import * as L from 'leaflet'
import type {RegionKey, Zone} from '@/types/zone_types'
import type { RegionID } from '@/types/common'
import { world_to_latLng } from '@/utilities/coordinates'
import { zoneUtils } from '@/utilities/zone_utils'
import { HexGeometry } from '@/utilities/hexagons'

interface RegionPolygon {
  points: L.LatLng[]
  style: Partial<L.PolylineOptions>
  regionId: RegionID
  facilityName: string
}

export function useRegionPolygons() {
  // Reactive collection of region polygons
  const regionPolygons = reactive(new Map<RegionKey, RegionPolygon>())

  /**
   * Initialize region polygons from zone data
   */
  const initializeRegionPolygons = (
    zone: Zone,
    defaultStyle: L.PolylineOptions = {
      color: 'white',
      fillColor: 'purple',
      fillOpacity: 0.3,
      weight: 2
    }
  ) => {
    // Clear existing polygons
    regionPolygons.clear()

    const geometry = new HexGeometry(zone.hex_size)

    for (const region of zone.regions) {
      try {
        // Extract hex coordinates for this region
        const hexCoordinates = zoneUtils.extractRegionHexCoords(zone, region.map_region_id)

        if (hexCoordinates.length === 0) {
          console.warn(`No hex coordinates found for region ${region.map_region_id}`)
          continue
        }

        // Get boundary vertices for the region
        const vertices = geometry.getBoundaryVertices(hexCoordinates)

        // Convert to LatLng coordinates
        const polygonPoints = vertices.map(coord => world_to_latLng(coord))

        // Create region entry
        const key = zoneUtils.getRegionKey(region.map_region_id)
        regionPolygons.set(key, {
          points: polygonPoints,
          style: { ...defaultStyle },
          regionId: region.map_region_id,
          facilityName: region.facility_name
        })

      } catch (error) {
        console.warn(`Failed to create polygon for region ${region.map_region_id}:`, error)
      }
    }

    console.log(`Initialized ${regionPolygons.size} region polygons`)
  }

  /**
   * Update style for a specific region
   */
  const updateRegionStyle = (regionId: RegionID, style: Partial<L.PolylineOptions>) => {
    const key = zoneUtils.getRegionKey(regionId)
    const region = regionPolygons.get(key)

    if (region) {
      // Merge new style with existing style
      Object.assign(region.style, style)
    } else {
      console.warn(`Region ${regionId} not found`)
    }
  }

  /**
   * Update styles for multiple regions
   */
  const updateMultipleRegionStyles = (updates: Array<{
    regionId: RegionID
    style: Partial<L.PolylineOptions>
  }>) => {
    for (const update of updates) {
      updateRegionStyle(update.regionId, update.style)
    }
  }

  /**
   * Update region style based on faction control
   * This is where territory control logic will hook in
   */
  const updateRegionFactionStyle = (regionId: RegionID, factionId: number) => {
    // Faction color mapping - this could be moved to a separate utility
    const factionColors = {
      1: { fillColor: '#9932CC', color: '#6A0DAD' }, // VS - Purple
      2: { fillColor: '#4169E1', color: '#0000CD' }, // NC - Blue
      3: { fillColor: '#DC143C', color: '#8B0000' }, // TR - Red
    }

    const factionStyle = factionColors[factionId as keyof typeof factionColors]
    if (factionStyle) {
      updateRegionStyle(regionId, factionStyle)
    } else {
      console.warn(`Unknown faction ID: ${factionId}`)
    }
  }

  /**
   * Get a specific region polygon
   */
  const getRegion = (regionId: RegionID) => {
    const key = zoneUtils.getRegionKey(regionId)
    return regionPolygons.get(key)
  }

  /**
   * Clear all region polygons
   */
  const clearRegions = () => {
    regionPolygons.clear()
  }

  /**
   * Get count of current regions
   */
  const regionCount = computed(() => regionPolygons.size)

  /**
   * Get all region IDs
   */
  const regionIds = computed(() => {
    return Array.from(regionPolygons.values()).map(region => region.regionId)
  })

  return {
    // State
    regionPolygons,
    regionCount,
    regionIds,

    // Actions
    initializeRegionPolygons,
    updateRegionStyle,
    updateMultipleRegionStyles,
    updateRegionFactionStyle,
    getRegion,
    clearRegions,
  }
}
