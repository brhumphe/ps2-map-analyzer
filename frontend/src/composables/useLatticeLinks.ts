import { reactive, computed, readonly } from 'vue'
import * as L from 'leaflet'
import type {FacilityLinkKey, Zone} from '@/types/zone_types'
import { world_to_latLng } from '@/utilities/coordinates'
import {zoneUtils} from "@/utilities/zone_utils";

interface LatticeLink {
  points: L.LatLng[]
  style: L.PolylineOptions
  facilityA: number
  facilityB: number
}

export function useLatticeLinks() {
  // Reactive collection of lattice links
  const latticeLinks = reactive(new Map<string, LatticeLink>())

  /**
   * Initialize lattice links from zone data
   */
  const initializeLatticeLinks = (zone: Zone, defaultStyle: L.PolylineOptions = { color: 'yellow', weight: 2 }) => {
    // Clear existing links
    latticeLinks.clear()

    const facilityCoords = zoneUtils.extractFacilityCoordinates(zone)

    for (const link of zone.links) {
      const facilityA = link.facility_id_a
      const facilityB = link.facility_id_b

      // Get coordinates for both facilities
      const coordsA = facilityCoords[facilityA]
      const coordsB = facilityCoords[facilityB]

      if (!coordsA || !coordsB) {
        console.warn(`Missing coordinates for link ${facilityA}-${facilityB}`)
        continue
      }

      // Convert to LatLng
      const pointA = world_to_latLng(coordsA)
      const pointB = world_to_latLng(coordsB)

      // Create link entry
      const linkKey = zoneUtils.getLinkKey(link)
      latticeLinks.set(linkKey, {
        points: [pointA, pointB],
        style: { ...defaultStyle },
        facilityA,
        facilityB
      })
    }

    console.log(`Initialized ${latticeLinks.size} lattice links`)
  }

  /**
   * Update style for a specific lattice link
   */
  const updateLinkStyle = (linkKey: FacilityLinkKey, style: Partial<L.PolylineOptions>) => {
    // const linkKey = zoneUtils.getLinkKey(facilityA, facilityB)
    const link = latticeLinks.get(linkKey)

    if (link) {
      // Merge new style with existing style
      Object.assign(link.style, style)
    } else {
      console.warn(`Lattice link ${linkKey} not found`)
    }
  }

  /**
   * Update styles for multiple links
   */
  const updateMultipleLinkStyles = (updates: Array<{
    link: FacilityLinkKey,
    style: Partial<L.PolylineOptions>
  }>) => {
    for (const update of updates) {
      updateLinkStyle(update.link, update.style)
    }
  }

  /**
   * Get a specific lattice link
   */
  const getLink = (linkKey: FacilityLinkKey) => {
    return latticeLinks.get(linkKey)
  }

  /**
   * Clear all lattice links
   */
  const clearLinks = () => {
    latticeLinks.clear()
  }

  /**
   * Get count of current links
   */
  const linkCount = computed(() => latticeLinks.size)

  return {
    // State (readonly to prevent external mutation)
    latticeLinks: readonly(latticeLinks),
    linkCount,

    // Actions
    initializeLatticeLinks,
    updateLinkStyle,
    updateMultipleLinkStyles,
    getLink,
    clearLinks,
  }
}
