import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'preview.html',  dest: '.' },
        { src: 'background.js', dest: '.' },
      ],
    }),
  ],
  build: {
    outDir: 'dist',
    cssCodeSplit: false,
    rollupOptions: {
      input: 'index.html',
    },
  },
});
