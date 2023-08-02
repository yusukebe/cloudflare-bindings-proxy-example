import { defineConfig } from 'vite'
import devServer from './src/vite-dev-server'

const entry = 'src/index.tsx'

export default defineConfig({
  ssr: {
    noExternal: true
  },
  build: {
    rollupOptions: {
      input: entry,
      output: {
        format: 'es',
        entryFileNames: '_worker.js'
      }
    }
  },
  plugins: [
    devServer({
      entry
    })
  ]
})
