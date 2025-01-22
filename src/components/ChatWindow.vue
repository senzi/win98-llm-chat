<template>
  <div class="window chat-window">
    <div class="title-bar">
      <div class="title-bar-text">LLM 98</div>
      <div class="title-bar-controls">
        <button aria-label="Minimize"></button>
        <button aria-label="Maximize"></button>
        <button aria-label="Close"></button>
        <button aria-label="Clear" @click="showClearConfirm = true"></button>
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
          <button @click="sendMessage" :disabled="isLoading">发送</button>
          <button @click="$parent.openSettings">设置</button>
          <button @click="clearChat">清空对话</button>
        </div>
      </div>
    </div>

    <!-- 清空对话确认框 -->
    <div v-if="showClearConfirm" class="modal-overlay" @click.self="showClearConfirm = false">
      <div class="modal-window">
        <div class="title-bar">
          <div class="title-bar-text">警告</div>
          <div class="title-bar-controls">
            <button aria-label="Close" @click="showClearConfirm = false"></button>
          </div>
        </div>
        <div class="window-body">
          <div class="modal-content">
            <div class="warning-icon">!</div>
            <div class="modal-message">
              确定要清空所有对话记录吗？<br>
              此操作无法撤销。
            </div>
          </div>
          <div class="modal-buttons">
            <button @click="confirmClear" @keyup.y="confirmClear">是(Y)</button>
            <button @click="showClearConfirm = false" @keyup.n="showClearConfirm = false">否(N)</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChatStore } from '../stores/chat'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const chatStore = useChatStore()
const chatHistory = ref<HTMLElement | null>(null)
const userInput = ref('')
const isLoading = ref(false)
const showClearConfirm = ref(false)

const messages = computed(() => chatStore.messages)

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const formatMessage = (content: string | null | undefined) => {
  // 使用 marked 解析 markdown，并用 DOMPurify 清理 HTML
  return DOMPurify.sanitize(marked(String(content || '')))
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return
  
  const message = {
    role: 'user',
    content: userInput.value,
    timestamp: Date.now()
  }
  userInput.value = ''
  
  await chatStore.sendMessage(message)
}

const clearChat = () => {
  showClearConfirm.value = true
}

const confirmClear = () => {
  chatStore.clearMessages()
  showClearConfirm.value = false
}

onMounted(() => {
  if (chatHistory.value) {
    chatHistory.value.scrollTop = chatHistory.value.scrollHeight
  }
})
</script>

<style scoped>
.chat-window {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.window-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px;
  overflow: hidden;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 8px;
  padding: 8px;
}

.message {
  margin-bottom: 16px;
}

.message-wrapper {
  display: inline-block;
  max-width: 80%;
  margin-bottom: 4px;
}

.message-content {
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-content :deep(p) {
  margin: 8px 0;
}

.message-content :deep(pre) {
  background: #f0f0f0;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-content :deep(code) {
  font-family: 'Courier New', Courier, monospace;
}

.message-content :deep(hr) {
  margin: 16px 0;
  border: none;
  border-top: 1px solid #ccc;
}

.user-message .message-wrapper {
  margin-left: auto;
}

.user-message .message-content {
  background: #e6f3ff;
}

.bot-message .message-content {
  background: #f5f5f5;
}

.error-message .message-content {
  background: #ffe6e6;
  color: #ff0000;
}

.message-meta {
  font-size: 12px;
  color: #666;
  display: flex;
  gap: 8px;
}

.user-message .message-meta {
  justify-content: flex-end;
}

.input-container {
  border-top: 1px solid #ccc;
  padding-top: 8px;
}

.input-area {
  display: flex;
  gap: 8px;
}

textarea {
  flex: 1;
  min-height: 60px;
  resize: vertical;
}

.multiline {
  white-space: pre-wrap;
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
