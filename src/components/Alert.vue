<template>
    <div v-if="showAlert" class="alert-notification">
      <v-alert
        class="animate__animated animate__pulse"
        closable
        :text="message"
        :type="type"
      ></v-alert>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { useAlertStore } from "@/stores/alert"; 
import 'animate.css';

const alertStore = useAlertStore();

const showAlert = computed(() => alertStore.showAlert);
const message = computed(() => alertStore.message);
const type = computed(() => alertStore.type);
</script>

<style scoped>
    .alert-notification {
        position: fixed;
        bottom: 50px;
        left: 50%;
        transform: translateX(-50%); 
        z-index: 1000;
        width: auto;
        min-width: 400px;
    }
</style>