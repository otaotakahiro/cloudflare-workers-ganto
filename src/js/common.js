// 認証状態の管理
const auth = {
  // ログイン状態の確認
  isLoggedIn() {
    return localStorage.getItem('token') !== null;
  },

  // ログイン状態に応じてUIを更新
  updateUI() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    if (this.isLoggedIn()) {
      // ログイン済みの場合
      nav.innerHTML = `
        <a href="/pages/company/list.html" class="nav-link">プロジェクト一覧</a>
        <a href="/pages/gantt/create.html" class="nav-link">新規作成</a>
        <a href="#" class="nav-link" id="logoutBtn">ログアウト</a>
      `;
    } else {
      // 未ログインの場合
      nav.innerHTML = `
        <a href="/pages/login.html" class="nav-link">ログイン</a>
        <a href="/pages/company/register.html" class="nav-link">会社登録</a>
      `;
    }

    // ログアウトボタンのイベントリスナーを設定
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  },

  // ログアウト処理
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
  },

  // 認証が必要なページへのアクセス制御
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/pages/login.html';
    }
  }
};

// ページ読み込み時に認証状態を確認
document.addEventListener('DOMContentLoaded', () => {
  auth.updateUI();
});

// アラート表示用の関数
const showAlert = (message, type = 'success') => {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;

  const container = document.querySelector('.container');
  container.insertBefore(alertDiv, container.firstChild);

  // 3秒後にアラートを消す
  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
};

// APIリクエスト用の関数
const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  },

  // GETリクエスト
  async get(endpoint) {
    return this.request(endpoint);
  },

  // POSTリクエスト
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // PUTリクエスト
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // DELETEリクエスト
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
};
