const DEFAULT_FRONTEND_ORIGINS = [
  'http://localhost:5173',
  'https://satta-bazaar.com',
  'https://www.satta-bazaar.com',
  'https://satta-bazaar.online',
  'https://www.satta-bazaar.online',
  'https://satta-bazaar.org',
  'https://www.satta-bazaar.org'
];

const configuredOrigins = [
  process.env.FRONTEND_URLS,
  process.env.FRONTEND_URL
]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...DEFAULT_FRONTEND_ORIGINS,
  ...configuredOrigins
]);

module.exports = {
  credentials: true,
  origin(origin, callback) {
    // Requests proxied by Apache and server-to-server requests may not include
    // an Origin header. Browser cross-origin requests must be explicitly listed.
    callback(null, !origin || allowedOrigins.has(origin));
  }
};
