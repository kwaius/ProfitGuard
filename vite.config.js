import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import marketHandler from './api/market.js';

function localMarketApi() {
  return {
    name: 'profitguard-local-market-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        let parsedUrl;
        try {
          parsedUrl = new URL(req.url || '/', 'http://localhost');
        }
        catch {
          return next();
        }
        if (parsedUrl.pathname !== '/api/market')
          return next();
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Método não permitido.' }));
          return;
        }
        try {
          req.query = Object.fromEntries(parsedUrl.searchParams.entries());
          res.status = function status(code) {
            this.statusCode = code;
            return this;
          };
          res.json = function json(payload) {
            if (!this.headersSent)
              this.setHeader('Content-Type', 'application/json; charset=utf-8');
            this.end(JSON.stringify(payload));
            return this;
          };
          await marketHandler(req, res);
        }
        catch (error) {
          console.error('ProfitGuard local market API error:', error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Não foi possível consultar o Mercado Global.', detail: error.message }));
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localMarketApi()],
});
