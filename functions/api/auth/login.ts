import { Hono } from 'hono';

// 環境変数やKVバインディングの型定義 (必要に応じて拡張)
type Bindings = {
  // DB: D1Database;
  // KV_GANTO_MOCKUP: KVNamespace;
  // AUTH_SECRET: string; // JWT署名用のシークレットキー
}

const app = new Hono<{ Bindings: Bindings }>();

app.post('/', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, message: 'Email and password are required' }, 400);
    }

    console.log('Login attempt:', email); // ログ確認用

    // --- ここから仮の認証ロジック --- TODO: D1連携とパスワード検証を実装
    // 例: 特定の管理者アカウントのみ許可
    const isAdminLogin = (email === 'admin@ganto.example' && password === 'password123');
    // 例: 一般ユーザー（登録済みと仮定）
    const isUserLogin = (email.endsWith('@company.example') && password === 'password456');

    if (isAdminLogin) {
      console.log('Admin login successful');
      // TODO: JWTトークン生成
      const token = 'dummy-admin-token-' + Math.random(); // ダミートークン
      return c.json({
        success: true,
        message: 'Admin login successful',
        token: token,
        user: { id: 'admin-001', email: email, role: 'admin' }
      });
    } else if (isUserLogin) {
      console.log('User login successful');
      // TODO: JWTトークン生成 & D1からユーザー情報取得
      const token = 'dummy-user-token-' + Math.random(); // ダミートークン
      return c.json({
        success: true,
        message: 'Login successful',
        token: token,
        user: { id: 'user-' + Math.random().toString(36).substring(7), email: email, role: 'user' } // ダミーユーザー情報
      });
    } else {
      console.log('Login failed for:', email);
      return c.json({ success: false, message: 'Invalid email or password' }, 401);
    }
    // --- 仮の認証ロジックここまで ---

  } catch (error) {
    console.error('Login API error:', error);
    return c.json({ success: false, message: 'An internal error occurred' }, 500);
  }
});

// Cloudflare Pages Functionsのエクスポート形式
export const onRequestPost = (context: any) => {
  return app.fetch(context.request, context.env, context);
};
