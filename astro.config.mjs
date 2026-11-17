// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Static output: deploys to Cloudflare Pages as plain files (build: `npm run build`, output: `dist`).
export default defineConfig({
  site: 'https://htmlrunner.h190k.com',
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
