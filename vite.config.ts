import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/openai/': {
        target: 'https://api.openai.com/v1/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai\//, '')
      },
      '/api/deepseek/': {
        target: 'https://api.deepseek.com/v1/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deepseek\//, '')
      },
      '/api/moonshot/': {
        target: 'https://api.moonshot.cn/v1/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/moonshot\//, '')
      }
    }
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo: { name?: string }) => {
          const name = assetInfo.name || ''
          if (name.endsWith('.js')) {
            return 'assets/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  publicDir: 'public'
})
