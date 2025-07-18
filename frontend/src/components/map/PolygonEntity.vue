<template>
  <!-- Headless component - no visual output -->
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as L from 'leaflet'

// Component props
interface Props {
  id: string
  points: L.LatLng[]
  style: Partial<L.PolylineOptions>  // Polygons use the same style interface as polylines
  map: L.Map
}

const props = defineProps<Props>()

// Leaflet polygon instance
const polygon = ref<L.Polygon>()

// Create the polygon and add it to the map
const createPolygon = () => {
  if (!props.map) {
    console.error(`PolygonEntity[${props.id}]: Map not provided`)
    return
  }

  if (props.points.length < 3) {
    console.error(`PolygonEntity[${props.id}]: Insufficient points for polygon (${props.points.length})`)
    return
  }

  try {
    // Create the Leaflet polygon
    const newPolygon = L.polygon(props.points, props.style)

    // Add to map
    newPolygon.addTo(props.map)

    // Store reference
    polygon.value = newPolygon

    // console.debug(`PolygonEntity[${props.id}]: Created polygon with ${props.points.length} points`)
  } catch (error) {
    console.error(`PolygonEntity[${props.id}]: Failed to create polygon:`, error)
  }
}

// Remove the polygon from the map
const removePolygon = () => {
  if (polygon.value && props.map) {
    try {
      props.map.removeLayer(polygon.value)
      // console.debug(`PolygonEntity[${props.id}]: Removed polygon from map`)
    } catch (error) {
      console.error(`PolygonEntity[${props.id}]: Failed to remove polygon:`, error)
    }
  }
  polygon.value = undefined
}

// Update polygon points
const updatePoints = (newPoints: L.LatLng[]) => {
  if (!polygon.value) return

  if (newPoints.length < 3) {
    console.error(`PolygonEntity[${props.id}]: Insufficient points for update (${newPoints.length})`)
    return
  }

  try {
    polygon.value.setLatLngs(newPoints)
    // console.debug(`PolygonEntity[${props.id}]: Updated points (${newPoints.length} points)`)
  } catch (error) {
    console.error(`PolygonEntity[${props.id}]: Failed to update points:`, error)
  }
}

// Update polygon style
const updateStyle = (newStyle: L.PolylineOptions) => {
  if (!polygon.value) return

  try {
    polygon.value.setStyle(newStyle)
    // console.debug(`PolygonEntity[${props.id}]: Updated style`)
  } catch (error) {
    console.error(`PolygonEntity[${props.id}]: Failed to update style:`, error)
  }
}

// Watch for prop changes
watch(
  () => props.points,
  (newPoints) => {
    updatePoints(newPoints)
  },
  { deep: true }
)

watch(
  () => props.style,
  (newStyle) => {
    updateStyle(newStyle)
  },
  { deep: true }
)

// Lifecycle hooks
onMounted(() => {
  createPolygon()
})

onUnmounted(() => {
  removePolygon()
})
</script>
