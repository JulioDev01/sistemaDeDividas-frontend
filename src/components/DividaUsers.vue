<template>
  <v-container>
      <v-row align="center" justify="start" no-gutters>
        <v-col cols="12" sm="5" md="7" class="buscaUsuarios">
          <v-text-field v-model="search" label="Procurar dívidas" clearable></v-text-field>
        </v-col>
        <v-col v-if="role === 'admin'" cols="12" sm="" md="">
          <v-select
            v-model="selectedUserId"
            :items="users"
            item-title="username"
            item-value="_id"
            label="Filtrar por Cliente"
            clearable
          ></v-select>
        </v-col>
        <v-col cols="12" sm="3" md="2" class="button-container">
          <RegistroDividas></RegistroDividas>
        </v-col>
      </v-row>
      
      <v-row v-if="debts.length > 0" align="center" justify="center">
        <v-col v-for="debt in filteredDebts" :key="debt._id" cols="12" sm="6" md="4">
          <v-card
            class="mx-auto"
            prepend-icon="mdi-alert-circle"
          >
            <v-card-title>{{ debt.name }}</v-card-title>
            <v-card-subtitle>R$ {{ debt.value.toFixed(2) }}</v-card-subtitle>

            <v-card-text>
              <p><strong>Vencimento:</strong> {{ formatDate(debt.dueDate) }}</p>
              <p><strong>Status:</strong> {{ debt.status }}</p>
            </v-card-text>

            <v-card-actions class="button-group">
              <v-btn v-if="debt.status !== 'pago'"  color="primary" @click="openScheduleDialog(debt)">
                Agendar Pagamento
              </v-btn>
              <v-btn color="primary"  @click="openEditDebt(debt)" :disabled="role !== 'admin'">
                Editar dívida
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <v-alert v-else type="info" variant="tonal">
        Nenhuma dívida encontrada.
      </v-alert>

      <v-dialog v-model="dialog" max-width="400">
        <v-card>
          <v-card-title>Agendar Pagamento</v-card-title>
          <v-card-text>
            <v-text-field v-model="newPaymentDate" label="Nova Data de Pagamento" type="date" :min="getTodayDate()"></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text="Cancelar" @click="dialog = false"></v-btn>
            <v-btn color="primary" @click="schedulePayment">Confirmar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="editDialog" max-width="500">
        <v-card>
          <v-card-title>Editar Dívida</v-card-title>
          <v-card-text>
            <v-text-field v-model="editDebt.name" label="Nome da Dívida*" required></v-text-field>
            <v-text-field v-model="editDebt.value" label="Valor*" type="number" required></v-text-field>
            <v-text-field v-model="editDebt.dueDate" label="Data de Vencimento*" type="date" :min="getTodayDate()" required></v-text-field>
            
            <v-select
              v-model="editDebt.status"
              label="Status da Dívida"
              :items="['pendente', 'agendado', 'pago']"
            ></v-select>
          
          </v-card-text>
          <v-card-actions class="edit-button-group">
            <v-spacer></v-spacer>
            <v-btn color="red" @click="deleteDialog = true">Excluir dívida</v-btn>
            <v-btn text="Cancelar" @click="editDialog = false"></v-btn>
            <v-btn color="blue" @click="saveEditedDebt">Salvar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>


      <v-dialog v-model="deleteDialog" max-width="400" persistent>
        <v-card title="Tem certeza?">
          <v-card-text>
            Você deseja realmente excluir esta dívida? Esta ação não pode ser desfeita.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="deleteDialog = false">Cancelar</v-btn>
            <v-btn color="error" @click="deleteDebt">Excluir</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  </v-container> 
</template>

<script setup>
  import { ref, computed, onMounted } from "vue";
  import { useAlertStore } from '@/stores/alert'
  import RegistroDividas from "./RegistroDividas.vue";

  const alertStore = useAlertStore();
  const debts = ref([]);
  const search = ref("");
  const dialog = ref(false);
  const selectedDebt = ref(null);
  const newPaymentDate = ref("");
  const editDialog = ref(false);
  const editDebt = ref({});
  const deleteDialog = ref(false);
  const role = ref(sessionStorage.getItem("role") || "");
  const users = ref([]); 
  const selectedUserId = ref(null);

  // Função para formatar a data
  const formatDate = (dateString) => {
    const date = new Date(dateString); 
    date.setDate(date.getDate() + 1); 
    return date.toLocaleDateString("pt-BR"); 
  };

  // Filtra as dívidas com base na pesquisa
  const filteredDebts = computed(() => {
    return debts.value.filter((debt) => {
      const matchesSearch = debt.name.toLowerCase().includes(search.value.toLowerCase());
      const matchesUser = selectedUserId.value ? debt.userId === selectedUserId.value : true;
      return matchesSearch && matchesUser;
    });
  });

  const fetchUsers = async () => {
    if (role.value !== "admin") return; // Apenas admins podem buscar usuários

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch("http://localhost:3001/users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        users.value = data.users
          .filter(user => user.role === "cliente")
          .map(user => ({
            _id: user._id,
            username: user.username
          }));; 
      } else {
        alertStore.notifyAlert("Erro ao buscar usuários!", "error");
      }
    } catch (error) {
      alertStore.notifyAlert("Erro ao conectar com a API!", "error");
    }
  };


  // Busca as dívidas do usuário
  const fetchDebts = async () => {
    const userId = sessionStorage.getItem("userId");
    const token = sessionStorage.getItem("token");

    if (!userId || !token) {
      console.error("Usuário não autenticado.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/debts/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        debts.value = data.debts || [];
        checkForPaymentUpdates();
      } else {
        alertStore.notifyAlert('Erro ao buscar as dívidas!', 'error');
      }
    } catch (error) {
      alertStore.notifyAlert('Erro ao conectar com a api!', 'error');
    }
  };

  // Define a data de hoje no formato YYYY-MM-DD
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Ao abrir o modal
  const openScheduleDialog = (debt) => {
    selectedDebt.value = debt;
    newPaymentDate.value = debt.dueDate.split("T")[0];
    dialog.value = true;
  };

  // Agenda o pagamento
  const schedulePayment = async () => {
    if (!newPaymentDate.value) {
      alertStore.notifyAlert("Selecione uma data!", "warning");
      return;
    }

    const token = sessionStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:3001/debts/${selectedDebt.value._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "agendado", dueDate: newPaymentDate.value }),
      });

      if (response.ok) {
        alertStore.notifyAlert(`A dívida "${selectedDebt.value.name}" foi agendada para ${newPaymentDate.value}.`, "info");
        selectedDebt.value.status = "agendado";
        selectedDebt.value.dueDate = newPaymentDate.value;
        dialog.value = false;
      } else {
        alertStore.notifyAlert("Erro ao agendar pagamento!", "error");
      }
    } catch (error) {
      alertStore.notifyAlert("Erro ao conectar com a API!", "error");
    }
  };

  // Verifica se alguma dívida agendada já passou da data e deve ser marcada como paga
  const checkForPaymentUpdates = async () => {
    const today = new Date().toISOString().split("T")[0];

    for (let debt of debts.value) {
      if (debt.status === "agendado" && debt.dueDate < today) {
        await updateDebtStatus(debt._id, "pago");
        debt.status = "pago";
        alertStore.notifyAlert(`A dívida "${debt.name}" foi marcada como paga.`, "info");
      }
    }
  };

  // Atualiza o status de uma dívida na API
  const updateDebtStatus = async (debtId, status) => {
    const token = sessionStorage.getItem("token");
    try {
      await fetch(`http://localhost:3001/debts/${debtId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error("Erro ao atualizar status da dívida:", error);
    }
  };

  // Abrir modal de edição com os dados da dívida selecionada
  const openEditDebt = (debt) => {
    editDebt.value = { ...debt };
    editDebt.value.dueDate = debt.dueDate.split("T")[0];
    editDialog.value = true;
  };

  // Função para salvar a edição da dívida
  const saveEditedDebt = async () => {
    const token = sessionStorage.getItem("token");

    if (role.value !== "admin") {
      alertStore.notifyAlert("Apenas administradores podem editar dívidas!", "error");
      return;
    }

    if (!editDebt.value.name || !editDebt.value.value || !editDebt.value.dueDate) {
      alertStore.notifyAlert("Preencha todos os campos!", "warning");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/debts/${editDebt.value._id}/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: editDebt.value.userId || sessionStorage.getItem("userId"),
          name: editDebt.value.name,
          value: parseFloat(editDebt.value.value),
          dueDate: editDebt.value.dueDate,
          status: editDebt.value.status
        }),
      });

      if (response.ok) {
        alertStore.notifyAlert("Dívida editada com sucesso!", "success");
        editDialog.value = false;
        fetchDebts(); // Atualiza a lista de dívidas
      } else {
        alertStore.notifyAlert("Erro ao editar dívida!", "error");
      }
    } catch (error) {
      alertStore.notifyAlert("Erro ao conectar com a API!", "error");
    }
  };

  // Função para excluir dívida
  const deleteDebt = async () => {
    const token = sessionStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:3001/debts/${editDebt.value._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "excluido" }) 
      });

      if (response.ok) {
        alertStore.notifyAlert("Dívida excluída com sucesso!", "success");
        deleteDialog.value = false;
        editDialog.value = false;
        fetchDebts(); // Atualiza a lista de dívidas após exclusão
      } else {
        alertStore.notifyAlert("Erro ao excluir dívida!", "error");
      }
    } catch (error) {
      alertStore.notifyAlert("Erro ao conectar com a API!", "error");
    }
  };

  onMounted(() => {
    fetchDebts();
    fetchUsers(); 
  });

</script>

<style scoped>
.v-row {
justify-content: flex-start !important;
}

.button-container{
  display: block;
  margin: 0 auto;
  align-items: center;
  text-align: center;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px; 
}

@media (min-width: 730px) {
  .button-group {
    flex-direction: row;
  }
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

.buscaUsuarios{
  margin-right: 20px;
}


</style>