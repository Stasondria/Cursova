const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const listRoutes = require('./routes/listRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Додаємо io до req, щоб можна було викликати сокети з контролерів
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Маршрути API
app.use('/api/auth', authRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/tasks', taskRoutes);

// Логіка підключення Socket.io
io.on('connection', (socket) => {
    console.log(`Користувач підключився: ${socket.id}`);

    // Приєднання до кімнати конкретного списку
    socket.on('join_list', (listId) => {
        socket.join(`list_${listId}`);
        console.log(`Сокет ${socket.id} приєднався до кімнати list_${listId}`);
    });

    // Вихід з кімнати списку
    socket.on('leave_list', (listId) => {
        socket.leave(`list_${listId}`);
    });

    socket.on('disconnect', () => {
        console.log(`Користувач відключився: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Сервер запущено на порту ${PORT}`);
});