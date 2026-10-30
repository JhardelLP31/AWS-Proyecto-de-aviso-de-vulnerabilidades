import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { PERMISSIONS, hasPermission } from '@geoalert/contracts';
import { useAuthStore } from '../stores/auth.store';

declare module 'vue-router' {
  interface RouteMeta {
    permissions?: string[];
    guestOnly?: boolean;
    requiresAuth?: boolean;
    title?: string;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'map',
    component: () => import('../features/map/DisasterMap.vue'),
    meta: {
      title: 'Mapa de Emergencias — Piura FEN',
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../features/auth/LoginView.vue'),
    meta: {
      guestOnly: true,
      title: 'Acceso — GeoAlert',
    },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../features/auth/RegisterView.vue'),
    meta: {
      guestOnly: true,
      title: 'Registro Comunitario — GeoAlert',
    },
  },
  {
    path: '/report',
    name: 'report',
    component: () => import('../features/report/ReportIncidentView.vue'),
    meta: {
      requiresAuth: true,
      permissions: [PERMISSIONS.IncidentsCreate],
      title: 'Reportar Evento Crítico — GeoAlert',
    },
  },
  {
    path: '/dispatch',
    name: 'dispatch',
    component: () => import('../features/dispatch/DispatchDashboard.vue'),
    meta: {
      requiresAuth: true,
      permissions: [PERMISSIONS.AlertsReceive],
      title: 'Centro de Despacho COER — GeoAlert',
    },
  },
  {
    path: '/riesgo',
    name: 'risk',
    component: () => import('../features/risk/RiskForecastView.vue'),
    meta: {
      requiresAuth: true,
      permissions: [PERMISSIONS.AnalyticsRead],
      title: 'Pronóstico y Riesgo Histórico — GeoAlert',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guard global de navegación por permisos RBAC
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Inicializar sesión desde cookies HttpOnly en la primera carga si aún no se ha hecho
  if (!authStore.isInitialized) {
    await authStore.fetchMe();
  }

  // Rutas exclusivas para invitados (ej. /login)
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ path: '/' });
  }

  // Comprobar autenticación básica si se requiere
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  }

  // Comprobar permisos RBAC granulares declarados en meta.permissions
  if (to.meta.permissions && to.meta.permissions.length > 0) {
    if (!authStore.isAuthenticated) {
      return next({
        path: '/login',
        query: { redirect: to.fullPath },
      });
    }

    const hasAllRequired = to.meta.permissions.every((perm) =>
      hasPermission(authStore.permissions, perm),
    );

    if (!hasAllRequired) {
      console.warn(`[Router Guard] Acceso denegado a ${to.path}. Permisos requeridos:`, to.meta.permissions);
      // Redirigir a mapa con notificación
      return next({ path: '/' });
    }
  }

  // Actualizar título de la pestaña
  if (to.meta.title) {
    document.title = `${to.meta.title} | ResQMap`;
  }

  next();
});
