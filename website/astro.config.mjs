import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://solarstatic.xyz',
  output: 'static',
  adapter: vercel({
    includeFiles: ['node_modules/@fontpkg/unifont/unifont-15.0.01.ttf'],
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
