import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { vCan } from '../directives/v-can';
import '../shared/ui/styles.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.directive('can', vCan);

app.mount('#app');
