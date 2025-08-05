<template>
  <!-- Headless component - no visual output -->
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import * as L from 'leaflet';
import { useLeafletMap } from '@/composables/useLeafletMap';

// Component props - notice no map prop needed
interface Props {
  id: string;
  points: L.LatLng[];
  style: Partial<L.PolylineOptions>;
}

const props = defineProps<Props>();

// Get map from context instead of props
const { getMap, hasMap } = useLeafletMap();

// Leaflet polygon instance
const polygon = ref<L.Polygon>();

// Create the polygon and add it to the map
const createPolygon = () => {
  let map: L.Map;

  try {
    map = getMap() as L.Map; // Will throw if map not ready
  } catch (error) {
    console.debug(`PolygonEntity[${props.id}]: Map not yet initialized`);
    return;
  }

  if (props.points.length < 3) {
    console.error(
      `PolygonEntity[${props.id}]: Insufficient points for polygon (${props.points.length})`
    );
    return;
  }

  try {
    // Create the Leaflet polygon
    const newPolygon = L.polygon(props.points, props.style);

    // Add to map
    newPolygon.addTo(map);

    // Store reference
    polygon.value = newPolygon;
  } catch (error) {
    console.error(
      `PolygonEntity[${props.id}]: Failed to create polygon:`,
      error
    );
  }
};

// Remove the polygon from the map
const removePolygon = () => {
  const map = getMap() as L.Map;
  if (polygon.value && map) {
    try {
      // Check if map is still valid before attempting removal
      if (hasMap()) {
        map.removeLayer(polygon.value);
      }
    } catch (error) {
      // Map may have already been cleaned up, ignore the error
      console.debug(
        `PolygonEntity[${props.id}]: Map cleanup race condition (expected):`,
        error instanceof Error ? error.message : error
      );
    }
  }
  polygon.value = undefined;
};

// Update polygon points
const updatePoints = (newPoints: L.LatLng[]) => {
  if (!polygon.value) return;

  if (newPoints.length < 3) {
    console.error(
      `PolygonEntity[${props.id}]: Insufficient points for update (${newPoints.length})`
    );
    return;
  }

  try {
    polygon.value.setLatLngs(newPoints);
    // console.debug(`PolygonEntity[${props.id}]: Updated points (${newPoints.length} points)`)
  } catch (error) {
    console.error(
      `PolygonEntity[${props.id}]: Failed to update points:`,
      error
    );
  }
};

// Update polygon style
const updateStyle = (newStyle: L.PolylineOptions) => {
  if (!polygon.value) return;

  try {
    polygon.value.setStyle(newStyle);
    // console.debug(`PolygonEntity[${props.id}]: Updated style`)
  } catch (error) {
    console.error(`PolygonEntity[${props.id}]: Failed to update style:`, error);
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
  createPolygon();
});

onUnmounted(() => {
  removePolygon();
});
</script>
