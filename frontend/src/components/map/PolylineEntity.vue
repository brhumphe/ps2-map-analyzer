<template>
  <!-- Headless component - no visual output -->
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import * as L from 'leaflet';
import { useLeafletMap } from '@/composables/useLeafletMap';

// Component props - no map prop needed!
interface Props {
  id: string;
  points: L.LatLng[];
  style: L.PolylineOptions;
}

const props = defineProps<Props>();

// Get map utilities from the singleton
const { getMap, hasMap } = useLeafletMap();

// Leaflet polyline instance
const polyline = ref<L.Polyline>();

// Create the polyline and add it to the map
const createPolyline = () => {
  // Check if map is available
  if (!hasMap()) {
    console.debug(`PolylineEntity[${props.id}]: Map not yet initialized`);
    return;
  }

  const map = getMap();

  if (props.points.length < 2) {
    console.error(
      `PolylineEntity[${props.id}]: Insufficient points for polyline (${props.points.length})`
    );
    return;
  }

  try {
    // Create the Leaflet polyline
    const newPolyline = L.polyline(props.points, props.style);

    // Add to map
    newPolyline.addTo(map);

    // Store reference
    polyline.value = newPolyline;

    // console.debug(`PolylineEntity[${props.id}]: Created polyline with ${props.points.length} points`)
  } catch (error) {
    console.error(
      `PolylineEntity[${props.id}]: Failed to create polyline:`,
      error
    );
  }
};

// Remove the polyline from the map
const removePolyline = () => {
  if (polyline.value && hasMap()) {
    try {
      const map = getMap();
      // Check if map is still valid before attempting removal
      if (map.getContainer()) {
        map.removeLayer(polyline.value);
      }
    } catch (error) {
      // Map may have already been cleaned up, ignore the error
      console.debug(
        `PolylineEntity[${props.id}]: Map cleanup race condition (expected):`,
        error instanceof Error ? error.message : error
      );
    }
  }
  polyline.value = undefined;
};

// Update polyline points
const updatePoints = (newPoints: L.LatLng[]) => {
  if (!polyline.value) return;

  if (newPoints.length < 2) {
    console.error(
      `PolylineEntity[${props.id}]: Insufficient points for update (${newPoints.length})`
    );
    return;
  }

  try {
    polyline.value.setLatLngs(newPoints);
    // console.debug(`PolylineEntity[${props.id}]: Updated points (${newPoints.length} points)`)
  } catch (error) {
    console.error(
      `PolylineEntity[${props.id}]: Failed to update points:`,
      error
    );
  }
};

// Update polyline style
const updateStyle = (newStyle: L.PolylineOptions) => {
  if (!polyline.value) return;

  try {
    polyline.value.setStyle(newStyle);
    // console.debug(`PolylineEntity[${props.id}]: Updated style`)
  } catch (error) {
    console.error(
      `PolylineEntity[${props.id}]: Failed to update style:`,
      error
    );
  }
};

// Watch for prop changes
watch(
  () => props.points,
  (newPoints) => {
    updatePoints(newPoints);
  },
  { deep: true }
);

watch(
  () => props.style,
  (newStyle) => {
    updateStyle(newStyle);
  },
  { deep: true }
);

// Lifecycle hooks
onMounted(() => {
  createPolyline();
});

onUnmounted(() => {
  removePolyline();
});
</script>
