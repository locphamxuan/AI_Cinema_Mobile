const http = require('http');
const { getDefaultConfig } = require('expo/metro-config');

/**
 * Expo Web runs on a different origin (localhost:8081) than the NestJS backend, so the
 * browser blocks direct calls with CORS. In development the Metro server forwards every
 * `/api/*` request to the backend instead, the same way the Next.js web app proxies `/api`.
 */
const API_PROXY_TARGET = new URL(process.env.API_PROXY_TARGET || 'http://localhost:3001');

function proxyApiRequest(req, res) {
  const headers = { ...req.headers, host: API_PROXY_TARGET.host };
  delete headers.origin;
  delete headers.referer;

  const upstream = http.request(
    {
      protocol: API_PROXY_TARGET.protocol,
      hostname: API_PROXY_TARGET.hostname,
      port: API_PROXY_TARGET.port,
      method: req.method,
      path: req.url,
      headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    }
  );

  upstream.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'BAD_GATEWAY', message: `Backend unreachable: ${err.message}` } }));
  });

  req.pipe(upstream);
}

const config = getDefaultConfig(__dirname);
const defaultEnhanceMiddleware = config.server && config.server.enhanceMiddleware;

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const base = defaultEnhanceMiddleware ? defaultEnhanceMiddleware(middleware, server) : middleware;
    return (req, res, next) => {
      if (req.url && req.url.startsWith('/api/')) {
        proxyApiRequest(req, res);
        return;
      }
      return base(req, res, next);
    };
  },
};

module.exports = config;
