import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers'; // Cloudflare Workers用のserveStaticをインポート
// import { serve } from '@hono/node-server'; // Removed for Cloudflare Workers

// HTMLファイルを提供するためのヘルパー関数 (開発用)
// 本番環境ではKVやR2から読み込むことを推奨します。
const serveHtml = async (c: any, path: string) => {
  try {
    // wrangler dev 環境では、プロジェクトルートからの相対パスで動作することが期待される
    // _worker-src/index.ts から見て ../src/pages/login.html など
    const response = await fetch(new URL(`../${path}`, c.req.url).toString());
    if (response.ok) {
      return c.html(await response.text());
    }
    return c.text(`HTML file not found: ${path}`, 404);
  } catch (e) {
    console.error(`Error fetching HTML for ${path}:`, e);
    return c.text(`Error serving HTML file: ${path}`, 500);
  }
};

const app = new Hono();

// --- Static file serving needs reconsideration for Cloudflare Workers ---
// Option 1: Serve from KV/R2 (Requires uploading files and modifying logic)
// Option 2: Use Cloudflare Pages for static assets and Workers for API
// Option 3: Bundle small assets into the worker script (using a bundler)

// Example: Basic route for testing
app.get('/', (c) => {
  // Ideally, serve index.html here, but how depends on the chosen method above
  // For now, just return a test message
  return c.text('Hello Cloudflare Worker with Hono!');
});

// 管理者ログインページ
app.get('/admin', (c) => serveHtml(c, 'src/pages/login.html'));

// 会社登録ページ
app.get('/pages/company/register', (c) => serveHtml(c, 'src/pages/company/register.html'));

// プロジェクト一覧ページ
app.get('/pages/company/list', (c) => serveHtml(c, 'src/pages/company/list.html'));

// 新規プロジェクト作成ページ
app.get('/pages/gantt/create', (c) => serveHtml(c, 'src/pages/gantt/create.html'));

// ガントチャート表示ページ (ルートまたは /gantt など)
app.get('/', (c) => serveHtml(c, 'src/index.html'));
app.get('/gantt', (c) => serveHtml(c, 'src/index.html'));

app.get('/api/test', (c) => {
    return c.json({ message: 'API is working!' });
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

// 静的アセット (CSS, JS) の配信設定
// `hono/cloudflare-workers` の `serveStatic` は通常、
// ビルドプロセスによって生成されたマニフェストファイルを期待します。
// ローカル開発で `src` ディレクトリから直接提供する場合、
// 以下のように `manifest: {}` を指定するか、
// または `root` オプションのみで動作するかはHonoのバージョンや設定によります。
// より確実なのはCloudflare PagesとFunctionsを組み合わせるか、
// KV/R2にアセットをデプロイする方法です。

// serveStaticのオプションを調整 (manifestを空オブジェクトにしてみる)
app.get('/css/*', serveStatic({ root: './src', manifest: {} }));
app.get('/js/*', serveStatic({ root: './src', manifest: {} }));

export default app; // Export the Hono app instance for Cloudflare Workers
