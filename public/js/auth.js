document.addEventListener('DOMContentLoaded', () => {
    const loginFormBox = document.getElementById('login-form-box');
    const registerFormBox = document.getElementById('register-form-box');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessage = document.getElementById('auth-message');

    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const userDisplayName = document.getElementById('user-display-name');
    const logoutBtn = document.getElementById('logout-btn');

    // Перемикання між формами
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormBox.style.display = 'none';
        registerFormBox.style.display = 'block';
        authMessage.textContent = '';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerFormBox.style.display = 'none';
        loginFormBox.style.display = 'block';
        authMessage.textContent = '';
    });

    // Перевірка чи користувач вже увійшов
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        showApp(user.username);
    }

    // Обробка Реєстрації
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                authMessage.textContent = data.message || 'Помилка реєстрації';
                return;
            }

            // Зберігаємо токен і дані користувача
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            showApp(data.user.username);
        } catch (err) {
            console.error(err);
            authMessage.textContent = 'Помилка підключення до сервера';
        }
    });

    // Обробка Входу
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                authMessage.textContent = data.message || 'Помилка входу';
                return;
            }

            // Зберігаємо токен і дані користувача
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            showApp(data.user.username);
        } catch (err) {
            console.error(err);
            authMessage.textContent = 'Помилка підключення до сервера';
        }
    });

    // Вихід з акаунту
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        appContainer.style.display = 'none';
        authContainer.style.display = 'block';
    });

    function showApp(username) {
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        userDisplayName.textContent = username;
    }
});