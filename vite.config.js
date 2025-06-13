import { defineConfig } from 'vite'  
import react from '@vitejs/plugin-react'  
  
// https://vite.dev/config/  
export default defineConfig({  
  plugins: [react()],  
  server: {  
    port: 3000,  
    strictPort: false,  
    host: 'localhost'  
  },  
  test: {  
    globals: true,  
    environment: 'jsdom',  
    setupFiles: './src/test/setup.js',  
    css: true,  
  },  
  resolve: {  
    alias: {  
      '@': '/src',  
    },  
  },  
}) 
