import { reactive, computed, watch, type Ref } from 'vue';
import * as L from 'leaflet';
import type { FacilityLinkKey, Zone } from '@/types/zone_types';
import { world_to_latLng } from '@/utilities/coordinates';
import { zoneUtils } from '@/utilities/zone_utils';

interface LatticeLink {
  points: L.LatLng[];
  style: L.PolylineOptions;
  facilityA: number;
  facilityB: number;
}

export function useLatticeLinks(
  linkStyles?: Ref<Map<FacilityLinkKey, Partial<L.PolylineOptions>>>
) {
  // Reactive collection of lattice links
  const latticeLinks = reactive(new Map<FacilityLinkKey, LatticeLink>());

  // Watch for link style changes and apply them automatically
  if (linkStyles) {
    watch(
      linkStyles,
      (newStyles) => {
        if (newStyles && newStyles.size > 0 && latticeLinks.size > 0) {
          applyLinkStyles(newStyles);
        }
      },
      { deep: true, immediate: true }
    );
  }

  /**
   * Apply styles from the analysis pipeline to links
   */
  const applyLinkStyles = (
    styles: Map<FacilityLinkKey, Partial<L.PolylineOptions>>
  ) => {
    styles.forEach((style, linkKey) => {
      const link = latticeLinks.get(linkKey);

      if (link) {
        // Replace the entire style object to ensure reactivity
        link.style = { ...link.style, ...style };
      }
    });
  };

  /**
   * Initialize lattice links from zone data
   */
  const initializeLatticeLinks = (
    zone: Zone,
    defaultStyle: L.PolylineOptions = { color: 'yellow', weight: 2 }
  ) => {
    // Clear existing links
    latticeLinks.clear();

    const facilityCoords = zoneUtils.extractFacilityCoordinates(zone);

    for (const link of zone.links.values()) {
      const facilityA = link.facility_id_a;
      const facilityB = link.facility_id_b;

      // Get coordinates for both facilities
      const coordsA = facilityCoords[facilityA];
      const coordsB = facilityCoords[facilityB];

      if (!coordsA || !coordsB) {
        continue;
      }

      // Convert to LatLng
      const pointA = world_to_latLng(coordsA);
      const pointB = world_to_latLng(coordsB);

      // Create link entry
      const linkKey = zoneUtils.getLinkKey(link);
      latticeLinks.set(linkKey, {
        points: [pointA, pointB],
        style: { ...defaultStyle },
        facilityA,
        facilityB,
      });
    }

    // Apply any pending styles after initialization
    if (linkStyles && linkStyles.value && linkStyles.value.size > 0) {
      applyLinkStyles(linkStyles.value);
    }
  };

  /**
   * Update style for a specific lattice link
   */
  const updateLinkStyle = (
    linkKey: FacilityLinkKey,
    style: Partial<L.PolylineOptions>
  ) => {
    // const linkKey = zoneUtils.getLinkKey(facilityA, facilityB)
    const link = latticeLinks.get(linkKey);

    if (link) {
      // Merge new style with existing style
      Object.assign(link.style, style);
    }
  };

  /**
   * Update styles for multiple links
   */
  const updateMultipleLinkStyles = (
    updates: Array<{
      link: FacilityLinkKey;
      style: Partial<L.PolylineOptions>;
    }>
  ) => {
    for (const update of updates) {
      updateLinkStyle(update.link, update.style);
    }
  };

  /**
   * Get a specific lattice link
   */
  const getLink = (linkKey: FacilityLinkKey) => {
    return latticeLinks.get(linkKey);
  };

  /**
   * Clear all lattice links
   */
  const clearLinks = () => {
    latticeLinks.clear();
  };

  /**
   * Get count of current links
   */
  const linkCount = computed(() => latticeLinks.size);

  return {
    // State
    latticeLinks,
    linkCount,

    // Actions
    initializeLatticeLinks,
    updateLinkStyle,
    updateMultipleLinkStyles,
    getLink,
    clearLinks,
  };
}
