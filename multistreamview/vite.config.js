import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, rmSync } from 'fs';

// Plugin: after build, fix HTML output paths + copy manifest.json
function extensionPlugin() {
  return {
    name: 'extension-plugin',
    closeBundle() {
      // Copy manifest.json to dist root
      copyFileSync('manifest.json', 'dist/manifest.json');

      // Move HTML files from dist/src/... to their correct locations
      const moves = [
        ['dist/src/multistream/index.html', 'dist/multistream/index.html'],
        ['dist/src/popup/popup.html',       'dist/popup/popup.html'],
      ];
      for (const [from, to] of moves) {
        mkdirSync(resolve(to, '..'), { recursive: true });
        copyFileSync(from, to);
      }

      // Clean up the unwanted src/ subfolder in dist
      rmSync('dist/src', { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), extensionPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        multistream: resolve(__dirname, 'src/multistream/index.html'),
        popup:       resolve(__dirname, 'src/popup/popup.html'),
        background:  resolve(__dirname, 'src/background/service-worker.js'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background/service-worker.js';
          return '[name]/[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
