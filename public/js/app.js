document.addEventListener('DOMContentLoaded', () => {
    // Елементи сторінок
    const pageHome = document.getElementById('page-home');
    const pageAuth = document.getElementById('page-auth');
    const pageProfile = document.getElementById('page-profile');

    // Навігація
    const navHomeBtn = document.getElementById('nav-home-btn');
    const navProfileBtn = document.getElementById('nav-profile-btn');
    const navAuthBtn = document.getElementById('nav-auth-btn');
    const navLogoutBtn = document.getElementById('nav-logout-btn');

    // Форми та списки
    const publicTasksList = document.getElementById('public-tasks-list');
    const privateTasksList = document.getElementById('private-tasks-list');
    const createPublicForm = document.getElementById('create-public-task-form');
    const createPrivateForm = document.getElementById('create-private-task-form');

    // Перемикач сторінок
    function showPage(pageName) {
        pageHome.style.display = pageName === 'home' ? 'block' : 'none';
        pageAuth.style.display = pageName === 'auth' ? 'block' : 'none';
        pageProfile.style.display = pageName === 'profile' ? 'block' : 'none';

        if (pageName === 'home') loadPublicTasks();
        if (pageName === 'profile') loadPrivateTasks();
    }

    navHomeBtn.addEventListener('click', () => showPage('home'));
    navProfileBtn.addEventListener('click', () => showPage('profile'));
    navAuthBtn.addEventListener('click', () => showPage('auth'));

    function checkAuthState() {
        const user = JSON.parse(localStorage.getItem('user'));
        const authOnlyElements = document.querySelectorAll('.auth-only');

        if (user) {
            navAuthBtn.style.display = 'none';
            navProfileBtn.style.display = 'inline-block';
            navLogoutBtn.style.display = 'inline-block';
            authOnlyElements.forEach(el => el.style.display = 'block');
            document.getElementById('guest-warning').style.display = 'none';
            document.getElementById('profile-username').textContent = user.username;

            if (user.role === 'admin') {
                document.getElementById('admin-badge').style.display = 'inline-block';
                document.getElementById('admin-panel').style.display = 'block';
            } else {
                document.getElementById('admin-badge').style.display = 'none';
                document.getElementById('admin-panel').style.display = 'none';
            }
        } else {
            navAuthBtn.style.display = 'inline-block';
            navProfileBtn.style.display = 'none';
            navLogoutBtn.style.display = 'none';
            authOnlyElements.forEach(el => el.style.display = 'none');
            document.getElementById('guest-warning').style.display = 'block';
        }
    }

    navLogoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        checkAuthState();
        showPage('home');
    });

    // --- РОБОТА ЗІ СПІЛЬНИМИ ЗАВДАННЯМИ ---
    async function loadPublicTasks() {
        try {
            const res = await fetch('/api/tasks/public');
            const tasks = await res.json();
            publicTasksList.innerHTML = '';
            tasks.forEach(t => renderTaskItem(t, publicTasksList, false));
        } catch (err) {
            console.error('Помилка завантаження спільних завдань:', err);
        }
    }

    createPublicForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const title = document.getElementById('public-task-title').value;
        const description = document.getElementById('public-task-desc').value;
        const due_date = document.getElementById('public-task-due').value;

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, due_date, is_private: false })
            });

            if (res.ok) {
                createPublicForm.reset();
            }
        } catch (err) {
            console.error(err);
        }
    });

    // --- РОБОТА З ПРИВАТНИМИ ЗАВДАННЯМИ ---
    async function loadPrivateTasks() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('/api/tasks/private', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const tasks = await res.json();
            privateTasksList.innerHTML = '';
            tasks.forEach(t => renderTaskItem(t, privateTasksList, true));
        } catch (err) {
            console.error('Помилка завантаження приватних завдань:', err);
        }
    }

    createPrivateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const title = document.getElementById('private-task-title').value;
        const description = document.getElementById('private-task-desc').value;
        const due_date = document.getElementById('private-task-due').value;

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, due_date, is_private: true })
            });

            if (res.ok) {
                createPrivateForm.reset();
                loadPrivateTasks();
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Генерація елемента завдання у списку
    function renderTaskItem(task, targetUl, isPrivate) {
        const user = JSON.parse(localStorage.getItem('user'));
        const li = document.createElement('li');
        li.className = 'task-card';
        li.dataset.id = task.id;

        const formattedDate = task.due_date ? new Date(task.due_date).toLocaleString('uk-UA') : 'Не вказано';

        li.innerHTML = `
            <div class="task-info">
                <div class="task-header">
                    <input type="checkbox" ${task.is_completed ? 'checked' : ''} class="task-checkbox">
                    <strong class="task-title ${task.is_completed ? 'completed' : ''}">${task.title}</strong>
                </div>
                ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
                <div class="task-meta">
                    <small>🕒 Час: ${formattedDate} ${task.author ? `| Автор: <b>${task.author}</b>` : ''}</small>
                </div>
            </div>
            <div class="task-actions">
                ${(user && (user.id === task.user_id || user.role === 'admin' || !isPrivate))
                ? '<button class="btn btn-delete">Видалити</button>'
                : ''}
            </div>
        `;

        // Чекбокс виконання
        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', async () => {
            const token = localStorage.getItem('token');
            if (!token) return alert('Увійдіть, щоб змінювати статус!');

            await fetch(`/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_completed: checkbox.checked })
            });
        });

        // Видалення
        const deleteBtn = li.querySelector('.btn-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                const token = localStorage.getItem('token');
                await fetch(`/api/tasks/${task.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (isPrivate) loadPrivateTasks();
            });
        }

        targetUl.appendChild(li);
    }

    // --- REAL-TIME СОКЕТИ ДЛЯ СПІЛЬНИХ ЗАВДАНЬ ---
    const socket = io();

    socket.on('public_task_added', (task) => {
        renderTaskItem(task, publicTasksList, false);
    });

    socket.on('public_task_updated', () => {
        loadPublicTasks();
    });

    socket.on('public_task_deleted', ({ taskId }) => {
        const item = publicTasksList.querySelector(`li[data-id="${taskId}"]`);
        if (item) item.remove();
    });

    // Старт
    checkAuthState();
    showPage('home');
});