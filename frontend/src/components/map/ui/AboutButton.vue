<template>
  <div>
    <v-btn
      variant="tonal"
      color="primary"
      title="About"
      style="text-transform: none"
      @click="dialog = true"
    >
      <v-icon>mdi-information</v-icon>
      <span class="ml-1">About</span>
    </v-btn>

    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>About Nanite Nexus Map Analyzer</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="dialog = false"
          />
        </v-card-title>

        <v-card-text>
          <AboutContent />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="dialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AboutContent from './AboutContent.vue';

const dialog = ref(false);
</script>
