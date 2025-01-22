import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import OpenAI from 'openai'
import { useSettingsStore } from './settings'

interface Message {
  role: 'user' | 'assistant' | 'error'
  content: string
  timestamp: number
  id?: string
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<Message[]>([])
  const settingsStore = useSettingsStore()

  // 从localStorage加载消息
  const loadMessages = () => {
    const saved = localStorage.getItem('chat_messages')
    if (saved) {
      try {
        messages.value = JSON.parse(saved)
      } catch (error) {
        console.error('Failed to load messages:', error)
      }
    }
  }

  // 保存消息到localStorage
  const saveMessages = () => {
    localStorage.setItem('chat_messages', JSON.stringify(messages.value))
  }

  // 监听消息变化，自动保存
  watch(() => messages.value, () => {
    saveMessages()
  }, { deep: true })

  const getOpenAIClient = () => {
    const baseURL = settingsStore.effectiveApiEndpoint === '/api/openai' 
      ? 'https://api.openai.com'
      : settingsStore.effectiveApiEndpoint === '/api/deepseek'
      ? 'https://api.deepseek.com'
      : 'https://api.moonshot.cn'

    return new OpenAI({
      baseURL,
      apiKey: settingsStore.apiKey,
      dangerouslyAllowBrowser: true
    })
  }

  const sendMessage = async (message: { role: string, content: string, timestamp: number }, options?: {
    apiKey?: string,
    apiEndpoint?: string,
    model?: string,
    temperature?: number,
    systemPrompt?: string
  }) => {
    // 添加用户消息
    messages.value.push({
      role: message.role as 'user' | 'assistant' | 'error',
      content: message.content,
      timestamp: message.timestamp
    })

    try {
      const openai = options ? new OpenAI({
        baseURL: options.apiEndpoint === '/api/openai' 
          ? 'https://api.openai.com'
          : options.apiEndpoint === '/api/deepseek'
          ? 'https://api.deepseek.com'
          : 'https://api.moonshot.cn',
        apiKey: options.apiKey,
        dangerouslyAllowBrowser: true
      }) : getOpenAIClient()
      
      const completion = await openai.chat.completions.create({
        model: options?.model || settingsStore.model,
        messages: [
          { role: 'system', content: options?.systemPrompt || settingsStore.systemPrompt },
          ...messages.value
            .filter(msg => msg.role !== 'error')
            .map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            }))
        ],
        temperature: options?.temperature ?? settingsStore.temperature,
      })

      // 添加 AI 响应
      messages.value.push({
        role: 'assistant',
        content: completion.choices[0].message.content || '',
        timestamp: Date.now()
      })
    } catch (error) {
      // 添加错误消息
      messages.value.push({
        role: 'error',
        content: `错误: ${error.message}`,
        timestamp: Date.now()
      })
    }
  }

  const clearMessages = () => {
    messages.value = []
    // 清空本地存储
    localStorage.removeItem('chat_messages')
  }

  // 初始化时加载消息
  loadMessages()

  return {
    messages,
    sendMessage,
    clearMessages
  }
})
