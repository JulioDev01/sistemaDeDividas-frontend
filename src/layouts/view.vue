<template>
    <v-app id="inspire">
      <v-navigation-drawer v-model="drawer">
        <v-list>
          <v-list-item
            prepend-avatar="../assets/imgs/iconPerfil.png"
            :subtitle= "userStatus"
            :title="userName"
          >
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-list :lines="false" density="compact" nav>
          <div  v-for="(item, i) in filteredItems" :key="i">
            <v-list-item 
              :color="item.to === $route.path ? 'primary' : ''"
              @click="handleItemClick(item)"
            >
              <template v-slot:prepend>
                <v-icon :icon="item.icon"></v-icon>
              </template>
              <v-list-item-title>{{ item.text }}</v-list-item-title>
            </v-list-item>
          </div >
        </v-list>
      </v-navigation-drawer>
  
      <v-app-bar>
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
  
        <v-app-bar-title>Sistema de Dívidas</v-app-bar-title>
      </v-app-bar>
  
      <v-main>
        <router-view></router-view>
      </v-main>

      <EditarPerfil v-model="dialogEditarPerfil"></EditarPerfil>
    </v-app>
  </template>
  
<script setup>
    import { ref } from 'vue'
    import { useRouter } from "vue-router";
    import EditarPerfil from '@/components/ConfigUser.vue';
  
    const router = useRouter();
    const drawer = ref(null);
    const dialogEditarPerfil = ref(false);

    const userRole = ref(sessionStorage.getItem('role') || 'cliente');
    const userName = ref(sessionStorage.getItem('username') || 'Usuário');

    const userStatus = computed(() => {
      return userRole.value === 'admin' ? 'Administrador' : 'Cliente';
    });

    const handleItemClick = (item) => {
      if (item.action === "editarPerfil") {
        dialogEditarPerfil.value = true;
      } else if (item.to) {
        router.push(item.to);
      }
    };

    const items = [
        { text: 'Usuários', icon: 'mdi-account-multiple', to:"/usuarios", role: "admin" },
        { text: 'Dívidas', icon: 'mdi-history', to:"/home" },
        { text: "Perfil", icon: "mdi-pencil", action: "editarPerfil" },
    ];

    const filteredItems = computed(() => {
      return items.filter(item => !item.role || item.role === userRole.value);
    });
  
</script>
  

<style scoped>
  a{
    text-decoration: none;
    color: white;
  }
</style>

