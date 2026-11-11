const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.on('connect', () => {
    console.log('Успішно підключено до бази даних PostgreSQL!');
});

pool.on('error', (err) => {
    console.error('Помилка підключення до БД:', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};