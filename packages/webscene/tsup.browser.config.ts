import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/browser.ts'],
  format: ['iife'],
  globalName: 'WebScene',
  outDir: 'dist/browser',
  dts: false,
  sourcemap: true,
  clean: false,
  minify: false,
  target: 'es2020'
});
