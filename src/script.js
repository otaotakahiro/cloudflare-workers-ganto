document.addEventListener('DOMContentLoaded', initializeGantt);

let allTasks = [];
let currentViewMode = 'daily'; // 'daily', 'weekly', 'monthly'

// Updated DOM Element Selectors
let taskInfoAreaContainer;
let timelineHeaderContainer;
let timelineBarAreaContainer;
let memoModal;
let memoTextarea;
let memoSaveBtn;
let memoDeleteBtn;
let memoCancelBtn;

let currentlyEditingTaskId = null; // 現在編集中のタスクIDを保持

async function initializeGantt() {
    // Initialize container references after DOM is loaded
    taskInfoAreaContainer = document.getElementById('gantt-task-info-area');
    timelineHeaderContainer = document.querySelector('.gantt-timeline-header'); // Class selector for this one
    timelineBarAreaContainer = document.getElementById('gantt-timeline-bar-area');
    memoModal = document.getElementById('memo-edit-modal');
    memoTextarea = document.getElementById('memo-textarea');
    memoSaveBtn = document.getElementById('memo-save-btn');
    memoDeleteBtn = document.getElementById('memo-delete-btn');
    memoCancelBtn = document.getElementById('memo-cancel-btn');

    // Add event listeners for modal buttons
    memoSaveBtn.addEventListener('click', handleSaveMemo);
    memoDeleteBtn.addEventListener('click', handleDeleteMemo);
    memoCancelBtn.addEventListener('click', closeMemoModal);

    try {
        const response = await fetch('project_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allTasks = await response.json();
        preprocessTasks(allTasks);
    } catch (error) {
        console.error("Could not load project data:", error);
        if (taskInfoAreaContainer) { // Check one of the containers
            taskInfoAreaContainer.innerHTML =
                '<p style="color: red; text-align: center;">プロジェクトデータの読み込みに失敗しました。</p>';
        }
        return;
    }

    if (!taskInfoAreaContainer || !timelineHeaderContainer || !timelineBarAreaContainer) {
        console.error("Essential GANTT containers not found!");
        const mainContainer = document.querySelector('.gantt-main-container');
        if (mainContainer) mainContainer.innerHTML = '<p style="color:red; text-align:center;">レイアウトの初期化に失敗しました。</p>';
        return;
    }

    setupViewSwitcher();
    renderGanttChart();
}

function preprocessTasks(tasks) {
    tasks.forEach(task => {
        if (task.start === null && task.dependency) {
            const dependentTask = tasks.find(t => t.id === task.dependency);
            if (dependentTask && dependentTask.start) {
                task.start = dependentTask.start;
                const tempStartDate = new Date(dependentTask.start);
                task.end = new Date(tempStartDate.setDate(tempStartDate.getDate() + 1)).toISOString().split('T')[0];
                task.isTentative = true;
            } else {
                const projectMinDate = new Date(Math.min(...tasks.filter(t => t.start).map(t => new Date(t.start))));
                task.start = projectMinDate.toISOString().split('T')[0];
                const tempStartDate = new Date(task.start);
                task.end = new Date(tempStartDate.setDate(tempStartDate.getDate() + 1)).toISOString().split('T')[0];
                task.isTentative = true;
            }
        } else if (task.start === null) {
            const projectMinDate = new Date(Math.min(...tasks.filter(t => t.start).map(t => new Date(t.start))));
            task.start = projectMinDate.toISOString().split('T')[0];
            const tempStartDate = new Date(task.start);
            task.end = new Date(tempStartDate.setDate(tempStartDate.getDate() + 1)).toISOString().split('T')[0];
            task.isTentative = true;
        }
    });
}

function setupViewSwitcher() {
    const dailyButton = document.getElementById('view-daily');
    const weeklyButton = document.getElementById('view-weekly');
    const monthlyButton = document.getElementById('view-monthly');

    if (dailyButton) dailyButton.classList.add('active');

    dailyButton?.addEventListener('click', () => {
        currentViewMode = 'daily';
        updateActiveButton(dailyButton);
        renderGanttChart();
    });
    weeklyButton?.addEventListener('click', () => alert('週表示は現在開発中です。'));
    monthlyButton?.addEventListener('click', () => alert('月表示は現在開発中です。'));
}

function updateActiveButton(activeButton) {
    document.querySelectorAll('.view-switcher button').forEach(button => button.classList.remove('active'));
    activeButton?.classList.add('active');
}

function renderGanttChart() {
    if (!allTasks || allTasks.length === 0) {
        taskInfoAreaContainer.innerHTML = '<p style="text-align: center;">表示するタスクがありません。</p>';
        return;
    }

    // Clear previous content
    taskInfoAreaContainer.innerHTML = '';
    timelineHeaderContainer.innerHTML = '';
    timelineBarAreaContainer.innerHTML = '';

    const validTasks = allTasks.filter(task => task.start && task.end);
    if (validTasks.length === 0) {
        taskInfoAreaContainer.innerHTML = '<p style="text-align: center;">表示できる有効なタスクがありません。</p>';
        return;
    }

    const { displayStartDate, displayEndDate, totalUnitsInView } = getDisplayParameters(validTasks, currentViewMode);

    renderTimelineHeader(displayStartDate, totalUnitsInView, currentViewMode);
    renderTaskInfoRows(validTasks);
    renderTaskTimelineRows(validTasks, displayStartDate, totalUnitsInView, currentViewMode);
}

function getDisplayParameters(tasks, viewMode) {
    const projectStartDate = new Date(Math.min(...tasks.map(task => new Date(task.start))));
    const projectEndDate = new Date(Math.max(...tasks.map(task => new Date(task.end))));

    let displayStartDate = new Date(projectStartDate);
    let displayEndDate = new Date(projectEndDate);
    let totalUnitsInView;

    switch (viewMode) {
        case 'daily':
        default:
            displayStartDate.setDate(projectStartDate.getDate() - 3);
            displayEndDate.setDate(projectEndDate.getDate() + 7);
            totalUnitsInView = Math.ceil((displayEndDate - displayStartDate) / (1000 * 60 * 60 * 24));
            break;
    }
    return { displayStartDate, displayEndDate, totalUnitsInView };
}

function renderTimelineHeader(startDate, totalUnits, viewMode) {
    if (viewMode === 'daily') {
        let previousMonth = -1; // 前のセルの月を記憶 (初期値はありえない月)
        for (let i = 0; i < totalUnits; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dayCell = document.createElement('div');
            dayCell.className = 'timeline-day-cell';

            // 常に「月/日」形式で表示
            dayCell.textContent = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;

            // 月の変わり目、または最初のセルであれば太字にする
            if (currentDate.getMonth() !== previousMonth || i === 0) {
                dayCell.style.fontWeight = 'bold';
            }
            previousMonth = currentDate.getMonth();

            timelineHeaderContainer.appendChild(dayCell);
        }
    }
}

function renderTaskInfoRows(tasks) {
    tasks.forEach(task => {
        const taskInfoRow = document.createElement('div');
        taskInfoRow.className = 'gantt-task-row-info';

        const taskNameCell = document.createElement('div');
        taskNameCell.className = 'gantt-task-name-cell';
        taskNameCell.textContent = task.name;
        taskNameCell.title = task.name; // Initially show task name on hover
        taskNameCell.dataset.taskId = task.id; // taskIdをdata属性として保持
        taskNameCell.addEventListener('click', () => openMemoModal(task.id)); // タスク名クリックでメモ編集
        taskInfoRow.appendChild(taskNameCell);

        const taskAssigneeCell = document.createElement('div');
        taskAssigneeCell.className = 'gantt-task-assignee-cell';
        taskAssigneeCell.textContent = task.assignee || '-';
        taskAssigneeCell.title = task.assignee || '-';
        taskInfoRow.appendChild(taskAssigneeCell);

        // 開始日セルを追加
        const taskStartDateCell = document.createElement('div');
        taskStartDateCell.className = 'gantt-task-start-date-cell';
        taskStartDateCell.textContent = task.start ? formatDateToMMDD(task.start) : '-';
        taskInfoRow.appendChild(taskStartDateCell);

        // 終了日セルを追加
        const taskEndDateCell = document.createElement('div');
        taskEndDateCell.className = 'gantt-task-end-date-cell';
        taskEndDateCell.textContent = task.end ? formatDateToMMDD(task.end) : '-';
        taskInfoRow.appendChild(taskEndDateCell);

        taskInfoAreaContainer.appendChild(taskInfoRow);
    });
}

function renderTaskTimelineRows(tasks, timelineStartDate, totalUnitsInView, viewMode) {
    tasks.forEach(task => {
        const taskTimelineRow = document.createElement('div');
        taskTimelineRow.className = 'gantt-task-row-timeline'; // New class from CSS

        const taskStartDate = new Date(task.start);
        const taskEndDate = new Date(task.end);
        let offsetUnits = 0;
        let durationUnits = 0;

        // Ensure dates are compared at the start of the day (midnight)
        const normalizedTimelineStart = new Date(timelineStartDate.getFullYear(), timelineStartDate.getMonth(), timelineStartDate.getDate());
        const normalizedTaskStart = new Date(taskStartDate.getFullYear(), taskStartDate.getMonth(), taskStartDate.getDate());
        const normalizedTaskEnd = new Date(taskEndDate.getFullYear(), taskEndDate.getMonth(), taskEndDate.getDate());

        switch (viewMode) {
            case 'daily':
            default:
                offsetUnits = Math.round((normalizedTaskStart - normalizedTimelineStart) / (1000 * 60 * 60 * 24));
                // Duration: include the end date. If start and end are same, duration is 1 day.
                durationUnits = Math.round((normalizedTaskEnd - normalizedTaskStart) / (1000 * 60 * 60 * 24)) + 1;
                break;
        }
        // Ensure duration is at least 1 if start and end are on the same day or if end is before start (data error)
        if (durationUnits <= 0) durationUnits = 1;

        const taskBar = document.createElement('div');
        taskBar.className = 'gantt-task-bar';
        const leftPercentage = Math.max(0, (offsetUnits / totalUnitsInView) * 100);
        const widthPercentage = Math.min((durationUnits / totalUnitsInView) * 100, 100 - leftPercentage);

        taskBar.style.left = `${leftPercentage}%`;
        taskBar.style.width = `${widthPercentage}%`;

        const progressBar = document.createElement('div');
        progressBar.className = 'gantt-task-progress-bar';
        progressBar.style.width = `${task.progress}%`;
        taskBar.appendChild(progressBar);

        if (task.isTentative) {
            taskBar.classList.add('tentative');
        }

        // The task bar is appended directly to the row, which acts as its container
        taskTimelineRow.appendChild(taskBar);
        timelineBarAreaContainer.appendChild(taskTimelineRow);
    });
}

// Memo Modal Functions
function openMemoModal(taskId) {
    currentlyEditingTaskId = taskId;
    const task = allTasks.find(t => t.id === taskId);
    memoTextarea.value = task?.memo || '';
    memoModal.style.display = 'flex'; // CSSでflexを使って中央揃えしているため
}

function closeMemoModal() {
    memoModal.style.display = 'none';
    currentlyEditingTaskId = null;
    memoTextarea.value = ''; // テキストエリアをクリア
}

function handleSaveMemo() {
    if (!currentlyEditingTaskId) return;

    const task = allTasks.find(t => t.id === currentlyEditingTaskId);
    if (task) {
        task.memo = memoTextarea.value.trim();
        // タスク名セルのtitleを更新してメモの存在を示す
        const taskNameCell = taskInfoAreaContainer.querySelector(`.gantt-task-name-cell[data-task-id="${currentlyEditingTaskId}"]`);
        if (taskNameCell) {
            taskNameCell.title = task.memo ? `メモ: ${task.memo.substring(0,30)}...` : task.name;
        }
        console.log('Memo saved for task:', currentlyEditingTaskId, 'New memo:', task.memo);
    }
    closeMemoModal();
}

function handleDeleteMemo() {
    if (!currentlyEditingTaskId) return;

    if (confirm('本当にこのメモを削除しますか？')) {
        const task = allTasks.find(t => t.id === currentlyEditingTaskId);
        if (task) {
            task.memo = ''; // メモを空にする
            // タスク名セルのtitleを元に戻す
            const taskNameCell = taskInfoAreaContainer.querySelector(`.gantt-task-name-cell[data-task-id="${currentlyEditingTaskId}"]`);
            if (taskNameCell) {
                taskNameCell.title = task.name;
            }
            console.log('Memo deleted for task:', currentlyEditingTaskId);
        }
        closeMemoModal();
    }
}

// Helper function to format date to MM/DD
function formatDateToMMDD(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    // JSTで表示するため、UTCの日付文字列をJSTの日付オブジェクトとして解釈し直さないように注意
    // `project_data.json` の日付が `YYYY-MM-DD` であれば、そのまま分割して月日を取得するのが安全
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`;
    }
    return dateString; // フォーマットできない場合は元の文字列を返す
}

// Helper function to get week number (example)
/*
Date.prototype.getWeek = function() {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  var week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}
*/
