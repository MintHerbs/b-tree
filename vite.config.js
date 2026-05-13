// Vite configuration for React project
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  assetsInclude: ['**/*.json'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion-vendor': ['motion/react', 'framer-motion'],
          // Feature chunks
          'tree-feature': [
            './src/pages/tree/TreePage.jsx',
            './src/features/tree/components/TreeCanvas/TreeCanvas.jsx',
            './src/features/tree/components/TreeNode/TreeNode.jsx',
            './src/features/tree/components/TreeEdge/TreeEdge.jsx',
            './src/lib/BPlusTree.js',
            './src/lib/treeLayout.js',
            './src/hooks/useBPlusTree.js'
          ],
          'erd-feature': [
            './src/pages/erd/ERDPage.jsx',
            './src/features/erd/components/ERDCanvas/ERDCanvas.jsx',
            './src/features/erd/components/ERDStep1/ERDStep1.jsx',
            './src/features/erd/components/ERDStep2/ERDStep2.jsx',
            './src/features/erd/components/ERDStep3/ERDStep3.jsx',
            './src/lib/erdLayout.js',
            './src/lib/erdParser.js',
            './src/lib/erdPromptBuilder.js'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
