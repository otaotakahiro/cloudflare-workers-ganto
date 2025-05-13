import { Hono } from 'hono';

// 環境変数やKVバインディングの型定義 (必要に応じて拡張)
type Bindings = {
  // DB: D1Database;
  // KV_GANTO_MOCKUP: KVNamespace;
}

const app = new Hono<{ Bindings: Bindings }>();

app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { companyName, email, password, passwordConfirm, industry, employeeCount } = body;

    // --- 基本的なバリデーション --- TODO: より詳細なバリデーションを追加
    if (!companyName || !email || !password || !passwordConfirm || !industry || !employeeCount) {
      return c.json({ success: false, message: 'All fields are required' }, 400);
    }
    if (password !== passwordConfirm) {
      return c.json({ success: false, message: 'Passwords do not match' }, 400);
    }
    if (password.length < 8) {
      return c.json({ success: false, message: 'Password must be at least 8 characters long' }, 400);
    }
    // Email format validation (basic)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ success: false, message: 'Invalid email format' }, 400);
    }
    // --- バリデーションここまで ---

    console.log('Company registration attempt:', companyName, email); // ログ確認用

    // --- ここから仮の登録ロジック --- TODO: D1連携とパスワードハッシュ化を実装
    // 例: メールアドレスの重複チェック (ダミー)
    if (email === 'existing@company.example') {
      return c.json({ success: false, message: 'Email already exists' }, 409); // 409 Conflict
    }

    // 登録成功と仮定
    console.log('Company registration successful for:', companyName);
    // TODO: パスワードをハッシュ化してからD1に保存する
    // const hashedPassword = await hashPassword(password); // 仮の関数
    // await c.env.DB.prepare("INSERT INTO companies (...) VALUES (...)").bind(...).run();
    // await c.env.DB.prepare("INSERT INTO users (...) VALUES (...)").bind(...).run();

    return c.json({ success: true, message: 'Company registered successfully' }, 201); // 201 Created
    // --- 仮の登録ロジックここまで ---

  } catch (error) {
    console.error('Registration API error:', error);
    // Handle potential JSON parsing errors
    if (error instanceof SyntaxError) {
        return c.json({ success: false, message: 'Invalid request body' }, 400);
    }
    return c.json({ success: false, message: 'An internal error occurred' }, 500);
  }
});

// Cloudflare Pages Functionsのエクスポート形式
export const onRequestPost = (context: any) => {
  return app.fetch(context.request, context.env, context);
};
