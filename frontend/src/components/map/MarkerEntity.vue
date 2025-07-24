<template>
  <!-- Headless component - no visual output -->
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import * as L from 'leaflet';

// Component props
interface Props {
  id: string;
  position: L.LatLng;
  options?: L.MarkerOptions;
  popup?: string;
  map: L.Map;
}

const props = defineProps<Props>();

// Leaflet marker instance
const marker = ref<L.Marker>();

// Create the marker and add it to the map
const createMarker = () => {
  if (!props.map) {
    console.error(`MarkerEntity[${props.id}]: Map not provided`);
    return;
  }

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

    // Add to map
    newMarker.addTo(props.map);

    // Store reference
    marker.value = newMarker;
  } catch (error) {
    console.error(
      `MarkerEntity[${props.id}]: Failed to create marker:`,
      error
    );
  }
};

// Remove the marker from the map
const removeMarker = () => {
  if (marker.value && props.map) {
    try {
      // Close any open popup before removing the marker
      if (marker.value.isPopupOpen()) {
        marker.value.closePopup();
      }
      // Unbind popup to prevent lingering references
      marker.value.unbindPopup();
      
      // Check if map is still valid before attempting removal
      if (props.map.getContainer()) {
        props.map.removeLayer(marker.value);
      }
    } catch (error) {
      // Map may have already been cleaned up, ignore the error
      console.debug(
        `MarkerEntity[${props.id}]: Map cleanup race condition (expected):`,
        error.message
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
    console.error(
      `MarkerEntity[${props.id}]: Failed to update popup:`,
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

// Lifecycle hooks
onMounted(() => {
  createMarker();
});

onUnmounted(() => {
  removeMarker();
});
</script>