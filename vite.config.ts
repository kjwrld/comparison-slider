import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: "/comparison-slider",
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
});