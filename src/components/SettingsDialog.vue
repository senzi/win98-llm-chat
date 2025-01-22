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
          <select id="model" v-model="settings.model">
            <option v-for="model in availableModels" :key="model.value" :value="model.value">
              {{ model.label }}
            </option>
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
          <button @click="testConnection" :disabled="isTestingConnection">连接测试</button>
          <button @click="save" :disabled="isTestingConnection">保存</button>
          <button @click="close">取消</button>
        </div>
      </div>
      <!-- 测试结果弹窗 -->
      <div v-if="testResult" class="modal-overlay" @click.self="testResult = null">
        <div class="modal-window test-result-window">
          <div class="title-bar">
            <div class="title-bar-text">测试结果</div>
            <div class="title-bar-controls">
              <button aria-label="Close" @click="testResult = null"></button>
            </div>
          </div>
          <div class="window-body">
            <div class="modal-content">
              <div class="warning-icon" :class="{ 'success': testResult.status === 'success' }">
                {{ testResult.status === 'success' ? '✓' : '!' }}
              </div>
              <div class="modal-message">
                <div v-if="testResult.status === 'success'">连接成功！</div>
                <div v-if="testResult.status === 'error'">连接失败！</div>
                <pre>{{ testResult.message }}</pre>
              </div>
            </div>
            <div class="modal-buttons">
              <button @click="testResult = null">确定</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { testLLMConnection } from '../utils/llmTest'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])
const settingsStore = useSettingsStore()

const isTestingConnection = ref(false)
const testResult = ref<{
  status: 'success' | 'error',
  message: string
} | null>(null)

type ApiEndpoint = '/api/openai' | '/api/deepseek' | '/api/moonshot' | 'custom'

interface ModelOption {
  value: string
  label: string
}

type ModelOptions = Record<ApiEndpoint, ModelOption[]>

const modelOptions = {
  '/api/openai': [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' }
  ],
  '/api/deepseek': [
    { value: 'deepseek-chat', label: 'Deepseek Chat' },
    { value: 'deepseek-coder', label: 'Deepseek Coder' }
  ],
  '/api/moonshot': [
    { value: 'moonshot-v1-8k', label: 'Moonshot V1 8K' },
    { value: 'moonshot-v1-32k', label: 'Moonshot V1 32K' },
    { value: 'moonshot-v1-128k', label: 'Moonshot V1 128K' }
  ],
  'custom': [] as ModelOption[]
} as const satisfies ModelOptions

const settings = reactive({
  apiKey: settingsStore.apiKey,
  apiEndpoint: settingsStore.apiEndpoint as ApiEndpoint,
  customEndpoint: settingsStore.customEndpoint,
  model: settingsStore.model,
  temperature: settingsStore.temperature,
  systemPrompt: settingsStore.systemPrompt
})

// 计算当前可用的模型列表
const availableModels = computed(() => {
  const endpoint = settings.apiEndpoint
  return modelOptions[endpoint]
})

// 根据 API 地址获取默认模型
const getDefaultModel = (endpoint: ApiEndpoint): string => {
  const models = modelOptions[endpoint]
  return models.length > 0 ? models[0].value : settings.model
}

// 监听 API 地址变化，自动切换默认模型
watch(() => settings.apiEndpoint, (newEndpoint: ApiEndpoint) => {
  if (newEndpoint !== 'custom') {
    settings.model = getDefaultModel(newEndpoint)
  }
})

const testConnection = async () => {
  isTestingConnection.value = true
  testResult.value = null

  try {
    const response = await testLLMConnection({
      apiKey: settings.apiKey,
      apiEndpoint: settings.apiEndpoint === 'custom' ? settings.customEndpoint : settings.apiEndpoint,
      model: settings.model,
      temperature: settings.temperature,
      systemPrompt: ''
    })

    testResult.value = {
      status: 'success',
      message: response
    }
  } catch (error) {
    testResult.value = {
      status: 'error',
      message: error instanceof Error ? error.message : '未知错误'
    }
  } finally {
    isTestingConnection.value = false
  }
}

const close = () => {
  emit('close')
}

const save = () => {
  settingsStore.updateSettings(settings)
  close()
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
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}

.modal-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-width: 100%;
}

.modal-message {
  flex: 1;
  min-width: 0;
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
