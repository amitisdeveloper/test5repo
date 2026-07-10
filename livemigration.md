# Live Subdomain Migration Guide

This project can run many frontend subdomains against the same live backend pattern.

## Current Working Pattern

- Frontend is built as static files with Vite.
- Only the `dist` folder is uploaded to the subdomain.
- The frontend calls API routes using relative paths such as:

```txt
/api/games
/api/games/latest-result
/api/auth/login
/api/results
```

- Because API paths are relative, each deployed frontend calls APIs on its own host first.

Example:

```txt
Frontend URL:
https://result2.555xch.pro

Browser API call:
https://result2.555xch.pro/api/games
```

- The web server then proxies `/api/*` to the live Node backend.

Live backend:

```txt
https://result.555xch.pro
```

Backend API example:

```txt
https://result.555xch.pro/api/games
```

## Apache Subdomain Setup

For any new Apache-hosted subdomain, upload the built `dist` folder to that subdomain's document root.

The subdomain must proxy API traffic to the Node backend:

```apache
ProxyPass /api http://localhost:3001/api
ProxyPassReverse /api http://localhost:3001/api
```

If WebSocket/SSE support is needed and the backend uses `/ws`, also add:

```apache
ProxyPass /ws ws://localhost:3001/ws
ProxyPassReverse /ws ws://localhost:3001/ws
```

The `dist/.htaccess` file should keep API paths out of the React SPA fallback:

```apache
RewriteEngine On

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !^/ws/
RewriteRule . /index.html [L]
```

## Netlify Setup

Netlify should host the frontend only. The backend remains at:

```txt
https://result.555xch.pro
```

Use these Netlify build settings:

```txt
Base directory: leave empty
Build command: npm run build
Publish directory: dist
```

Use this `netlify.toml` pattern:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"

[[redirects]]
  from = "/api/*"
  to = "https://result.555xch.pro/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

The `/api/*` redirect is the Netlify equivalent of the Apache `ProxyPass /api` rule.

## Environment Variables

For this branch, many API calls use relative `/api/...` paths directly, so the proxy rule is the most important part.

Optional Netlify frontend variable:

```env
VITE_API_URL=https://result.555xch.pro
```

Do not put backend secrets in Netlify frontend environment variables:

```env
MONGODB_URI
JWT_SECRET
PORT
```

Those belong only on the backend server.

## Backend CORS

If the frontend calls the backend directly with an absolute URL, the backend must allow the frontend origin.

For each new subdomain, add or allow the frontend URL in backend CORS:

```env
FRONTEND_URL=https://result2.555xch.pro
```

For multiple subdomains, the backend should support an allowlist, for example:

```txt
https://result.555xch.pro
https://result2.555xch.pro
https://result3.555xch.pro
```

If all frontend calls go through same-origin `/api` proxying, CORS issues are usually avoided because the browser sees the request as same-origin.

## Build And Upload Flow

1. Build the frontend:

```bash
npm run build
```

2. Upload only the contents of `dist` to the subdomain document root.

3. Confirm the frontend opens:

```txt
https://new-subdomain.555xch.pro
```

4. Confirm API calls work:

```txt
https://new-subdomain.555xch.pro/api/games
```

Expected result: HTTP `200 OK` with a `games` JSON response.

## Checklist For Each New Subdomain

- DNS points the subdomain to the server.
- SSL certificate is active for the subdomain.
- `dist` files are uploaded to the correct document root.
- SPA fallback rewrites non-file routes to `index.html`.
- `/api/*` is excluded from SPA fallback.
- `/api/*` proxies to the live backend.
- Admin login and public result pages are tested.
- Browser Network tab shows `/api/...` requests returning `200 OK`.

## Key Rule

For this migration pattern, keep frontend API calls relative:

```js
fetch('/api/games')
```

Then configure each hosting platform to forward `/api/*` to the live backend.
