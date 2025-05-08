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
    console.log("Starting preprocessTasks...");
    tasks.forEach(task => {
        if (task.id === 'TASK-003') {
            console.log('Preprocessing TASK-003 (before):', JSON.parse(JSON.stringify(task)));
        }

        if (task.start === null && task.dependency) {
            const dependentTask = tasks.find(t => t.id === task.dependency);
            if (task.id === 'TASK-003') {
                console.log('  TASK-003: Found dependentTask:', dependentTask ? JSON.parse(JSON.stringify(dependentTask)) : 'Not found');
            }
            if (dependentTask && dependentTask.start) {
                task.start = dependentTask.start;
                const tempStartDate = new Date(dependentTask.start);
                task.end = new Date(tempStartDate.setDate(tempStartDate.getDate() + 1)).toISOString().split('T')[0];
                task.isTentative = true;
            } else {
                // 依存タスクがないか、依存タスクに開始日がない場合のフォールバック
                if (task.id === 'TASK-003') console.log('  TASK-003: Fallback due to missing dependentTask.start');
                const projectMinDateTask = tasks.filter(t => t.start).reduce((min, t) => new Date(t.start) < new Date(min.start) ? t : min, tasks.find(t => t.start)); // 最小開始日を持つタスクを検索
                const projectMinDate = projectMinDateTask ? new Date(projectMinDateTask.start) : new Date(); // フォールバックのフォールバックで今日
                task.start = projectMinDate.toISOString().split('T')[0];
                const tempStartDate = new Date(task.start);
                task.end = new Date(tempStartDate.setDate(tempStartDate.getDate() + 1)).toISOString().split('T')[0];
                task.isTentative = true;
            }
        } else if (task.start === null) {
            // 依存関係がなく、開始日もない場合のフォールバック
            if (task.id === 'TASK-003') console.log('  TASK-003: Fallback due to task.start is null and no dependency');
            const projectMinDateTask = tasks.filter(t => t.start).reduce((min, t) => new Date(t.start) < new Date(min.start) ? t : min, tasks.find(t => t.start));
            const projectMinDate = projectMinDateTask ? new Date(projectMinDateTask.start) : new Date();
            task.start = projectMinDate.toISOString().split('T')[0];
            const tempStartDate = new Date(task.start);
            task.end = new Date(tempStartDate.setDate(tempStartDate.getDate() + 1)).toISOString().split('T')[0];
            task.isTentative = true;
        }
        if (task.id === 'TASK-003') {
            console.log('Preprocessing TASK-003 (after):', JSON.parse(JSON.stringify(task)));
        }
    });
    console.log("Finished preprocessTasks.");
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
        // 1. Create the timeline row element for this task first
        const taskTimelineRow = document.createElement('div');
        taskTimelineRow.className = 'gantt-task-row-timeline';

        // Check if task has valid dates before proceeding to calculate bar
        if (!task.start || !task.end) {
            // Handle tasks without dates (e.g., skip rendering a bar or render differently)
            timelineBarAreaContainer.appendChild(taskTimelineRow); // Append empty row
            return; // Skip bar rendering for this task
        }

        // Convert string dates from task object to Date objects, using local timezone's midnight.
        const taskStartParts = task.start.split('-').map(Number);
        const taskEndParts = task.end.split('-').map(Number);
        const taskStartDateLocal = new Date(taskStartParts[0], taskStartParts[1] - 1, taskStartParts[2]);
        const taskEndDateLocal = new Date(taskEndParts[0], taskEndParts[1] - 1, taskEndParts[2]);
        const normalizedTimelineStartLocal = new Date(timelineStartDate.getFullYear(), timelineStartDate.getMonth(), timelineStartDate.getDate());

        // 2. Calculate offset and duration
        let offsetUnits = 0;
        let durationUnits = 0;
        switch (viewMode) {
            case 'daily':
            default:
                offsetUnits = (taskStartDateLocal.getTime() - normalizedTimelineStartLocal.getTime()) / (1000 * 60 * 60 * 24);
                durationUnits = (taskEndDateLocal.getTime() - taskStartDateLocal.getTime()) / (1000 * 60 * 60 * 24) + 1;
                break;
        }
        offsetUnits = Math.round(offsetUnits);
        durationUnits = Math.max(1, Math.round(durationUnits));

        // 3. Create the task bar element
        const taskBar = document.createElement('div');
        taskBar.className = 'gantt-task-bar';

        // 4. Set styles for the task bar
        const leftPercentage = Math.max(0, (offsetUnits / totalUnitsInView) * 100);
        const widthPercentage = Math.min((durationUnits / totalUnitsInView) * 100, 100 - leftPercentage);
        taskBar.style.left = `${leftPercentage}%`;
        taskBar.style.width = `${widthPercentage}%`;

        // Add progress bar inside the task bar
        const progressBar = document.createElement('div');
        progressBar.className = 'gantt-task-progress-bar';
        progressBar.style.width = `${task.progress}%`;
        taskBar.appendChild(progressBar);

        if (task.isTentative) {
            taskBar.classList.add('tentative');
        }

        // 5. Append the task bar to the timeline row
        taskTimelineRow.appendChild(taskBar);

        // 6. Append the completed timeline row to the main container
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
