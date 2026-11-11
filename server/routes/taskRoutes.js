const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

// Публічний маршрут (будь-хто може бачити спільні завдання)
router.get('/public', taskController.getPublicTasks);

// Захищені маршрути (потрібна авторизація)
router.get('/private', authMiddleware, taskController.getPrivateTasks);
router.post('/', authMiddleware, taskController.createTask);
router.put('/:taskId', authMiddleware, taskController.updateTask);
router.delete('/:taskId', authMiddleware, taskController.deleteTask);

module.exports = router;