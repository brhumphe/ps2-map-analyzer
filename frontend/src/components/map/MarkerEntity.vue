<template>
  <!-- Headless component - no visual output -->
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import * as L from 'leaflet';
import { useLeafletMap } from '@/composables/useLeafletMap';

// Component props
interface Props {
  id: string;
  position: L.LatLng;
  options?: L.MarkerOptions;
  popup?: string;
  tooltip?: string;
  tooltipOptions?: L.TooltipOptions;
}

const props = defineProps<Props>();

// Get map utilities from the singleton
const { getMap, hasMap } = useLeafletMap();

// Leaflet marker instance
const marker = ref<L.Marker>();

// Create the marker and add it to the map
const createMarker = () => {
  // Check if map is available
  if (!hasMap()) {
    console.debug(`MarkerEntity[${props.id}]: Map not yet initialized`);
    return;
  }

  const map = getMap();

  if (!props.position) {
    console.error(`MarkerEntity[${props.id}]: Position not provided`);
    return;
  }

  try {
    // Create the Leaflet marker
    const newMarker = L.marker(props.position, props.options);

    // Add popup if provided
    if (props.popup) {
      newMarker.bindPopup(props.popup);
    }

    // Add tooltip if provided
    if (props.tooltip) {
      const tooltipOptions: L.TooltipOptions = {
        permanent: false,
        direction: 'center',
        ...props.tooltipOptions,
      };
      newMarker.bindTooltip(props.tooltip, tooltipOptions);
    }

    // Add to map
    newMarker.addTo(map);

    // Store reference
    marker.value = newMarker;
  } catch (error) {
    console.error(`MarkerEntity[${props.id}]: Failed to create marker:`, error);
  }
};

// Remove the marker from the map
const removeMarker = () => {
  if (marker.value && hasMap()) {
    try {
      const map = getMap();

      // Close any open popup before removing the marker
      if (marker.value.isPopupOpen()) {
        marker.value.closePopup();
      }
      // Unbind popup and tooltip to prevent lingering references
      marker.value.unbindPopup();
      marker.value.unbindTooltip();

      // Check if map is still valid before attempting removal
      if (map.getContainer()) {
        map.removeLayer(marker.value);
      }
    } catch (error) {
      // Map may have already been cleaned up, ignore the error
      console.debug(
        `MarkerEntity[${props.id}]: Map cleanup race condition (expected):`,
        error instanceof Error ? error.message : error
      );
    }
  }
  marker.value = undefined;
};

// Update marker position
const updatePosition = (newPosition: L.LatLng) => {
  if (!marker.value) return;

  try {
    marker.value.setLatLng(newPosition);
  } catch (error) {
    console.error(
      `MarkerEntity[${props.id}]: Failed to update position:`,
      error
    );
  }
};

// Update marker popup
const updatePopup = (newPopup: string | undefined) => {
  if (!marker.value) return;

  try {
    if (newPopup) {
      marker.value.bindPopup(newPopup);
    } else {
      marker.value.unbindPopup();
    }
  } catch (error) {
    console.error(`MarkerEntity[${props.id}]: Failed to update popup:`, error);
  }
};

// Update marker tooltip
const updateTooltip = (newTooltip: string | undefined) => {
  if (!marker.value) return;

  try {
    if (newTooltip) {
      const tooltipOptions: L.TooltipOptions = {
        permanent: false,
        direction: 'top',
        ...props.tooltipOptions,
      };
      marker.value.bindTooltip(newTooltip, tooltipOptions);
    } else {
      marker.value.unbindTooltip();
    }
  } catch (error) {
    console.error(
      `MarkerEntity[${props.id}]: Failed to update tooltip:`,
      error
    );
  }
};

// Watch for prop changes
watch(
  () => props.position,
  (newPosition) => {
    updatePosition(newPosition);
  },
  { deep: true }
);

watch(
  () => props.popup,
  (newPopup) => {
    updatePopup(newPopup);
  }
);

watch(
  () => props.tooltip,
  (newTooltip) => {
    updateTooltip(newTooltip);
  }
);

// Lifecycle hooks
onMounted(() => {
  createMarker();
});

onUnmounted(() => {
  removeMarker();
});
</script>

<style>
/* Hide tooltip arrows */
.leaflet-tooltip::before {
  display: none !important;
}
</style>
