import { Hono } from 'hono';
// import { serveStatic } from '@hono/node-server/serve-static'; // Removed for Cloudflare Workers
// import { serve } from '@hono/node-server'; // Removed for Cloudflare Workers

const app = new Hono().basePath('/api');

// --- Static file serving needs reconsideration for Cloudflare Workers ---
// Option 1: Serve from KV/R2 (Requires uploading files and modifying logic)
// Option 2: Use Cloudflare Pages for static assets and Workers for API
// Option 3: Bundle small assets into the worker script (using a bundler)

// Example: Test route accessible at /api/test
app.get('/test', (c) => {
    return c.json({ message: 'API is working!' });
});

// Example: API root accessible at /api/
app.get('/', (c) => {
    return c.text('Ganto API Root');
});

// --- serveStatic lines removed or commented out ---
// app.use('/*', serveStatic({ root: './src' }));
// app.use('/script.js', serveStatic({ path: './src/script.js' }))
// app.use('/style.css', serveStatic({ path: './src/style.css' }))
// app.get('/', serveStatic({ path: './src/index.html' }))

// --- Node.js specific server start removed ---
// const port = 3000;
// console.log(`サーバーがポート ${port} で起動しています...`);
// console.log(`URL: http://localhost:${port}`)
// serve({
//   fetch: app.fetch,
//   port: port,
// });

export default app; // Export the Hono app instance for Cloudflare Workers
