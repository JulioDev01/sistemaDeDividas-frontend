<template>
  <v-container>
    <v-row align="center" justify="start" no-gutters>
      <v-col cols="12" sm="8" md="10">
        <v-text-field v-model="searchQuery" label="Procurar usuários" clearable></v-text-field>
      </v-col>
      <v-col cols="12" sm="4" md="2" class="button-container">
        <RegistroUsers></RegistroUsers>
      </v-col>
    </v-row>


    <v-alert v-if="filteredUsers.length === 0" type="info">
      Nenhum usuário encontrado.
    </v-alert>

    <v-row align="center" justify="center" dense>
      <v-col v-for="user in filteredUsers" :key="user._id" cols="12" sm="6" md="4">
        <v-card append-icon="mdi-pencil" class="mx-auto" prepend-icon="mdi-account" :subtitle="user.role === 'admin' ? 'Administrador' : 'Cliente'" :title="user.username">
          <v-card-actions>
            <v-btn color="primary" @click="openEditModal(user)">Editar Perfil</v-btn>
            <v-btn color="primary" @click="showUserDebts(user)">Detalhes</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showModal" max-width="500">
      <v-card>
        <v-card-title>Editar Perfil</v-card-title>
        <v-card-text>
          <v-text-field v-model="selectedUser.username" label="Username"></v-text-field>
          <v-select v-model="selectedUser.role" :items="['admin', 'cliente']" label="Função"></v-select>
        </v-card-text>
        <v-card-actions class="edit-button-group">
          <v-btn color="error" @click="openDeleteDialog">Excluir Conta</v-btn>
          <v-btn @click="showModal = false">Cancelar</v-btn>
          <v-btn color="primary" @click="saveChanges">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="400" persistent>
      <v-card title="Tem certeza?">
        <v-card-text>
          Você deseja realmente excluir esta conta? Esta ação não pode ser desfeita.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" @click="confirmDeleteAccount">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDebtDialog" max-width="500">
      <v-card>
        <v-card-title>Dívidas de {{ selectedUser?.username }}</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item-group v-if="debts.length > 0">
              <v-list-item v-for="debt in debts" :key="debt._id">
                <v-list-item-content>
                  <v-list-item-title>{{ debt.name }}</v-list-item-title>
                  <v-list-item-subtitle>R$ {{ debt.value }} - {{ debt.status }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
            <v-alert v-else type="info">Nenhuma dívida encontrada para este usuário.</v-alert>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="showDebtDialog = false">Fechar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAlertStore } from '@/stores/alert'
import RegistroUsers from './RegistroUsers.vue';

const showModal = ref(false); 
const selectedUser = ref(null)
const alertStore = useAlertStore()
const users = ref([])
const searchQuery = ref('')
const deleteDialog = ref(false);
const showDebtDialog = ref(false);  
const debts = ref([]);

const openEditModal = (user) => {
  selectedUser.value = { ...user } 
  showModal.value = true
}

const openDeleteDialog = () => {
  deleteDialog.value = true;
};

const confirmDeleteAccount = async () => {
  try {
    const token = sessionStorage.getItem('token');
    const response = await fetch(`http://localhost:3001/user/${selectedUser.value._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao excluir usuário: ${response.statusText}`);
    }

    alertStore.notifyAlert('Usuário excluído com sucesso!', 'success');
    users.value = users.value.filter(user => user._id !== selectedUser.value._id);
    deleteDialog.value = false;
    showModal.value = false;
  } catch (error) {
    alertStore.notifyAlert('Erro ao excluir usuário!', 'error');
  }
};

onMounted(async () => {
  try {
    const token = sessionStorage.getItem('token')

    if (!token) {
      alertStore.notifyAlert('O usuário precisa estar autenticado.', 'warning')
      return
    }

    const response = await fetch('http://localhost:3001/users', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar usuários: ${response.statusText}`)
    }

    const data = await response.json()
    users.value = data.users
  } catch (error) {
    alertStore.notifyAlert('Erro ao buscar usuários! Tente novamente mais tarde.', 'warning')
  }
})

const showUserDebts = async (user) => {
  try {
    const token = sessionStorage.getItem('token');
    const response = await fetch(`http://localhost:3001/debts/${user._id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar dívidas: ${response.statusText}`);
    }

    const data = await response.json();
    debts.value = data.debts.filter(debt => debt.userId === user._id);
    
    selectedUser.value = user; 
    showDebtDialog.value = true; 
  } catch (error) {
    alertStore.notifyAlert('Erro ao buscar dívidas!', 'error');
  }
};

const saveChanges = async () => {
  try {
    const token = sessionStorage.getItem('token')

    const response = await fetch(`http://localhost:3001/user/${selectedUser.value._id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(selectedUser.value)
    })

    if (!response.ok) {
      throw new Error(`Erro ao atualizar usuário: ${response.statusText}`)
    }

    alertStore.notifyAlert('Usuário atualizado com sucesso!', 'success')
    location.reload();

    // Atualiza a lista de usuários
    const updatedUser = await response.json()
    users.value = users.value.map(user =>
      user._id === updatedUser._id ? updatedUser : user
    )

    showModal.value = false
  } catch (error) {
    alertStore.notifyAlert('Erro ao atualizar usuário!', 'error')
  }
}

const filteredUsers = computed(() =>
  users.value.filter(user => user.username.toLowerCase().includes(searchQuery.value.toLowerCase()) && user.role === 'cliente')
)
</script>


<style scoped>
.v-row {
  justify-content: flex-start !important;
}

.button-container {
  display: block;
  margin: 0 auto;
  align-items: center;
  text-align: center;
}

.edit-button-group {
  display: flex;
  gap: 8px;
}

@media (max-width: 390px) {
  .edit-button-group {
    flex-direction: column;
  }
}

</style>