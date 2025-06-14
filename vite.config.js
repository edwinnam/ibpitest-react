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
  build: {
    // Enable source maps for production debugging
    sourcemap: true,
    
    // Rollup options for better code splitting
    rollupOptions: {
      output: {
        // Manual chunk configuration
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['@fortawesome/fontawesome-free'],
          
          // Feature chunks
          'auth': [
            './src/modules/auth/AuthContext.jsx',
            './src/pages/auth/LoginPage.jsx',
            './src/pages/auth/ResetPasswordPage.jsx',
            './src/pages/auth/UpdatePasswordPage.jsx'
          ],
          'test-management': [
            './src/pages/test/TestManagementPage.jsx',
            './src/pages/test/GroupTestPage.jsx',
            './src/pages/test/components/CodeGenerationTab.jsx',
            './src/pages/test/components/CodeWaitingTab.jsx',
            './src/pages/test/components/CodeCompleteTab.jsx'
          ],
          'reports': [
            './src/components/reports/IBPIReport.jsx',
            './src/components/reports/ProfileDiagram.jsx',
            './src/components/reports/ScoreTable.jsx',
            './src/components/reports/InterpretationSection.jsx',
            './src/pages/reports/ReportViewPage.jsx'
          ],
          'customer-test': [
            './src/pages/customer/CustomerLoginPage.jsx',
            './src/pages/customer/TestPage.jsx',
            './src/pages/customer/TestIntroPage.jsx',
            './src/pages/customer/TestCompletePage.jsx'
          ]
        },
        
        // Chunk file naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : null
          return `assets/js/${chunkInfo.name}-[hash].js`
        },
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.').at(1)
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img'
          }
          return `assets/${extType}/[name]-[hash][extname]`
        }
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    
    // Minification options
    minify: 'esbuild',
    target: 'es2018'
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js']
  }
}) 
