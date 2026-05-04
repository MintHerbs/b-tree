// Vite configuration for React project
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
            './src/pages/TreePage.jsx',
            './src/components/TreeCanvas/TreeCanvas.jsx',
            './src/components/TreeNode/TreeNode.jsx',
            './src/components/TreeEdge/TreeEdge.jsx',
            './src/lib/BPlusTree.js',
            './src/lib/treeLayout.js',
            './src/hooks/useBPlusTree.js'
          ],
          'erd-feature': [
            './src/pages/ERDPage.jsx',
            './src/components/ERDCanvas/ERDCanvas.jsx',
            './src/components/ERDStep1/ERDStep1.jsx',
            './src/components/ERDStep2/ERDStep2.jsx',
            './src/components/ERDStep3/ERDStep3.jsx',
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
