<template>
  <div class="window chat-window">
    <div class="title-bar">
      <div class="title-bar-text">LLM 98</div>
      <div class="title-bar-controls">
        <button aria-label="Minimize"></button>
        <button aria-label="Maximize" disabled></button>
        <button aria-label="Close" @click="showClearConfirm = true"></button>
      </div>
    </div>
    <div class="window-body">
      <div class="chat-container" ref="chatHistory">
        <div v-for="(message, index) in messages" :key="index" 
             :class="['message', message.role === 'user' ? 'user-message' : message.role === 'error' ? 'error-message' : 'bot-message']">
          <div class="message-wrapper">
            <div class="message-content" :class="{'multiline': String(message.content).split('\n').length > 1}" v-html="formatMessage(String(message.content))"></div>
          </div>
          <div class="message-meta">
            <span>{{ message.role === 'user' ? 'User' : message.role === 'error' ? 'Error' : 'Assistant' }}</span>
            <span>{{ formatTime(message.timestamp) }}</span>
          </div>
        </div>
      </div>
      
      <div class="input-container">
        <div class="input-area">
          <textarea 
            v-model="userInput" 
            @keydown.ctrl.enter="sendMessage"
            placeholder="输入消息..."
          ></textarea>
        </div>
        <div class="button-group">
          <button @click="clearChat">清空对话</button>
          <button @click="sendMessage" :disabled="isLoading">发送</button>
        </div>
      </div>
    </div>

    <div class="status-bar">
      <p class="status-bar-field button" @click="openSettings" style="cursor: pointer">
        <u>S</u>ettings
      </p>
      <p class="status-bar-field status">API: {{ currentEndpoint }}</p>
      <p class="status-bar-field status">Model: {{ settingsStore.model }}</p>
      <p class="status-bar-field status">Temperature: {{ settingsStore.temperature }}</p>
    </div>

    <!-- 清空确认对话框 -->
    <div v-if="showClearConfirm" class="modal-overlay" @click.self="showClearConfirm = false">
      <div class="modal-window">
        <div class="title-bar">
          <div class="title-bar-text">确认清空</div>
          <div class="title-bar-controls">
            <button aria-label="Close" @click="showClearConfirm = false"></button>
          </div>
        </div>
        <div class="window-body">
          <p>确定要清空所有对话记录吗？</p>
          <div class="button-group">
            <button @click="confirmClear">确定</button>
            <button @click="showClearConfirm = false">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useChatStore } from '../stores/chat'
import { useSettingsStore } from '../stores/settings'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const openSettings = inject('openSettings') as () => void

const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const chatHistory = ref<HTMLElement | null>(null)
const userInput = ref('')
const isLoading = ref(false)
const showClearConfirm = ref(false)

const messages = computed(() => chatStore.messages)

// 计算当前的API地址显示
const currentEndpoint = computed(() => {
  const endpoint = settingsStore.apiEndpoint
  return endpoint === 'custom' ? settingsStore.customEndpoint : 
    endpoint === '/api/openai' ? 'OpenAI' :
    endpoint === '/api/deepseek' ? 'Deepseek' : 'Moonshot'
})

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const formatMessage = (content: string) => {
  const parsed = marked.parse(content || '')
  return DOMPurify.sanitize(typeof parsed === 'string' ? parsed : '')
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  const message = userInput.value
  userInput.value = ''
  isLoading.value = true

  try {
    await chatStore.sendMessage(message)
  } finally {
    isLoading.value = false
    if (chatHistory.value) {
      chatHistory.value.scrollTop = chatHistory.value.scrollHeight
    }
  }
}

const confirmClear = () => {
  chatStore.clearMessages()
  showClearConfirm.value = false
}

const clearChat = () => {
  showClearConfirm.value = true
}

onMounted(() => {
  if (chatHistory.value) {
    chatHistory.value.scrollTop = chatHistory.value.scrollHeight
  }
})
</script>

<style scoped>
.chat-window {
  width: 800px;
  height: 600px;
  display: flex;
  flex-direction: column;
}

.title-bar {
  height: 28px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.window-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 6px;
  gap: 6px;
}

.chat-container {
  flex: 1;
  background: white;
  border: inset 1px #969696;
  overflow-y: auto;
  padding: 12px;
  box-sizing: border-box;
}

.message {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  width: 100%;
}

.message-wrapper {
  display: flex;
  width: 100%;
  min-height: 32px;
  align-items: center;
}

.message-content {
  position: relative;
  padding: 6px 8px;
  word-wrap: break-word;
  white-space: pre-wrap;
  border: 1px solid #000000;
  border-radius: 8px;
  background: #FFFFCC;
  max-width: 80%;
  font-size: 12px;
  line-height: 1.4;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.message-content > * {
  margin: 0;
}

.message-content pre {
  box-shadow: none !important;
  -webkit-box-shadow: none !important;
  margin: 8px 0;
  padding: 8px;
  background: #FFFFFF;
  border: 1px solid #000000;
  border-radius: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
  width: 100%;
  box-sizing: border-box;
}

.message-content pre code {
  box-shadow: none !important;
  -webkit-box-shadow: none !important;
  white-space: pre-wrap;
  word-wrap: break-word;
  vertical-align: middle;
  background: transparent;
}

.message-content code {
  box-shadow: none !important;
  -webkit-box-shadow: none !important;
  font-family: monospace;
  background: #f0f0f0;
}

.message-content.multiline pre code {
  box-shadow: none !important;
  -webkit-box-shadow: none !important;
  display: block;
  padding: 4px 0;
}

.message-content > p {
  margin: 0;
  min-height: 1.4em;
  display: flex;
  align-items: center;
}

.message-content > :first-child {
  margin-top: 0;
}

.message-content > :last-child {
  margin-bottom: 0;
}

.message-content p {
  margin: 0;
  padding: 0;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.message-content > *:first-child {
  margin-top: 0;
  padding-top: 0;
}

.message-content > *:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
}

.message-content p,
.message-content h1,
.message-content h2,
.message-content h3,
.message-content h4,
.message-content h5,
.message-content h6,
.message-content ul,
.message-content ol {
  margin: 0;
  padding: 0;
}

.message-content ul,
.message-content ol {
  padding-left: 1.5em;
}

.message-content * + * {
  margin-top: 8px;
}

.message-content p + p {
  margin-top: 8px;
}

/* 用户消息样式 */
.user-message .message-wrapper {
  justify-content: flex-end;
}

.user-message .message-content {
  background: #FFFFCC;
}

/* AI消息样式 */
.bot-message .message-wrapper {
  justify-content: flex-start;
}

.bot-message .message-content {
  background: #FFFFCC;
}

/* 用户消息的小三角形 */
.user-message .message-content:after {
  content: '';
  position: absolute;
  bottom: -8px;
  right: 12px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #000000;
}

.user-message .message-content:before {
  content: '';
  position: absolute;
  bottom: -6px;
  right: 13px;
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 7px solid #FFFFCC;
  z-index: 1;
}

/* 机器人消息的小三角形 */
.bot-message .message-content:after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 12px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #000000;
}

.bot-message .message-content:before {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 13px;
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 7px solid #FFFFCC;
  z-index: 1;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #666;
  margin-top: 4px;
  padding: 0 4px;
}

.user-message .message-meta {
  justify-content: flex-end;
}

.bot-message .message-meta {
  justify-content: flex-start;
}

.chat-container::-webkit-scrollbar {
  width: 16px;
}

.chat-container::-webkit-scrollbar-track {
  background: #dfdfdf;
  border: solid 1px #969696;
}

.chat-container::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border: solid 1px #969696;
  box-shadow: inset 1px 1px #dfdfdf, inset -1px -1px gray;
}

.code-block {
  background: #000;
  color: #fff;
  font-family: monospace;
  padding: 8px;
  margin: 4px 0;
  white-space: pre;
}

.error-message .message-content {
  background: #ffd6d6;
  border-color: #c86464;
}

.input-container {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-area {
  width: 100%;
}

textarea {
  width: 100%;
  height: 60px;
  resize: none;
  font-family: inherit;
  padding: 4px;
  box-sizing: border-box;
}

.button-group {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.button-group button {
  min-width: 80px;
  height: 24px;
  padding: 0 6px;
}

.status-bar {
  display: flex;
  gap: 1px;
  padding: 2px;
  background: var(--surface);
  border-top: 1px solid var(--button-face);
  margin: 0;
}

.status-bar-field {
  margin: 0;
  padding: 2px 3px;
  gap: 1px;
  flex: 1;
  min-height: 21px;
  line-height: 16px;
  font-size: 11px;
}

.status-bar-field.button {
  background: var(--button-face);
  border: 1px solid;
  border-color: var(--button-face);
  box-shadow: inset -1px -1px #0a0a0a,inset 1px 1px #fff,inset -2px -2px grey,inset 2px 2px #dfdfdf;
}

.status-bar-field.status {
  background: var(--button-face);
  border: 1px solid;
  border-color: #888 #dadada #dadada #888;
}

.status-bar-field u {
  text-decoration: none;
  border-bottom: 1px solid #000;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(128, 128, 128, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-window {
  width: 300px;
  background: #c0c0c0;
  /* Win98 风格边框 */
  border-top: 1px solid #dfdfdf;
  border-left: 1px solid #dfdfdf;
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
  box-shadow: 1px 1px 0 black;
}

.modal-window .title-bar {
  margin: 2px 2px 0 2px;
}

.modal-window .window-body {
  margin: 0 2px 2px 2px;
  /* Win98 风格内边框 */
  border-left: 1px solid #7f7f7f;
  border-top: 1px solid #7f7f7f;
  border-right: 1px solid #ffffff;
  border-bottom: 1px solid #ffffff;
  padding: 0;
  background: #c0c0c0;
}

.modal-content {
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.warning-icon {
  width: 32px;
  height: 32px;
  background: #c0c0c0;
  border: 1px solid #7f7f7f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #000;
  font-size: 24px;
}

.modal-message {
  flex: 1;
  font-size: 12px;
}

.modal-buttons {
  padding: 12px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.modal-buttons button {
  min-width: 70px;
  padding: 4px 8px;
}

.modal-buttons button:focus {
  outline: 1px dotted #000;
  outline-offset: -4px;
}

</style>
