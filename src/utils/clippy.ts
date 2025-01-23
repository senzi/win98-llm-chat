import OpenAI from 'openai'
import { useChatStore } from '../stores/chat'
import { useSettingsStore } from '../stores/settings'

const DEFAULT_SYSTEM_PROMPT = '你是Clippy,只能用一句话回应用户。不要用Markdown和提供任何代码。总是以"看起来..."或"我注意到..."开头，保持活泼但略显烦人的语气。'

interface ClippyState {
  lastUserMessage: string
  lastResponse: string
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

class ClippyManager {
  private state: ClippyState = {
    lastUserMessage: '',
    lastResponse: ''
  }
  private agent: any = null

  setAgent(agent: any) {
    this.agent = agent
  }

  async handleInteraction(isClick: boolean) {
    if (!this.agent) return

    if (!isClick) {
      // 如果是拖动，只做动画
      this.agent.animate()
      return
    }

    // 点击时，先停止当前所有动作
    this.agent.stop()
    
    // 显示搜索动画
    this.agent.play('Searching')

    // 获取最新的用户消息
    const chatStore = useChatStore()
    const messages = chatStore.messages
    const lastUserMessage = messages.length > 0 
      ? messages.filter((m: ChatMessage) => m.role === 'user').pop()?.content 
      : '用户之前还没说过话'

    // 如果用户消息没变且有缓存的回复，直接使用缓存
    if (lastUserMessage === this.state.lastUserMessage && this.state.lastResponse) {
      this.agent.stop() // 停止搜索动画
      this.agent.speak(this.state.lastResponse)
      this.agent.animate()
      return
    }

    // 否则调用API获取新回复
    try {
      const settingsStore = useSettingsStore()
      const openai = new OpenAI({
        baseURL: settingsStore.apiEndpoint === '/api/openai' 
          ? 'https://api.openai.com/v1'
          : settingsStore.apiEndpoint === '/api/deepseek'
          ? 'https://api.deepseek.com/v1'
          : 'https://api.moonshot.cn/v1',
        apiKey: settingsStore.apiKey,
        dangerouslyAllowBrowser: true
      })

      // 并行执行API调用
      openai.chat.completions.create({
        model: settingsStore.model,
        messages: [
          { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
          { role: 'user', content: lastUserMessage }
        ],
        temperature: 0.7,
        max_tokens: 50
      }).then(completion => {
        const response = completion.choices[0].message.content || ''
      
        // 更新状态
        this.state.lastUserMessage = lastUserMessage
        this.state.lastResponse = response

        // 显示回复前停止搜索动画
        this.agent.stop()
        // 显示回复
        this.agent.speak(response)
        this.agent.animate()
      }).catch(error => {
        console.error('Clippy API error:', error)
        this.agent.stop() // 错误时也要停止搜索动画
        
        // 根据错误类型给出不同提示
        if (error instanceof Error) {
          if (error.message.includes('key')) {
            this.agent.speak('看起来API密钥有问题...要不要检查一下设置？')
          } else if (error.message.includes('network') || error.message.includes('connect')) {
            this.agent.speak('看起来网络连接有问题...要不要检查一下API地址？')
          } else {
            this.agent.speak('我遇到了一些问题...要不要检查一下API设置？')
          }
        } else {
          this.agent.speak('我遇到了一些问题...要不要检查一下API设置？')
        }
        
        this.agent.animate()
      })

    } catch (error) {
      this.agent.stop()
      console.error('Failed to initialize OpenAI:', error)
      this.agent.speak('看起来API设置有问题...')
      this.agent.animate()
    }
  }
}

export const clippyManager = new ClippyManager()
