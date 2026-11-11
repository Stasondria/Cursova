const db = require('../config/db');

// 1. Отримати всі СПІЛЬНІ завдання (видимі для всіх)
exports.getPublicTasks = async (req, res) => {
    try {
        const tasks = await db.query(
            `SELECT t.*, u.username AS author 
       FROM tasks t 
       LEFT JOIN users u ON t.user_id = u.id 
       WHERE t.is_private = FALSE 
       ORDER BY t.position ASC, t.created_at DESC`
        );
        res.json(tasks.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Помилка при отриманні спільних завдань' });
    }
};

// 2. Отримати ПРИВАТНІ завдання (тільки поточного користувача)
exports.getPrivateTasks = async (req, res) => {
    const userId = req.user.userId;

    try {
        const tasks = await db.query(
            `SELECT * FROM tasks 
       WHERE is_private = TRUE AND user_id = $1 
       ORDER BY position ASC, created_at DESC`,
            [userId]
        );
        res.json(tasks.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Помилка при отриманні приватних завдань' });
    }
};

// 3. Створення нового завдання (спільного або приватного)
exports.createTask = async (req, res) => {
    const { title, description, due_date, is_private } = req.body;
    const userId = req.user.userId;

    if (!title) {
        return res.status(400).json({ message: 'Назва завдання обов\'язкова' });
    }

    try {
        const maxPosResult = await db.query(
            'SELECT COALESCE(MAX(position), 0) AS max_pos FROM tasks WHERE is_private = $1',
            [is_private || false]
        );
        const nextPosition = maxPosResult.rows[0].max_pos + 1;

        const newTask = await db.query(
            `INSERT INTO tasks (title, description, due_date, is_private, user_id, position) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
            [title, description || null, due_date || null, is_private || false, userId, nextPosition]
        );

        const taskData = newTask.rows[0];

        // Додаємо ім'я автора для відправки сокетам
        const userResult = await db.query('SELECT username FROM users WHERE id = $1', [userId]);
        taskData.author = userResult.rows[0]?.username || 'Анонім';

        // Якщо завдання СПІЛЬНЕ — сповіщаємо всіх користувачів через Socket.io в real-time
        if (!is_private) {
            req.io.emit('public_task_added', taskData);
        }

        res.status(201).json(taskData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Помилка при створенні завдання' });
    }
};

// 4. Оновлення завдання (редагування назви, опису, статусу виконання)
exports.updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { title, description, due_date, is_completed } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    try {
        const taskResult = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ message: 'Завдання не знайдено' });
        }

        const currentTask = taskResult.rows[0];

        // Перевірка прав: редагувати може автор, адмін або будь-хто, якщо завдання спільне
        if (currentTask.is_private && currentTask.user_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ message: 'Немає доступу до цього приватного завдання' });
        }

        const newTitle = title !== undefined ? title : currentTask.title;
        const newDesc = description !== undefined ? description : currentTask.description;
        const newDue = due_date !== undefined ? due_date : currentTask.due_date;
        const newStatus = is_completed !== undefined ? is_completed : currentTask.is_completed;

        const updatedTask = await db.query(
            `UPDATE tasks 
       SET title = $1, description = $2, due_date = $3, is_completed = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 
       RETURNING *`,
            [newTitle, newDesc, newDue, newStatus, taskId]
        );

        const updatedData = updatedTask.rows[0];

        // Якщо це спільне завдання — сповіщаємо всіх у real-time
        if (!currentTask.is_private) {
            req.io.emit('public_task_updated', updatedData);
        }

        res.json(updatedData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Помилка при оновленні завдання' });
    }
};

// 5. Видалення завдання
exports.deleteTask = async (req, res) => {
    const { taskId } = req.params;
    const userId = req.user.userId;

    try {
        // Отримуємо роль користувача з бази для точності
        const userRes = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
        const userRole = userRes.rows[0]?.role;

        const taskResult = await db.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
        if (taskResult.rows.length === 0) {
            return res.status(404).json({ message: 'Завдання не знайдено' });
        }

        const task = taskResult.rows[0];

        // Адмін може видаляти будь-які завдання, звичайний користувач — тільки свої (або спільні)
        if (task.is_private && task.user_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ message: 'Ви не можете видалити це приватне завдання' });
        }

        await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);

        // Якщо видалено спільне завдання — надсилаємо сигнал усім через сокети
        if (!task.is_private) {
            req.io.emit('public_task_deleted', { taskId: Number(taskId) });
        }

        res.json({ message: 'Завдання успішно видалено' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Помилка при видаленні завдання' });
    }
};