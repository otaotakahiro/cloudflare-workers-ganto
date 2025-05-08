document.addEventListener('DOMContentLoaded', initializeGantt);

let allTasks = [];
let currentViewMode = 'daily'; // 'daily', 'weekly', 'monthly'

// Updated DOM Element Selectors
let taskInfoAreaContainer;
let timelineHeaderContainer;
let timelineBarAreaContainer;

async function initializeGantt() {
    // Initialize container references after DOM is loaded
    taskInfoAreaContainer = document.getElementById('gantt-task-info-area');
    timelineHeaderContainer = document.querySelector('.gantt-timeline-header'); // Class selector for this one
    timelineBarAreaContainer = document.getElementById('gantt-timeline-bar-area');

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
        for (let i = 0; i < totalUnits; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dayCell = document.createElement('div');
            dayCell.className = 'timeline-day-cell';
            dayCell.textContent = `${currentDate.getDate()}`;
            if (currentDate.getDate() === 1 || i === 0) {
                dayCell.innerHTML = `<div>${currentDate.getMonth() + 1}/${currentDate.getDate()}</div>`;
                dayCell.style.fontWeight = 'bold';
            }
            timelineHeaderContainer.appendChild(dayCell);
        }
    }
}

function renderTaskInfoRows(tasks) {
    tasks.forEach(task => {
        const taskInfoRow = document.createElement('div');
        taskInfoRow.className = 'gantt-task-row-info'; // New class from CSS

        const taskNameCell = document.createElement('div');
        taskNameCell.className = 'gantt-task-name-cell'; // New class from CSS
        taskNameCell.textContent = task.name;
        taskNameCell.title = task.name;
        taskInfoRow.appendChild(taskNameCell);

        const taskAssigneeCell = document.createElement('div');
        taskAssigneeCell.className = 'gantt-task-assignee-cell'; // New class from CSS
        taskAssigneeCell.textContent = task.assignee || '-';
        taskAssigneeCell.title = task.assignee || '-';
        taskInfoRow.appendChild(taskAssigneeCell);

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

        switch (viewMode) {
            case 'daily':
            default:
                offsetUnits = Math.ceil((taskStartDate - timelineStartDate) / (1000 * 60 * 60 * 24));
                durationUnits = Math.ceil((taskEndDate - taskStartDate) / (1000 * 60 * 60 * 24)) + 1;
                break;
        }
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
