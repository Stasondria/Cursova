const db = require('../config/db');

// Отримати всі списки, до яких користувач має доступ (власні + спільні)
exports.getLists = async (req, res) => {
    const userId = req.user.userId;

    try {
        const lists = await db.query(
            `SELECT l.id, l.title, l.owner_id, l.created_at, 
              (l.owner_id = $1) AS is_owner
       FROM lists l
       LEFT JOIN list_members lm ON l.id = lm.list_id
       WHERE l.owner_id = $1 OR lm.user_id = $1
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
            [userId]
        );

        res.json(lists.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Помилка сервера при отриманні списків' });
    }
};

// Створити новий список
exports.createList = async (req, res) => {
    const { title } = req.body;
    const userId = req.user.userId;

    if (!title) {
        return res.status(400).json({ message: 'Назва списку обов\'язкова' });
    }

    try {
        const newList = await db.query(
            'INSERT INTO lists (title, owner_id) VALUES ($1, $2) RETURNING *',
            [title, userId]
        );

        // Автоматично додаємо власника у таблицю членів списку
        await db.query(
            'INSERT INTO list_members (list_id, user_id, role) VALUES ($1, $2, $3)',
            [newList.rows[0].id, userId, 'owner']
        );

        res.status(201).json(newList.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Помилка при створенні списку' });
    }
};

// Видалити список
exports.deleteList = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        // Перевіряємо, чи є користувач власником
        const list = await db.query('SELECT * FROM lists WHERE id = $1', [id]);

        if (list.rows.length === 0) {
            return res.status(404).json({ message: 'Список не знайдено' });
        }

        if (list.rows[0].owner_id !== userId) {
            return res.status(403).json({ message: 'Тільки власник може видалити список' });
        }

        await db.query('DELETE FROM lists WHERE id = $1', [id]);
        res.json({ message: 'Список успішно видалено' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Помилка при видаленні списку' });
    }
};