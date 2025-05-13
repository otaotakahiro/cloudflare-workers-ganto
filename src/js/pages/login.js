document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      // トークンとユーザー情報を保存
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // プロジェクト一覧ページにリダイレクト
      window.location.href = '/pages/company/list.html';
    } catch (error) {
      showAlert('ログインに失敗しました。メールアドレスとパスワードを確認してください。', 'error');
    }
  });
});
