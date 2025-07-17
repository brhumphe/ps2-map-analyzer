import { createApp } from 'vue';

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import StatusApp from "./components/status/StatusApp.vue";

const vuetify = createVuetify({
  components,
  directives,
  theme:{
    defaultTheme: 'dark', // 'light' | 'dark' | 'system'
  }
})
createApp(StatusApp).use(vuetify).mount('#app');
