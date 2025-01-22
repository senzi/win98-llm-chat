import OpenAI from 'openai'

interface TestOptions {
  apiKey: string
  apiEndpoint: string
  model: string
  temperature: number
  systemPrompt?: string
}

export async function testLLMConnection(options: TestOptions) {
  const baseURL = options.apiEndpoint === '/api/openai' 
    ? 'https://api.openai.com/v1'
    : options.apiEndpoint === '/api/deepseek'
    ? 'https://api.deepseek.com/v1'
    : 'https://api.moonshot.cn/v1'

  const openai = new OpenAI({
    baseURL,
    apiKey: options.apiKey,
    dangerouslyAllowBrowser: true
  })

  const completion = await openai.chat.completions.create({
    model: options.model,
    messages: [
      { role: 'user', content: 'ping！' }
    ],
    temperature: options.temperature,
    max_tokens: 10
  })

  return completion.choices[0].message.content || ''
}
