<template>
  <v-overlay
    :model-value="isVisible"
    contained
    class="loading-overlay"
    :style="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
  >
    <div class="loading-content">
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      ></v-progress-circular>
      <div class="mt-4 text-h6 text-white">{{ message }}</div>
      <v-btn
        v-if="showDismissButton"
        @click="handleDismiss"
        variant="outlined"
        color="white"
        class="mt-4"
      >
        Continue anyways
      </v-btn>
    </div>
  </v-overlay>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue';

interface Props {
  show: boolean;
  message?: string;
  dismissTimeout?: number;
}

const props = withDefaults(defineProps<Props>(), {
  message: 'Loading...',
  dismissTimeout: 3000,
});

// Internal state
const showDismissButton = ref(false);
const dismissTimer = ref<number | null>(null);
const userDismissed = ref(false);

// Computed property for overlay visibility
const isVisible = computed(() => props.show && !userDismissed.value);

// Timer management functions
const clearDismissTimer = () => {
  if (dismissTimer.value) {
    clearTimeout(dismissTimer.value);
    dismissTimer.value = null;
  }
};

const startDismissTimer = () => {
  clearDismissTimer();
  showDismissButton.value = false;

  dismissTimer.value = window.setTimeout(() => {
    showDismissButton.value = true;
  }, props.dismissTimeout);
};

// Handle dismiss action
const handleDismiss = () => {
  userDismissed.value = true;
  showDismissButton.value = false;
  clearDismissTimer();
  // Don't emit - the overlay handles its own dismiss state
};

// Watch for visibility changes to manage timer
watch(
  () => props.show,
  (isShowing) => {
    if (isShowing) {
      // Reset user dismiss state for new loading operations
      userDismissed.value = false;
      startDismissTimer();
    } else {
      clearDismissTimer();
      showDismissButton.value = false;
    }
  }
);

// Cleanup on unmount
onUnmounted(() => {
  clearDismissTimer();
});
</script>

<style scoped>
.loading-overlay {
  z-index: 1000;
  /* Ensure overlay covers the entire area and centers content */
  position: absolute !important;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
</style>
