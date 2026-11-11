const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Отримуємо токен із заголовка Authorization
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ message: 'Немає токена, доступ заборонено' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Додаємо userId до об'єкта запиту
        next();
    } catch (err) {
        res.status(401).json({ message: 'Недійсний токен' });
    }
};