import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // GitHub Pages 하위 경로 배포용
  // https://moonhwan2.github.io/engtothemoon/
  base: '/engtothemoon/',

  // 빌드 결과물 폴더 (기본값이지만 명시)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },

  // 개발 서버 옵션 (배포와 무관, 안정성용)
  server: {
    port: 5173,
    open: true,
  },
})
