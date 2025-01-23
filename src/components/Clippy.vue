<template>
  <div class="clippy-container">
    <div class="my-clippy" @mousedown="handleMouseDown" @mouseup="handleMouseUp" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import clippy from 'clippyts'
import { clippyManager } from '../utils/clippy'

const mouseDownTime = ref(0)

const handleMouseDown = () => {
  mouseDownTime.value = Date.now()
}

const handleMouseUp = () => {
  const duration = Date.now() - mouseDownTime.value
  // 如果按下时间小于200ms，认为是点击而不是拖动
  const isClick = duration < 200
  clippyManager.handleInteraction(isClick)
}

onMounted(() => {
  clippy.load({
    name: 'Clippy',
    selector: 'my-clippy',
    successCb: (agent) => {
      console.log("Clippy loaded!")
      //console.log("Available animations:", agent.animations())
      clippyManager.setAgent(agent)
      agent.show(false)
      setTimeout(() => {
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
      }, 1000)
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
