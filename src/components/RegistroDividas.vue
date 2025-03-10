<template>
    <div class="pa-4 text-center">
      <v-dialog
        v-model="dialog"
        max-width="600"
      >
        <template v-slot:activator="{ props: activatorProps }">
          <v-btn
            class="text-none font-weight-regular custom-btn"
            prepend-icon="mdi-plus"
            text="CRIAR DÍVIDA"
            variant="tonal"
            color="primary"
            v-bind="activatorProps"
            :disabled="role !== 'admin'"
          ></v-btn>
        </template>
  
        <v-card
          prepend-icon="mdi-plus"
          title="Criar Dívida"
        >
          <v-card-text>
            <v-row dense>
              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  label="Nome da dívida*"
                  v-model="name"
                  required
                ></v-text-field>
              </v-col>

              <v-col
                cols="12"
                sm="6"
              >
                <v-select
                  label="Selecionar Cliente*"
                  v-model="userId"
                  :items="clientes" 
                  item-title="username" 
                  item-value="_id" 
                  required
                ></v-select>
              </v-col>
  
              <v-col
                cols="12"
                md="6"
                sm="6"
              >
                <v-text-field
                  label="Valor*"
                  type="number"
                  v-model="value"
                  required
                ></v-text-field>
              </v-col>
  
              <v-col
                cols="12"
                md="6"
                sm="6"
              >
                <v-text-field   
                  label="Data de vencimento*"
                  type="date"
                  v-model="dueDate"
                  :min="getTodayDate()" 
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
              @click="createDebt" 
            ></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
</template>


<script setup>
import { ref, onMounted } from "vue";
import { useAlertStore } from "@/stores/alert";

const alertStore = useAlertStore();
const dialog = ref(false);
const name = ref("");
const userId = ref("");
const value = ref("");
const dueDate = ref("");
const clientes = ref([]);
const role = ref(sessionStorage.getItem("role") || "");
const token = sessionStorage.getItem("token");


// Verifica se pode criar (todos os campos preenchidos)
const canCreate = ref(false);
const checkCanCreate = () => {
  canCreate.value =
    name.value.trim() !== "" &&
    userId.value.trim() !== "" &&
    value.value !== "" &&
    dueDate.value !== "";
};

watch([name, userId, value, dueDate], checkCanCreate);


// Define a data de hoje no formato YYYY-MM-DD
const getTodayDate = () => new Date().toISOString().split("T")[0];

onMounted(() => {
  dueDate.value = getTodayDate();
});

// Busca a lista de clientes para seleção
const fetchClientes = async () => {
  if (role.value !== "admin") return;

  try {
    const response = await fetch("http://localhost:3001/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
        clientes.value = (data.users || []).filter(user => user.role === "cliente");
    } else {
      alertStore.notifyAlert("Erro ao buscar clientes!", "error");
    }
  } catch (error) {
    alertStore.notifyAlert("Erro ao conectar com a API!", "error");
  }
};

// Criar dívida (Apenas ADMIN)
const createDebt = async () => {

  checkCanCreate();

  if (!canCreate.value) {
    alertStore.notifyAlert("Preencha todos os campos!", "warning");
    return;
  }

  if (name.value.length < 3) {
      alertStore.notifyAlert("O nome deve ter pelo menos 3 caracteres!", "warning");
      return;
  }

  try {
    const response = await fetch("http://localhost:3001/debts/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: userId.value,
        name: name.value,
        value: parseFloat(value.value),
        dueDate: dueDate.value,
      }),
    });

    if (response.ok) {
      alertStore.notifyAlert("Dívida criada com sucesso!", "success");
      dialog.value = false;
      name.value = "";
      userId.value = "";
      value.value = "";
      dueDate.value = "";
      location.reload();
    } else {
      alertStore.notifyAlert("Erro ao criar dívida!", "error");
    }
  } catch (error) {
    alertStore.notifyAlert("Erro ao conectar com a API!", "error");
  }
};

onMounted(fetchClientes);

</script>


<style scoped>
.custom-btn {
  height: 56px; 
  width: 100%;
  min-width: 140px; 
  font-size: 14px;
  margin-top: -20px;
}
</style>