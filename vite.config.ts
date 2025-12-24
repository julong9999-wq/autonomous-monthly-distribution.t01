import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { cwd, env } from 'node:process';

export default defineConfig(({ mode }) => {
  // 1. 載入 .env 檔案 (本地開發用)
  const envFile = loadEnv(mode, cwd(), '');
  
  // 2. 優先使用系統環境變數 (Vercel 線上環境用)，如果沒有才用 .env 檔案
  const apiKey = env.API_KEY || envFile.API_KEY;

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // 將抓取到的 Key 硬寫入前端程式碼中 (注意：這是客戶端渲染的常見做法，但在公開網頁上有 Key 外洩風險)
      'process.env.API_KEY': JSON.stringify(apiKey),
    }
  };
});