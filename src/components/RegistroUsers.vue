<template>
    <div class="pa-4 text-center">
      <v-dialog
        v-model="dialog"
        max-width="600"
      >
        <template v-slot:activator="{ props: activatorProps }">
          <v-btn
            class="text-none font-weight-regular custom-btn"
            prepend-icon="mdi-account"
            text="CRIAR USUÁRIO"
            variant="tonal"
            color="primary"
            v-bind="activatorProps"
          ></v-btn>
        </template>
  
        <v-card
          prepend-icon="mdi-account"
          title="Criar Usuário"
        >
          <v-card-text>
            <v-row dense>
              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  label="Username*"
                  v-model="username"
                  required
                ></v-text-field>
              </v-col>

              <v-col
                cols="12"
                sm="6"
              >
                <v-select
                  :items="['cliente', 'admin']"
                  label="Função*"
                  v-model="role"
                  required
                ></v-select>
              </v-col>
  
              <v-col
                cols="12"
                md="6"
                sm="6"
              >
                <v-text-field
                  label="Senha*"
                  type="password"
                  v-model="password"
                  required
                ></v-text-field>
              </v-col>
  
              <v-col
                cols="12"
                md="6"
                sm="6"
              >
                <v-text-field
                  label="Confirme Senha*"
                  type="password"
                  v-model="confirmPassword"
                  required
                ></v-text-field>
              </v-col>
  
            </v-row>
  
            <small class="text-caption text-medium-emphasis">*Indica campo obrigatório</small>
          </v-card-text>
  
          <v-divider></v-divider>
  
          <v-card-actions>
            <v-spacer></v-spacer>
  
            <v-btn
              text="Cancelar"
              variant="plain"
              @click="dialog = false"
            ></v-btn>
  
            <v-btn
              color="primary"
              text="Criar"
              variant="tonal"
              @click="createUser"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
</template>

<script setup>
import { shallowRef } from 'vue'
import { ref } from 'vue'; 
import Alert from '@/components/Alert.vue'; 
import { useAlertStore } from '@/stores/alert';
import { useRouter } from 'vue-router'; 

// Inicializando a store
const alertStore = useAlertStore();
const router = useRouter();

const dialog = ref(false);
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const role = ref('');
const loading = ref(false);

const createUser = async () => {
    if (!username.value || !password.value || !confirmPassword.value || !role.value) {
        alertStore.notifyAlert("Preencha todos os campos!", "warning");
        return;
    }

    if (password.value !== confirmPassword.value) {
        alertStore.notifyAlert("As senhas não coincidem!", "warning");
        return;
    }

    loading.value = true;

    try {
        const token = sessionStorage.getItem('token')

        const response = await fetch('http://localhost:3001/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username: username.value,
                password: password.value,
                confirmpassword: confirmPassword.value,
                role: role.value,               
            })
        });

        const data = await response.json()

        if(response.ok) {
            alertStore.notifyAlert("Usuário criado com sucesso!", "success");
            dialog.value = false;
            location.reload();
        } else if (response.status === 442) {
            alertStore.notifyAlert(data.message || "Username já está em uso.", "warning");
        } else {
            alertStore.notifyAlert(data.message || "Erro ao criar usuário. Tente novamente.", "error");
        }

    } catch (error) {
        console.error('Erro ao conectar com a API:', error);
        alertStore.notifyAlert("Erro ao conectar com a API. Tente novamente mais tarde.", "error");
    } finally {
        loading.value = false;
    }
}

</script>

<style scoped>
.custom-btn {
  height: 56px; 
  width: 100%;
  min-width: 180px; 
  font-size: 14px;
  margin-top: -20px;
}
</style>