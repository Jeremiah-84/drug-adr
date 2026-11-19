import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Built into docs/m/ so GitHub Pages serves it at /m/ next to the shared data (docs/data) and vendor libs.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: '../docs/m', emptyOutDir: true },
});
