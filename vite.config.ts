import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const localTextToImgRenderPlugin = {
      name: 'local-text-to-img-render-endpoint',
      configureServer(server: any) {
        const spaRoutes = new Set([
          '/',
          '/tools',
          '/tools/__text2imgp',
          '/request',
          '/thanks',
          '/selected-works',
          '/selected-works/bazi',
          '/selected-works/latent-27',
        ]);

        server.middlewares.use(async (request: any, response: any, next: any) => {
          const requestPath = (request.url ?? '').split('?')[0];
          if (request.method !== 'POST' || requestPath !== '/api/tools/text-to-img-post/render') {
            next();
            return;
          }

          const readRequestBody = () => new Promise<string>((resolve, reject) => {
            let rawBody = '';
            request.on('data', (chunk: Buffer) => {
              rawBody += chunk.toString();
            });
            request.on('end', () => resolve(rawBody));
            request.on('error', reject);
          });

          try {
            const body = await readRequestBody();
            const payload = body ? JSON.parse(body) : {};
            const rendererModule = await import('./server/text-to-img-post-renderer.mjs');
            const pngBytes = await rendererModule.renderTextToImagePost(payload);
            response.statusCode = 200;
            response.setHeader('Content-Type', 'image/png');
            response.setHeader('Cache-Control', 'no-store');
            response.end(Buffer.from(pngBytes));
          } catch (error: any) {
            const isValidationError = error?.name === 'TextToImageValidationError';
            response.statusCode = isValidationError ? (error?.statusCode ?? 400) : 500;
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify({
              error: isValidationError ? (error?.code ?? 'invalid_request') : 'render_failed',
              message: error?.message ?? 'Unable to render image.',
            }));
          }
        });

        server.middlewares.use((request: any, response: any, next: any) => {
          const method = request.method ?? 'GET';
          if (method !== 'GET' && method !== 'HEAD') {
            next();
            return;
          }

          const requestPath = (request.url ?? '').split('?')[0];
          if (!requestPath || path.extname(requestPath)) {
            next();
            return;
          }

          const acceptHeader = String(request.headers?.accept ?? '');
          const isHtmlNavigation =
            acceptHeader.includes('text/html') ||
            request.headers?.['sec-fetch-dest'] === 'document';

          if (
            !isHtmlNavigation ||
            requestPath.startsWith('/@') ||
            requestPath.startsWith('/__vite') ||
            requestPath.startsWith('/node_modules/')
          ) {
            next();
            return;
          }

          const normalizedPath = requestPath === '/' ? '/' : requestPath.replace(/\/+$/, '');
          const candidateRelativePath =
            normalizedPath === '/' ? 'index.html' : `${normalizedPath.slice(1)}/index.html`;
          const directHtmlRelativePath =
            normalizedPath === '/' ? 'index.html' : `${normalizedPath.slice(1)}.html`;
          const candidateAbsolutePath = path.join(__dirname, 'public', candidateRelativePath);
          const directHtmlAbsolutePath = path.join(__dirname, 'public', directHtmlRelativePath);

          if (fs.existsSync(candidateAbsolutePath) && fs.statSync(candidateAbsolutePath).isFile()) {
            request.url = `/${candidateRelativePath}`;
            next();
            return;
          }

          if (fs.existsSync(directHtmlAbsolutePath) && fs.statSync(directHtmlAbsolutePath).isFile()) {
            request.url = `/${directHtmlRelativePath}`;
            next();
            return;
          }

          if (!spaRoutes.has(normalizedPath)) {
            response.statusCode = 404;
            request.url = '/404.html';
          }

          next();
        });
      },
    };

    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), localTextToImgRenderPlugin],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
