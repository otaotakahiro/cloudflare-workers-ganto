document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const passwordInput = document.getElementById('password');
  const passwordConfirmInput = document.getElementById('passwordConfirm');

  // パスワードのバリデーション
  const validatePassword = (password) => {
    const minLength = 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return password.length >= minLength && hasLetter && hasNumber;
  };

  // パスワード確認のバリデーション
  const validatePasswordConfirm = (password, confirm) => {
    return password === confirm;
  };

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const companyName = document.getElementById('companyName').value;
    const email = document.getElementById('email').value;
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;
    const industry = document.getElementById('industry').value;
    const employeeCount = document.getElementById('employeeCount').value;

    // パスワードのバリデーション
    if (!validatePassword(password)) {
      showAlert('パスワードは8文字以上で、英数字を含める必要があります。', 'error');
      return;
    }

    // パスワード確認のバリデーション
    if (!validatePasswordConfirm(password, passwordConfirm)) {
      showAlert('パスワードが一致しません。', 'error');
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        companyName,
        email,
        password,
        industry,
        employeeCount
      });

      // トークンとユーザー情報を保存
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      showAlert('登録が完了しました。', 'success');

      // プロジェクト一覧ページにリダイレクト
      setTimeout(() => {
        window.location.href = '/pages/company/list.html';
      }, 2000);
    } catch (error) {
      showAlert('登録に失敗しました。入力内容を確認してください。', 'error');
    }
  });
});
