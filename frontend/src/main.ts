import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import { aliases, mdi } from 'vuetify/iconsets/mdi';

// Import Vuetify components
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// Import your main map component
import MapApp from '@/components/map/MapApp.vue';

// Configure Vuetify
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'dark', // Optional: PS2 feels like a dark theme app
  },
});

// Create and mount the app directly with MapApp
const app = createApp(MapApp);
app.use(vuetify);
app.mount('#app');
