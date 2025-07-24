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
        console.log(`useLatticeLinks: Received ${newStyles?.size || 0} new styles`);
        if (newStyles && newStyles.size > 0 && latticeLinks.size > 0) {
          console.log(`useLatticeLinks: Applying styles to ${latticeLinks.size} existing links`);
          applyLinkStyles(newStyles);
        } else if (newStyles && newStyles.size > 0) {
          console.log('useLatticeLinks: Deferring style application - links not ready');
        }
      },
      { deep: true, immediate: true }
    );
  }

  /**
   * Apply styles from the analysis pipeline to links
   */
  const applyLinkStyles = (styles: Map<FacilityLinkKey, Partial<L.PolylineOptions>>) => {
    let appliedCount = 0;
    styles.forEach((style, linkKey) => {
      const link = latticeLinks.get(linkKey);
      
      if (link) {
        // Replace the entire style object to ensure reactivity
        link.style = { ...link.style, ...style };
        appliedCount++;
      } else {
        console.warn(`useLatticeLinks: Link ${linkKey} not found for styling`);
      }
    });
    console.log(`useLatticeLinks: Applied styles to ${appliedCount} links`);
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

    for (const link of zone.links) {
      const facilityA = link.facility_id_a;
      const facilityB = link.facility_id_b;

      // Get coordinates for both facilities
      const coordsA = facilityCoords[facilityA];
      const coordsB = facilityCoords[facilityB];

      if (!coordsA || !coordsB) {
        console.warn(`Missing coordinates for link ${facilityA}-${facilityB}`);
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

    console.log(`Initialized ${latticeLinks.size} lattice links`);
    console.log('Available link keys:', Array.from(latticeLinks.keys()).slice(0, 10));
    
    // Apply any pending styles after initialization
    if (linkStyles && linkStyles.value && linkStyles.value.size > 0) {
      console.log('useLatticeLinks: Applying pending styles after initialization');
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
    } else {
      console.warn(`Lattice link ${linkKey} not found`);
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
