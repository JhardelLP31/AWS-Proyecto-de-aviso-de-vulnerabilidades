import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { vCan } from '../directives/v-can';

// Tipografías autoalojadas locales (Cero peticiones externas a Google Fonts)
import '@fontsource/inter/index.css';
import '@fontsource/outfit/index.css';

// Estilos de Leaflet y MarkerCluster empaquetados localmente desde node_modules (Sin unpkg)
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Sistema de diseño oscuro y glassmorphic
import '../shared/ui/styles.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.directive('can', vCan);

app.mount('#app');
