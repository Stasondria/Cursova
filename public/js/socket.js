const socket = io();

// Функція підключення до кімнати списку
function joinListRoom(listId) {
    socket.emit('join_list', listId);
}

// Функція виходу з кімнати
function leaveListRoom(listId) {
    socket.emit('leave_list', listId);
}

// Слухаємо події від сервера
socket.on('task_added', (task) => {
    if (typeof window.onTaskAdded === 'function') {
        window.onTaskAdded(task);
    }
});

socket.on('task_updated', (task) => {
    if (typeof window.onTaskUpdated === 'function') {
        window.onTaskUpdated(task);
    }
});

socket.on('task_deleted', (data) => {
    if (typeof window.onTaskDeleted === 'function') {
        window.onTaskDeleted(data.taskId);
    }
});