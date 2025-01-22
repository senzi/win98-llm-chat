import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const apiKey = ref('')
  const apiEndpoint = ref('/api/openai')
  const customEndpoint = ref('')
  const model = ref('gpt-3.5-turbo')
  const temperature = ref<number>(0.7)
  const systemPrompt = ref('你是一个友好的AI助手。')

  // 计算实际使用的API端点
  const effectiveApiEndpoint = computed(() => {
    return apiEndpoint.value === 'custom' ? customEndpoint.value : apiEndpoint.value
  })

  // 从localStorage加载设置
  const loadSettings = () => {
    const saved = localStorage.getItem('settings')
    if (saved) {
      const data = JSON.parse(saved)
      apiKey.value = data.apiKey || ''
      apiEndpoint.value = data.apiEndpoint || '/api/openai'
      customEndpoint.value = data.customEndpoint || ''
      model.value = data.model || 'gpt-3.5-turbo'
      temperature.value = typeof data.temperature === 'number' ? data.temperature : 0.7
      systemPrompt.value = data.systemPrompt || '你是一个友好的AI助手。'
    }
  }

  // 保存设置到localStorage
  const saveSettings = () => {
    localStorage.setItem('settings', JSON.stringify({
      apiKey: apiKey.value,
      apiEndpoint: apiEndpoint.value,
      customEndpoint: customEndpoint.value,
      model: model.value,
      temperature: Number(temperature.value),
      systemPrompt: systemPrompt.value
    }))
  }

  // 更新设置
  const updateSettings = (newSettings: {
    apiKey: string
    apiEndpoint: string
    customEndpoint: string
    model: string
    temperature: number
    systemPrompt: string
  }) => {
    apiKey.value = newSettings.apiKey
    apiEndpoint.value = newSettings.apiEndpoint
    customEndpoint.value = newSettings.customEndpoint
    model.value = newSettings.model
    temperature.value = Number(newSettings.temperature)
    systemPrompt.value = newSettings.systemPrompt
    saveSettings()
  }

  // 初始化时加载设置
  loadSettings()

  return {
    apiKey,
    apiEndpoint,
    customEndpoint,
    model,
    temperature,
    systemPrompt,
    effectiveApiEndpoint,
    updateSettings
  }
})
