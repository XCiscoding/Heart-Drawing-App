import { defineConfig } from 'vite'

export default defineConfig({
  // 使用相对路径，确保在任何域名和子目录下都能正常工作
  base: './',
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: ['..']
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // 确保资源使用相对路径
    assetsDir: 'assets'
  },
  optimizeDeps: {
    exclude: ['@mediapipe/hands', '@mediapipe/camera_utils']
  }
})
