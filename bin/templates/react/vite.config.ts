import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import snice from 'snice/vite';

export default defineConfig({
  plugins: [react(), snice()],
  build: {
    sourcemap: true,
  },
});
