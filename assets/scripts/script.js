// === DOM элементы ===
const addBtn            = document.getElementById("addTaskBtn");
const taskInput         = document.getElementById("taskInput");
const dueDateInput      = document.getElementById("dueDateInput");
const prioritySelect    = document.getElementById("prioritySelect");
const tasksContainer    = document.getElementById("tasksContainer");
const calendarGrid      = document.getElementById("calendarGrid");
const currentMonthYear  = document.getElementById("currentMonthYear");
const prevMonthBtn      = document.getElementById("prevMonthBtn");
const nextMonthBtn      = document.getElementById("nextMonthBtn");
const selectedDateInfo  = document.getElementById("selectedDateInfo");
const themeToggle       = document.getElementById("themeToggle");

// === Глобальные переменные ===
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentDisplayDate = new Date();
let selectedDate = new Date().toISOString().slice(0, 10);
let filterByDate = null;

// === Форматирование даты без смещения ===
function formatLocalDate(date) {
    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day   = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
}

function formatShortDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}`;
}

// === Переключатель темы ===
function updateToggleA11y(theme) {
    if (!themeToggle) return;
    themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    themeToggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'
    );
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}

    // Меняем цвет адресной строки в мобильных браузерах
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#12121f' : '#f9f7fc');

    updateToggleA11y(theme);
}

function initTheme() {
    let theme;
    try { theme = localStorage.getItem('theme'); } catch (e) {}
    if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(theme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';

            // Включаем плавный переход на время смены темы
            document.documentElement.classList.add('theme-transition');
            applyTheme(next);

            window.setTimeout(() => {
                document.documentElement.classList.remove('theme-transition');
            }, 500);
        });
    }
}

// === Инициализация ===
(function init() {
    initTheme();

    const today = new Date();
    const todayStr = formatLocalDate(today);
    dueDateInput.value = todayStr;
    selectedDate = todayStr;

    tasks = tasks.map(task => ({
        id: task.id || Date.now(),
        text: task.text,
        done: task.done || false,
        dueDate: task.dueDate || todayStr,
        priority: task.priority || 'medium'
    }));
    saveTasks();

    renderCalendar();
    renderTasks();
})();

// === Уведомления ===
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// === Сохранение ===
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// === Рендер задач ===
function renderTasks() {
    tasksContainer.innerHTML = '';
    let filteredTasks = tasks;

    if (filterByDate) {
        filteredTasks = tasks.filter(t => t.dueDate === filterByDate);
        selectedDateInfo.textContent = `Задачи на ${formatDate(filterByDate)}`;
    } else {
        selectedDateInfo.textContent = 'Все задачи';
    }

    if (filteredTasks.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = 'Нет задач';
        emptyMsg.style.color = 'var(--text-muted)';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.padding = '1rem';
        tasksContainer.appendChild(emptyMsg);
        return;
    }

    filteredTasks.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        if (order[a.priority] !== order[b.priority]) {
            return order[a.priority] - order[b.priority];
        }
        return a.dueDate.localeCompare(b.dueDate);
    });

    filteredTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.classList.add(`priority-${task.priority}`);
        taskItem.dataset.id = task.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.done;
        checkbox.addEventListener('change', (e) => {
            task.done = e.target.checked;
            saveTasks();
            renderTasks();
            renderCalendar();
        });

        const contentDiv = document.createElement('div');
        contentDiv.className = 'task-content';

        const textP = document.createElement('p');
        textP.className = 'task-text';
        textP.textContent = task.text;
        if (task.done) textP.style.textDecoration = 'line-through';

        const metaDiv = document.createElement('div');
        metaDiv.className = 'task-meta';

        const dateSpan = document.createElement('span');
        dateSpan.textContent = `${formatShortDate(task.dueDate)}`;

        const prioritySpan = document.createElement('span');
        prioritySpan.className = `priority-badge priority-${task.priority}`;
        prioritySpan.textContent = {
            low: 'Низкий',
            medium: 'Средний',
            high: 'Высокий'
        }[task.priority] || '';

        metaDiv.appendChild(dateSpan);
        metaDiv.appendChild(prioritySpan);
        contentDiv.appendChild(textP);
        contentDiv.appendChild(metaDiv);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.addEventListener('click', () => {
            tasks = tasks.filter(t => t.id !== task.id);
            saveTasks();
            renderTasks();
            renderCalendar();
            showNotification('Задача удалена', 'success');
        });

        taskItem.appendChild(checkbox);
        taskItem.appendChild(contentDiv);
        taskItem.appendChild(deleteBtn);
        tasksContainer.appendChild(taskItem);
    });
}

// === Рендер календаря ===
function renderCalendar() {
    const year  = currentDisplayDate.getFullYear();
    const month = currentDisplayDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;

    currentMonthYear.textContent = firstDay.toLocaleString('ru', { month: 'long', year: 'numeric' });

    let html = '';
    let dayCount = 1;
    const totalCells = 42;

    for (let i = 0; i < totalCells; i++) {
        if (i < startDayOfWeek || dayCount > lastDay.getDate()) {
            const d = new Date(year, month, dayCount - startDayOfWeek);
            const dateStr = formatLocalDate(d);
            html += renderCalendarCell(d, dateStr, true);
            if (i >= startDayOfWeek) dayCount++;
        } else {
            const cellDate = new Date(year, month, dayCount);
            const dateStr = formatLocalDate(cellDate);
            html += renderCalendarCell(cellDate, dateStr, false);
            dayCount++;
        }
    }
    calendarGrid.innerHTML = html;

    document.querySelectorAll('.calendar-cell').forEach(cell => {
        if (cell.dataset.date === selectedDate) {
            cell.classList.add('selected');
        }
    });
}

function renderCalendarCell(date, dateStr, isOtherMonth) {
    const day = date.getDate();
    const isToday = dateStr === formatLocalDate(new Date());
    const hasTasks = tasks.some(t => t.dueDate === dateStr);

    let classes = 'calendar-cell';
    if (isOtherMonth) classes += ' other-month';
    if (isToday)      classes += ' today';
    if (hasTasks)     classes += ' has-tasks';

    return `<div class="${classes}" data-date="${dateStr}">
        <span class="day-number">${day}</span>
        ${hasTasks ? '<span class="task-indicator"></span>' : ''}
    </div>`;
}

// === Обработчики календаря ===
calendarGrid.addEventListener('click', (e) => {
    const cell = e.target.closest('.calendar-cell');
    if (!cell) return;
    const dateStr = cell.dataset.date;
    if (dateStr) {
        selectedDate = dateStr;
        filterByDate = dateStr;
        dueDateInput.value = dateStr;
        renderTasks();
        renderCalendar();
    }
});

prevMonthBtn.addEventListener('click', () => {
    currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
    renderCalendar();
});

selectedDateInfo.addEventListener('click', () => {
    filterByDate = null;
    renderTasks();
    renderCalendar();
    showNotification('Показаны все задачи', 'info');
});

// === Добавление задачи ===
addBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (text === '') {
        showNotification('Введите текст задачи', 'error');
        return;
    }

    const dueDate  = dueDateInput.value;
    const priority = prioritySelect.value;

    const newTask = {
        id: Date.now(),
        text: text,
        done: false,
        dueDate: dueDate,
        priority: priority
    };

    tasks.push(newTask);
    saveTasks();

    renderTasks();
    renderCalendar();

    taskInput.value = '';
    prioritySelect.value = 'medium';
    showNotification('Задача добавлена', 'success');
});

// === Добавление задачи по Enter ===
taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        addBtn.click();
    }
});