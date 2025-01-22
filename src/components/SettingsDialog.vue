<template>
  <div class="settings-dialog-overlay" v-if="isOpen">
    <div class="window settings-dialog">
      <div class="title-bar">
        <div class="title-bar-text">连接设置</div>
        <div class="title-bar-controls">
          <button aria-label="Close" @click="close"></button>
        </div>
      </div>
      <div class="window-body">
        <div class="field-row">
          <label for="apiKey">API Key:</label>
          <input id="apiKey" type="password" v-model="settings.apiKey">
        </div>

        <div class="field-row">
          <label for="apiEndpoint">API 地址:</label>
          <select id="apiEndpoint" v-model="settings.apiEndpoint">
            <option value="/api/openai">OpenAI</option>
            <option value="/api/deepseek">Deepseek</option>
            <option value="/api/moonshot">Moonshot</option>
            <option value="custom">自定义</option>
          </select>
        </div>

        <div class="field-row" v-if="settings.apiEndpoint === 'custom'">
          <label for="customEndpoint">自定义地址:</label>
          <input id="customEndpoint" type="text" v-model="settings.customEndpoint">
        </div>

        <div class="field-row">
          <label for="model">模型:</label>
          <select id="model" v-model="settings.model" :disabled="!settings.apiKey">
            <template v-if="settings.apiEndpoint === '/api/openai'">
              <option value="gpt-4">gpt-4</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            </template>
            <template v-else-if="settings.apiEndpoint === '/api/deepseek'">
              <option value="deepseek-chat">deepseek-chat</option>
            </template>
            <template v-else-if="settings.apiEndpoint === '/api/moonshot'">
              <option value="moonshot-v1-auto">moonshot-v1-auto</option>
            </template>
          </select>
        </div>

        <div class="field-row">
          <label for="temperature">温度:</label>
          <input id="temperature" type="range" min="0" max="2" step="0.1" :value="Number(settings.temperature)"
            @input="e => settings.temperature = Number((e.target as HTMLInputElement).value)">
          <span>{{ Number(settings.temperature).toFixed(1) }}</span>
        </div>

        <fieldset>
          <legend>系统提示词</legend>
          <textarea v-model="settings.systemPrompt" rows="4"></textarea>
        </fieldset>

        <div class="field-row" style="justify-content: flex-end">
          <button @click="testConnection" :disabled="testing">连接测试</button>
          <button @click="save" :disabled="testing">保存</button>
          <button @click="close">取消</button>
        </div>
      </div>
      <!-- 测试结果弹窗 -->
      <div v-if="showTestResult" class="modal-overlay" @click.self="showTestResult = false">
        <div class="modal-window test-result-window">
          <div class="title-bar">
            <div class="title-bar-text">测试结果</div>
            <div class="title-bar-controls">
              <button aria-label="Close" @click="showTestResult = false"></button>
            </div>
          </div>
          <div class="window-body">
            <div class="modal-content">
              <div class="warning-icon" :class="{ 'success': testSuccess }">
                {{ testSuccess ? '✓' : '!' }}
              </div>
              <div class="modal-message">
                <div v-if="testSuccess">连接成功！</div>
                <div v-if="testResponse">
                  {{ testResponse }}
                </div>
                <div v-if="testError" class="error-message">
                  错误：{{ testError }}
                </div>
              </div>
            </div>
            <div class="modal-buttons">
              <button @click="showTestResult = false">确定</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useChatStore } from '../stores/chat'
import { testLLMConnection } from '../utils/llmTest'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])

const settingsStore = useSettingsStore()
const chatStore = useChatStore()
const showDialog = ref(false)
const testing = ref(false)
const showTestResult = ref(false)
const testSuccess = ref(false)
const testResponse = ref('')
const testError = ref('')

const settings = reactive({
  apiKey: settingsStore.apiKey,
  apiEndpoint: settingsStore.apiEndpoint,
  customEndpoint: settingsStore.customEndpoint,
  model: settingsStore.model,
  temperature: settingsStore.temperature,
  systemPrompt: settingsStore.systemPrompt
})

// 根据 API 地址获取默认模型
const getDefaultModel = (endpoint: string) => {
  switch (endpoint) {
    case '/api/openai':
      return 'gpt-3.5-turbo'
    case '/api/deepseek':
      return 'deepseek-chat'
    case '/api/moonshot':
      return 'moonshot-v1-auto'
    default:
      return settings.model
  }
}

// 监听 API 地址变化
watch(() => settings.apiEndpoint, (newEndpoint) => {
  if (newEndpoint !== 'custom') {
    settings.model = getDefaultModel(newEndpoint)
  }
})

const testConnection = async () => {
  testing.value = true
  testSuccess.value = false
  testResponse.value = ''
  testError.value = ''

  try {
    const response = await testLLMConnection({
      apiKey: settings.apiKey,
      apiEndpoint: settings.apiEndpoint === 'custom' ? settings.customEndpoint : settings.apiEndpoint,
      model: settings.model,
      temperature: settings.temperature,
      systemPrompt: ''
    })

    testSuccess.value = true
    testResponse.value = response
  } catch (error: any) {
    testSuccess.value = false
    testError.value = error.message
  } finally {
    testing.value = false
    showTestResult.value = true
  }
}

const save = () => {
  settingsStore.updateSettings(settings)
  close()
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.settings-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.settings-dialog {
  position: relative;
  width: 400px;
  z-index: 1001;
}

.window-body {
  padding: 10px;
}

.field-row {
  display: flex;
  align-items: center;
  margin: 8px 0;
  gap: 8px;
}

.field-row label {
  min-width: 100px;
}

.field-row input[type="text"],
.field-row input[type="password"],
.field-row select {
  flex: 1;
  min-width: 0;
}

fieldset {
  margin: 16px 0;
  padding: 10px;
}

textarea {
  width: 100%;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.field-row:last-child {
  justify-content: flex-end;
  margin-top: 16px;
}

.field-row button {
  min-width: 80px;
  margin-left: 8px;
}

input[type="range"] {
  flex: 1;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1002;
}

.test-result-window {
  width: 300px;
  position: relative;
  background: #c0c0c0;
  box-shadow: inset -1px -1px #0a0a0a,inset 1px 1px #dfdfdf,inset -2px -2px grey,inset 2px 2px #fff;
}

.modal-content {
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.warning-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #000;
  background: #ffff00;
  border-radius: 50%;
  border: 2px solid #000;
}

.warning-icon.success {
  background: #00ff00;
}

.modal-message {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  padding: 8px;
}

.error-message {
  color: #ff0000;
  margin-top: 8px;
}
</style>
