const express = require('express');
const router = express.Router();
const listController = require('../controllers/listController');
const authMiddleware = require('../middleware/authMiddleware');

// Захищаємо всі маршрути middleware-ом authMiddleware
router.get('/', authMiddleware, listController.getLists);
router.post('/', authMiddleware, listController.createList);
router.delete('/:id', authMiddleware, listController.deleteList);

module.exports = router;