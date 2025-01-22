import { defineStore } from 'pinia'
import { useSettingsStore } from './settings'
import OpenAI from 'openai'

interface Message {
  role: 'user' | 'assistant' | 'error'
  content: string
  timestamp: number
  id?: string
}

// OpenAI API 消息类型
type ApiMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export const useChatStore = defineStore('chat', {
  state: () => {
    // 从localStorage加载初始消息
    const saved = localStorage.getItem('chat_messages')
    return {
      messages: saved ? JSON.parse(saved) : [] as Message[],
      currentMessage: null as Message | null
    }
  },

  actions: {
    clearMessages() {
      this.messages = []
      localStorage.removeItem('chat_messages')
    },

    // 将聊天消息转换为 API 消息格式
    convertToApiMessages(): ApiMessage[] {
      const settingsStore = useSettingsStore()
      
      // 始终将系统提示词作为第一条消息
      const apiMessages: ApiMessage[] = [
        { role: 'system', content: settingsStore.systemPrompt }
      ]

      // 添加历史消息，过滤掉错误消息和当前正在生成的消息
      const historyMessages = this.messages
        .filter((msg: Message) => msg.role !== 'error' && msg !== this.currentMessage)
        .map((msg: Message): ApiMessage => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))

      return [...apiMessages, ...historyMessages]
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
        
        // 创建一个新的 AI 消息
        this.currentMessage = {
          role: 'assistant',
          content: '   ......   ', 
          timestamp: Date.now()
        }
        this.messages.push(this.currentMessage)

        const stream = await openai.chat.completions.create({
          model: settingsStore.model,
          messages: this.convertToApiMessages(),
          temperature: settingsStore.temperature,
          stream: true
        })

        // 处理流式响应
        let isFirstChunk = true
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (this.currentMessage) {
            if (isFirstChunk && content) {
              this.currentMessage.content = content
              isFirstChunk = false
            } else {
              this.currentMessage.content += content
            }
          }
        }

        // 完成后保存消息到localStorage
        localStorage.setItem('chat_messages', JSON.stringify(this.messages))
        this.currentMessage = null
      } catch (error) {
        // 如果出错，移除当前的 AI 消息（如果存在）
        if (this.currentMessage) {
          const index = this.messages.indexOf(this.currentMessage)
          if (index !== -1) {
            this.messages.splice(index, 1)
          }
        }

        this.messages.push({
          role: 'error',
          content: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
          timestamp: Date.now()
        })
        
        // 保存消息到localStorage
        localStorage.setItem('chat_messages', JSON.stringify(this.messages))
        this.currentMessage = null
      }
    }
  }
})
