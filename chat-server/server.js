const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3003;

// Создаем HTTP сервер для health check
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200);
        res.end('OK');
    } else {
        res.writeHead(404);
        res.end();
    }
});

// Создаем WebSocket сервер
const wss = new WebSocket.Server({ 
    server,
    path: '/ws',
    clientTracking: true
});

// Хранилище подключенных клиентов
const clients = new Set();

// Валидация сообщения
function validateMessage(data) {
    if (!data || typeof data !== 'object') {
        return { isValid: false, error: 'Неверный формат сообщения' };
    }

    if (data.type === 'chat') {
        if (!data.user || typeof data.user !== 'string') {
            return { isValid: false, error: 'Неверный формат пользователя' };
        }
        if (!data.text || typeof data.text !== 'string') {
            return { isValid: false, error: 'Неверный формат текста сообщения' };
        }
    } else if (data.type === 'products_update') {
        if (!data.action || !['create', 'update', 'delete'].includes(data.action)) {
            return { isValid: false, error: 'Неверное действие обновления' };
        }
        if (!data.productId) {
            return { isValid: false, error: 'Отсутствует ID товара' };
        }
    } else {
        return { isValid: false, error: 'Неизвестный тип сообщения' };
    }

    return { isValid: true };
}

// Отправка сообщения клиенту с обработкой ошибок
function sendToClient(client, message) {
    try {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    } catch (error) {
        console.error('Ошибка отправки сообщения клиенту:', error);
        clients.delete(client);
    }
}

// Очистка неактивных соединений
function cleanupInactiveConnections() {
    clients.forEach(client => {
        if (client.readyState !== WebSocket.OPEN) {
            clients.delete(client);
        }
    });
}

// Периодическая очистка неактивных соединений
setInterval(cleanupInactiveConnections, 30000);

wss.on('connection', function connection(ws, req) {
    console.log('Новый клиент подключен');
    clients.add(ws);

    // Отправка приветственного сообщения
    sendToClient(ws, {
        type: 'system',
        text: 'Добро пожаловать в чат поддержки!'
    });

    ws.on('message', function incoming(message) {
        try {
            const data = JSON.parse(message);
            console.log('Получено сообщение:', data);
            
            // Валидация сообщения
            const validation = validateMessage(data);
            if (!validation.isValid) {
                sendToClient(ws, {
                    type: 'error',
                    text: validation.error
                });
                return;
            }
            
            // Если это сообщение чата
            if (data.type === 'chat') {
                // Отправляем сообщение всем клиентам
                clients.forEach(client => {
                    sendToClient(client, {
                        type: 'chat',
                        user: data.user,
                        text: data.text,
                        timestamp: new Date().toISOString()
                    });
                });
            }
            // Если это обновление товаров
            else if (data.type === 'products_update') {
                console.log('Отправка обновления товаров всем клиентам:', data);
                // Отправляем обновление всем клиентам
                clients.forEach(client => {
                    sendToClient(client, {
                        type: 'products_update',
                        action: data.action,
                        productId: data.productId,
                        timestamp: new Date().toISOString()
                    });
                });
            }
        } catch (error) {
            console.error('Ошибка обработки сообщения:', error);
            sendToClient(ws, {
                type: 'error',
                text: 'Ошибка обработки сообщения'
            });
        }
    });

    ws.on('close', function close() {
        console.log('Клиент отключен');
        clients.delete(ws);
    });

    ws.on('error', function error(err) {
        console.error('Ошибка WebSocket:', err);
        clients.delete(ws);
    });
});

wss.on('error', function error(error) {
    console.error('Ошибка WebSocket сервера:', error);
});

// Запуск сервера
server.listen(PORT, () => {
    console.log(`Чат-сервер запущен на ws://localhost:${PORT}/ws`);
}); 