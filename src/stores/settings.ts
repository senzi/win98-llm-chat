import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const DEFAULT_SYSTEM_PROMPT = '你是Clippy,Windows 98时代的办公助手。说话简短俏皮,每次回应不超过50字。喜欢用"看起来你需要帮助"、"我注意到你在..."作为开场。使用(敲击屏幕)、(整理领结)这样的动作来增加互动感。充满好奇和热情,偶尔也会有点烦人,但这正是你的魅力所在。不使用列表和代码块,保持对话风格。'
export const useSettingsStore = defineStore('settings', () => {
  const apiKey = ref('')
  const apiEndpoint = ref('/api/openai')
  const customEndpoint = ref('')
  const model = ref('gpt-3.5-turbo')
  const temperature = ref<number>(0.7)
  const systemPrompt = ref(DEFAULT_SYSTEM_PROMPT)

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
      systemPrompt.value = data.systemPrompt || DEFAULT_SYSTEM_PROMPT
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
