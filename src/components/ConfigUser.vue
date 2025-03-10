<template>
  <div>
    <v-dialog v-model="isOpen" max-width="600">
      <v-card prepend-icon="mdi-pencil" title="Perfil">
        <v-card-text>
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="user.username"
                label="Username*"
                required
                :error="usernameError"
                :error-messages="usernameErrorMsg"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="user.password"
                label="Senha*"
                type="password"
                required
                :error="passwordError"
                :error-messages="passwordErrorMsg"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="user.confirmPassword"
                label="Confirmar Senha*"
                type="password"
                required
                :error="confirmPasswordError"
                :error-messages="confirmPasswordErrorMsg"
              ></v-text-field>
            </v-col>
          </v-row>

          <small class="text-caption text-medium-emphasis">*indica campo obrigatório</small>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="edit-button-group">
          <v-spacer></v-spacer>
          <v-btn color="red" text="Sair da conta" variant="tonal" @click="logout"></v-btn>
          <v-btn text="Cancelar" variant="tonal" @click="emit('update:modelValue', false)"></v-btn>
          <v-btn color="primary" text="Salvar" variant="tonal" @click="validateAndUpdateUser"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Alert from '@/components/Alert.vue'; 
import { useAlertStore } from '@/stores/alert';

const alertStore = useAlertStore();

const props = defineProps({
  modelValue: Boolean,
});
const emit = defineEmits(['update:modelValue']);

const router = useRouter();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const user = ref({
  username: '',
  password: '',
  confirmPassword: ''
});

const role = ref('');
const deleteDialog = ref(false);

const originalUsername = ref('');
const originalPassword = ref('');

const usernameError = ref(false);
const usernameErrorMsg = ref('');
const passwordError = ref(false);
const passwordErrorMsg = ref('');
const confirmPasswordError = ref(false);
const confirmPasswordErrorMsg = ref('');

const loadUserData = () => {
  const storedUsername = sessionStorage.getItem('username');
  const storedPassword = sessionStorage.getItem('password');

  if (storedUsername) {
    user.value.username = storedUsername;
    originalUsername.value = storedUsername;
  }
  if (storedPassword) {
    originalPassword.value = storedPassword;
  }
};

watch(isOpen, (newValue) => {
  if (newValue) {
    loadUserData();
  }
});

const resetValidation = () => {
  usernameError.value = false;
  usernameErrorMsg.value = '';
  passwordError.value = false;
  passwordErrorMsg.value = '';
  confirmPasswordError.value = false;
  confirmPasswordErrorMsg.value = '';
};

const validateAndUpdateUser = async () => {
  resetValidation();

  if (!user.value.username.trim()) {
    usernameError.value = true;
    usernameErrorMsg.value = 'O username não pode estar vazio.';
  }

  if (!user.value.password.trim()) {
    passwordError.value = true;
    passwordErrorMsg.value = 'A senha não pode estar vazia.';
  }

  if (user.value.password !== user.value.confirmPassword) {
    confirmPasswordError.value = true;
    confirmPasswordErrorMsg.value = 'As senhas não coincidem.';
  }

  if (usernameError.value || passwordError.value || confirmPasswordError.value) {
    return;
  }

  await updateUser();
};

const updateUser = async () => {
  const userId = sessionStorage.getItem('userId');
  const token = sessionStorage.getItem('token');

  if (!userId || !token) {
    alertStore.notifyAlert("Usuário não autenticado!", "warning");
    return;
  }

  const userData = {
    username: user.value.username,
    password: user.value.password
  };

  try {
    const response = await fetch(`http://localhost:3001/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      alertStore.notifyAlert("Erro ao atualizar usuário.", "error");
    }

    alertStore.notifyAlert("Usuário atualizado com sucesso!", "success");
    sessionStorage.setItem('username', user.value.username);
    emit('update:modelValue', false);
  } catch (error) {
    alertStore.notifyAlert("Erro ao atualizar usuário.", "warning");
  }
};

//sair da conta
const logout = () => {
  sessionStorage.clear();
  alertStore.notifyAlert("Você saiu da conta!", "info");
  location.reload();
};

</script>



<style setup>
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