<template>
  <!-- Headless component - no visual output -->
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import * as L from 'leaflet';

// Component props
interface Props {
  id: string;
  points: L.LatLng[];
  style: L.PolylineOptions;
  map: L.Map;
}

const props = defineProps<Props>();

// Leaflet polyline instance
const polyline = ref<L.Polyline>();

// Create the polyline and add it to the map
const createPolyline = () => {
  if (!props.map) {
    console.error(`PolylineEntity[${props.id}]: Map not provided`);
    return;
  }

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
    newPolyline.addTo(props.map);

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
  if (polyline.value && props.map) {
    try {
      props.map.removeLayer(polyline.value);
      // console.debug(`PolylineEntity[${props.id}]: Removed polyline from map`)
    } catch (error) {
      console.error(
        `PolylineEntity[${props.id}]: Failed to remove polyline:`,
        error
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
