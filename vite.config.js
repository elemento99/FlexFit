import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/FlexFit/" // Aquí asegúrate de usar "FlexFit" con las mismas mayúsculas/minúsculas que el nombre del repo
})
