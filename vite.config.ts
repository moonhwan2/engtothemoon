import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // GitHub Pages 하위 repo 배포 경로
  // https://moonhwan2.github.io/engtothemoon/
  base: '/engtothemoon/',

  // 빌드 결과물 설정
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },

  // 개발 서버 (배포에는 영향 없음)
  server: {
    port: 5173,
    open: true,
  },

  // 미리보기 서버 (npm run preview)
  preview: {
    port: 4173,
  },
})
