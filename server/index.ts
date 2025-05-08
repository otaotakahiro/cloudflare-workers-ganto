import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { serve } from '@hono/node-server';

const app = new Hono();

// src ディレクトリ内のファイルを静的ファイルとして配信
// ルートパス ('/') へのアクセスで src/index.html を提供する設定も兼ねる
app.use('/*', serveStatic({ root: './src' }));
app.use('/script.js', serveStatic({ path: './src/script.js' }))
app.use('/style.css', serveStatic({ path: './src/style.css' }))

// ルートへのアクセスで index.html を返す (serveStaticのオプションでカバーされることが多いが念のため)
app.get('/', serveStatic({ path: './src/index.html' }))

const port = 3000;
console.log(`サーバーがポート ${port} で起動しています...`);
console.log(`URL: http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port: port,
});
