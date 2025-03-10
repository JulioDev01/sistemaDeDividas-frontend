/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router/auto'

import LayoutLogin from '@/layouts/LayoutLogin.vue'
import LayoutDefault from '@/layouts/default.vue'

//Rota manual para o Login
const manualRoutes = [
  {
    path: "/",
    component: LayoutLogin,
    children: [
      {
        path: "",
        name: "Login",
        component: import('@/pages/Login.vue'),
      }
    ]
  },
  {
    path: "/home",
    component: LayoutDefault,
    children: [
      {
        path: "",
        name: "home",
        component: import('@/pages/Home.vue'),
      }
    ]
  },
  {
    path: "/usuarios",
    component: LayoutDefault,
    children: [
      {
        path: "",
        name: "Usuarios",
        component: import('@/pages/Usuarios.vue'),
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: manualRoutes,
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (!localStorage.getItem('vuetify:dynamic-reload')) {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    } else {
      console.error('Dynamic import error, reloading page did not fix it', err)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('token');
  const role = sessionStorage.getItem('role');

  if (to.path !== '/' && !token) {
    next('/');
  } else if (to.path === '/usuarios' && role !== 'admin') {
    next('/home');
    alert('Acesso negado! Somente administradores podem acessar essa página.');
  } else {
    next(); // Permitir a navegação
  }
});


export default router
