<template>
    <v-container class="mt-16">
        <!-- Exibindo o alerta condicionalmente -->
        <Alert v-if="alertStore.showAlert"></Alert>
        <div> 
            <v-img
                class="mx-auto my-6"
                max-width="228"
                src="../assets/imgs/logoDividas.png"
            ></v-img>

            <v-card
                class="mx-auto pa-12 pb-8"
                elevation="8"
                max-width="448"
                rounded="lg"
            >
                <form @submit.prevent="onSubmit">
                    <v-text-field
                        v-model="email"
                        :readonly="loading"
                        :rules="[required]"
                        class="mb-2"
                        label="Username"
                        placeholder="Digite seu username"
                        clearable
                    ></v-text-field>
                
                    <v-text-field
                        :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                        :type="visible ? 'text' : 'password'"
                        @click:append-inner="visible = !visible"
                        v-model="password"
                        :readonly="loading"
                        :rules="[required]"
                        label="Senha"
                        placeholder="Digite sua senha"
                    ></v-text-field>
                
                    <v-btn
                        class="mb-8 mt-4"
                        color="blue"
                        size="large"
                        variant="tonal"
                        block
                        type="submit"
                    >
                        ENTRAR    
                    </v-btn>
                </form>
            </v-card>
        </div>
    </v-container>
</template>

<script setup>
import { ref } from 'vue'; 
import Alert from '@/components/Alert.vue'; 
import { useAlertStore } from '@/stores/alert';
import { useRouter } from 'vue-router'; 

// Inicializando a store
const alertStore = useAlertStore();
const router = useRouter();

// Declarando variáveis reativas
const visible = ref(false);
const email = ref(null);
const password = ref(null);
const loading = ref(false);

// Função para enviar o formulário
const onSubmit = async () => {
    if (!email.value || !password.value) {
        alertStore.notifyAlert("Preencha todos os campos!", "warning");
        return;
    }

    loading.value = true;

    try {
        const response = await fetch('http://localhost:3001/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: email.value,
                password: password.value,
            })
        });

        const data = await response.json();

        if (response.ok) {
            alertStore.notifyAlert("Login realizado com sucesso!", "success");
            sessionStorage.setItem('username', data.username);
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('userId', data.userId);
            sessionStorage.setItem('role', data.role);

            setTimeout(() => {
                router.push('/home');
            }, 1500);
        } else {
            alertStore.notifyAlert("Username e/ou senha inválidos. Verifique novamente.", "error");
        }
    } catch (error) {
        if (error.message.includes("Failed to fetch")) {
            alertStore.notifyAlert("Não foi possível conectar ao servidor. Verifique sua internet.", "error");
        } else if (response.status === 401) {
            alertStore.notifyAlert("Username e/ou senha inválidos. Tente novamente.", "error");
        } else {
            alertStore.notifyAlert("Erro ao conectar com a API. Tente novamente mais tarde.", "error");
        }
    } finally {
        loading.value = false;
    }
};

// Função de validação para campos obrigatórios
const required = (v) => !!v || 'O campo é obrigatório';

</script>
