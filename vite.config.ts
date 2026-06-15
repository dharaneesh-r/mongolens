import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    // Post-build: copy manifest, icons, and normalize devtools.html location
    {
      name: 'chrome-extension-manifest',
      closeBundle() {
        // Ensure icons dir exists in dist
        const iconsDir = resolve(__dirname, 'dist/icons');
        if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

        // Copy manifest
        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(__dirname, 'dist/manifest.json')
        );

        // Normalize devtools.html location: dist/src/devtools/devtools.html -> dist/devtools.html
        const devtoolsSrc = resolve(__dirname, 'dist/src/devtools/devtools.html');
        if (existsSync(devtoolsSrc)) {
          copyFileSync(devtoolsSrc, resolve(__dirname, 'dist/devtools.html'));
        }

        // Rename/copy index.html -> panel.html (the registered panel page)
        const indexHtml = resolve(__dirname, 'dist/index.html');
        if (existsSync(indexHtml)) {
          copyFileSync(indexHtml, resolve(__dirname, 'dist/panel.html'));
        }

        // Copy icons from public/icons
        const iconSizes = ['16', '48', '128'];
        iconSizes.forEach((size) => {
          const src = resolve(__dirname, `public/icons/icon${size}.png`);
          if (existsSync(src)) {
            copyFileSync(src, resolve(iconsDir, `icon${size}.png`));
          }
        });

        console.log('✓ Chrome Extension files organized in dist/');
      },
    },
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Main panel (the React app)
        panel: resolve(__dirname, 'index.html'),
        // DevTools registration page
        devtools: resolve(__dirname, 'src/devtools/devtools.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
