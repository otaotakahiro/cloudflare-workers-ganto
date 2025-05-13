document.addEventListener('DOMContentLoaded', () => {
  const ganttGenerateForm = document.getElementById('ganttGenerateForm');
  const generateBtn = document.getElementById('generateBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessageDiv = document.getElementById('errorMessage');

  // 日付の初期設定 (今日から1ヶ月後)
  const today = new Date();
  const startDateInput = document.getElementById('projectStartDate');
  const endDateInput = document.getElementById('projectEndDate');
  startDateInput.valueAsDate = today;
  const oneMonthLater = new Date(today);
  oneMonthLater.setMonth(today.getMonth() + 1);
  endDateInput.valueAsDate = oneMonthLater;

  if (ganttGenerateForm) {
    ganttGenerateForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorMessageDiv.style.display = 'none';
      errorMessageDiv.textContent = '';
      loadingIndicator.style.display = 'block';
      generateBtn.disabled = true;

      const formData = {
        title: document.getElementById('projectTitle').value,
        summary: document.getElementById('meetingSummary').value,
        startDate: startDateInput.value,
        endDate: endDateInput.value,
      };

      // 日付のバリデーション
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        showError('終了日は開始日より後の日付を指定してください。');
        loadingIndicator.style.display = 'none';
        generateBtn.disabled = false;
        return;
      }

      try {
        const response = await fetch('/api/gantt/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // 成功した場合、生成されたタスクデータをlocalStorageに保存してリダイレクト
          // 注意: localStorageの容量制限 (通常5MB程度) に注意。大規模データには不向き。
          localStorage.setItem('generatedGanttData', JSON.stringify(result.tasks));
          localStorage.setItem('generatedProjectInfo', JSON.stringify({ title: formData.title }));
          window.location.href = '/'; // ガントチャート表示ページへ
        } else {
          showError(result.message || 'ガントチャートの生成に失敗しました。');
        }
      } catch (error) {
        console.error('Error generating Gantt chart:', error);
        showError('ガントチャートの生成中にエラーが発生しました。ネットワーク接続を確認してください。');
      } finally {
        loadingIndicator.style.display = 'none';
        generateBtn.disabled = false;
      }
    });
  }

  function showError(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
  }
});
