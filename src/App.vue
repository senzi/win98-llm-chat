<template>
  <div class="app">
    <ChatWindow />
    <SettingsDialog :is-open="showSettings" @close="showSettings = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'
import ChatWindow from './components/ChatWindow.vue'
import SettingsDialog from './components/SettingsDialog.vue'

const showSettings = ref(false)

const openSettings = () => {
  showSettings.value = true
}

provide('openSettings', openSettings)

defineExpose({
  openSettings
})
</script>

<style>
@import '98.css';

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: "Microsoft Sans Serif", "Segoe UI", sans-serif;
}

.app {
  min-height: 100vh;
  background: #008080;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
