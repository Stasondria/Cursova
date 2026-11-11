const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Реєстрація користувача
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 1. Перевірка чи існує вже такий email
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Користувач з таким email вже існує' });
        }

        // 2. Хешуємо пароль
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Зберігаємо нового користувача
        const newUser = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        // 4. Генеруємо JWT токен
        const token = jwt.sign(
            { userId: newUser.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Реєстрація успішна!',
            token,
            user: newUser.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Помилка сервера при реєстрації' });
    }
};

// Вхід користувача (Login)
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Шукаємо користувача за email
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Невірний email або пароль' });
        }

        const user = userResult.rows[0];

        // 2. Перевіряємо пароль
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Невірний email або пароль' });
        }

        // 3. Генеруємо токен
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Успішний вхід!',
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Помилка сервера при вході' });
    }
};