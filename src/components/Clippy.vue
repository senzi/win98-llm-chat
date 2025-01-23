<template>
  <div class="clippy-container">
    <div class="my-clippy" @mousedown="handleMouseDown" @mouseup="handleMouseUp" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, inject, ref } from 'vue'
import clippy from 'clippyts'
import { clippyManager } from '../utils/clippy'
import type { Emitter } from 'mitt'

const STORAGE_KEY = 'v110_info_read'
const emitter = inject('emitter') as Emitter<any>
const mouseDownTime = ref(0)

const handleMouseDown = () => {
  mouseDownTime.value = Date.now()
}

const handleMouseUp = () => {
  const isClick = Date.now() - mouseDownTime.value < 200
  clippyManager.handleInteraction(isClick)
}

const performGreeting = (agent: any) => {
  agent.speak("我是Clippy，你好！", false)
  agent.play('Greeting')
  setTimeout(() => {
    agent.speak("等下！", false)
    agent.play('GetAttention')
    setTimeout(() => {
      agent.speak("这是给我干到哪年来了？", false)
      agent.play('GetWizardy')
    }, 1000)
  }, 1000)
}

onMounted(() => {
  // @ts-ignore
  window.CLIPPY_CDN = '/assets'
  clippy.load({
    name: 'Clippy',
    selector: 'my-clippy',
    successCb: (agent) => {
      console.log("Clippy loaded!")
      clippyManager.setAgent(agent)
      agent.show(false)

      const hasRead = localStorage.getItem(STORAGE_KEY)
      if (hasRead) {
        // 老用户直接开始表演
        setTimeout(() => performGreeting(agent), 1000)
      } else {
        // 新用户等待关闭模态框后再表演
        emitter.on('versionInfoClosed', () => {
          setTimeout(() => performGreeting(agent), 500)
        })
      }
    },
    failCb: (e) => {
      console.error('Failed to load Clippy:', e)
    }
  })
})
</script>

<style scoped>
.clippy-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}
</style>
