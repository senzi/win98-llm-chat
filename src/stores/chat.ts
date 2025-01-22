import { defineStore } from 'pinia'
import { useSettingsStore } from './settings'
import OpenAI from 'openai'

interface Message {
  role: 'user' | 'assistant' | 'error'
  content: string
  timestamp: number
  id?: string
}

export const useChatStore = defineStore('chat', {
  state: () => {
    // 从localStorage加载初始消息
    const saved = localStorage.getItem('chat_messages')
    return {
      messages: saved ? JSON.parse(saved) : [] as Message[]
    }
  },

  actions: {
    clearMessages() {
      this.messages = []
      localStorage.removeItem('chat_messages')
    },

    async sendMessage(content: string) {
      const settingsStore = useSettingsStore()

      // 添加用户消息
      this.messages.push({
        role: 'user',
        content,
        timestamp: Date.now()
      })

      // 保存消息到localStorage
      localStorage.setItem('chat_messages', JSON.stringify(this.messages))

      try {
        const openai = new OpenAI({
          baseURL: settingsStore.effectiveApiEndpoint === '/api/openai'
            ? 'https://api.openai.com'
            : settingsStore.effectiveApiEndpoint === '/api/deepseek'
            ? 'https://api.deepseek.com'
            : 'https://api.moonshot.cn',
          apiKey: settingsStore.apiKey,
          dangerouslyAllowBrowser: true
        })
        
        const completion = await openai.chat.completions.create({
          model: settingsStore.model,
          messages: [
            { role: 'system', content: settingsStore.systemPrompt },
            ...this.messages
              .filter((msg: Message) => msg.role !== 'error')
              .map((msg: Message) => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
              }))
          ],
          temperature: settingsStore.temperature,
        })

        // 添加 AI 响应
        this.messages.push({
          role: 'assistant',
          content: completion.choices[0].message.content || '',
          timestamp: Date.now()
        })

        // 保存消息到localStorage
        localStorage.setItem('chat_messages', JSON.stringify(this.messages))
      } catch (error) {
        this.messages.push({
          role: 'error',
          content: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
          timestamp: Date.now()
        })
        // 保存消息到localStorage
        localStorage.setItem('chat_messages', JSON.stringify(this.messages))
      }
    }
  }
})
