import { defineStore } from 'pinia'

export const useAlertStore = defineStore('alert', {
  state: () => ({
    showAlert: false,
    message: "",
    type: "success",
  }),
  actions:{
    notifyAlert(message, type = "success"){
        this.message = message;
        this.type = type;
        this.showAlert = true;
        setTimeout(()=>{
            this.showAlert = false;
        }, 2000)
    }
  }
})
