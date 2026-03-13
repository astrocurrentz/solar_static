import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const localTextToImgRenderPlugin = {
      name: 'local-text-to-img-render-endpoint',
      configureServer(server: any) {
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
