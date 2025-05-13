document.addEventListener('DOMContentLoaded', () => {
  // 認証チェック
  auth.requireAuth();

  const projectList = document.getElementById('projectList');
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const sortBy = document.getElementById('sortBy');
  const pagination = document.getElementById('pagination');

  let currentPage = 1;
  const itemsPerPage = 9;
  let projects = [];
  let filteredProjects = [];

  // プロジェクト一覧の取得
  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      projects = response.projects;
      applyFilters();
    } catch (error) {
      showAlert('プロジェクトの取得に失敗しました。', 'error');
    }
  };

  // フィルターの適用
  const applyFilters = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;
    const sortValue = sortBy.value;

    filteredProjects = projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm);
      const matchesStatus = !statusValue || project.status === statusValue;
      return matchesSearch && matchesStatus;
    });

    // ソート
    filteredProjects.sort((a, b) => {
      switch (sortValue) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'updated_at':
          return new Date(b.updated_at) - new Date(a.updated_at);
        default: // created_at
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    renderProjects();
    renderPagination();
  };

  // プロジェクトカードの生成
  const createProjectCard = (project) => {
    const statusClass = `status-${project.status.replace('_', '-')}`;
    const progress = project.progress || 0;

    return `
      <div class="project-card">
        <h3>${project.name}</h3>
        <div class="project-meta">
          <span>作成日: ${new Date(project.created_at).toLocaleDateString()}</span>
          <span class="project-status ${statusClass}">${getStatusText(project.status)}</span>
        </div>
        <div class="project-progress">
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width: ${progress}%"></div>
          </div>
          <div class="progress-text">${progress}% 完了</div>
        </div>
      </div>
    `;
  };

  // ステータスの日本語表示
  const getStatusText = (status) => {
    const statusMap = {
      'planning': '計画中',
      'in_progress': '進行中',
      'completed': '完了',
      'on_hold': '保留中'
    };
    return statusMap[status] || status;
  };

  // プロジェクト一覧の表示
  const renderProjects = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const projectsToShow = filteredProjects.slice(start, end);

    projectList.innerHTML = projectsToShow.length
      ? projectsToShow.map(createProjectCard).join('')
      : '<p class="no-projects">プロジェクトが見つかりませんでした。</p>';
  };

  // ページネーションの表示
  const renderPagination = () => {
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

    let paginationHTML = '';

    // 前へボタン
    paginationHTML += `
      <button
        onclick="changePage(${currentPage - 1})"
        ${currentPage === 1 ? 'disabled' : ''}
      >
        前へ
      </button>
    `;

    // ページ番号
    for (let i = 1; i <= totalPages; i++) {
      paginationHTML += `
        <button
          onclick="changePage(${i})"
          class="${i === currentPage ? 'active' : ''}"
        >
          ${i}
        </button>
      `;
    }

    // 次へボタン
    paginationHTML += `
      <button
        onclick="changePage(${currentPage + 1})"
        ${currentPage === totalPages ? 'disabled' : ''}
      >
        次へ
      </button>
    `;

    pagination.innerHTML = paginationHTML;
  };

  // ページ変更
  window.changePage = (page) => {
    currentPage = page;
    renderProjects();
    renderPagination();
  };

  // イベントリスナーの設定
  searchInput.addEventListener('input', () => {
    currentPage = 1;
    applyFilters();
  });

  statusFilter.addEventListener('change', () => {
    currentPage = 1;
    applyFilters();
  });

  sortBy.addEventListener('change', applyFilters);

  // 初期データの取得
  fetchProjects();
});
