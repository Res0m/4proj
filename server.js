const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// Раздача статических файлов
app.use(express.static(path.join(__dirname, 'client', 'public')));

// Путь к файлу с данными
const dataPath = path.join(__dirname, 'data', 'products.json');

// Функция для чтения продуктов
async function readProducts() {
    try {
        const data = await fs.readFile(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка при чтении файла продуктов:', error);
        return [];
    }
}

// Функция для сохранения продуктов
async function saveProducts(products) {
    try {
        await fs.writeFile(dataPath, JSON.stringify(products, null, 2));
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении файла продуктов:', error);
        return false;
    }
}

// Создаем директорию data, если её нет
async function ensureDataDirectory() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        // Проверяем существование файла products.json
        try {
            await fs.access(dataPath);
        } catch {
            // Если файл не существует, создаем его с пустым массивом
            await fs.writeFile(dataPath, JSON.stringify([]));
        }
    } catch (error) {
        console.error('Ошибка при создании директории data:', error);
    }
}

// Инициализация при запуске сервера
ensureDataDirectory();

// Валидация продукта
function validateProduct(product) {
    if (!product.name || typeof product.name !== 'string') {
        return { isValid: false, error: 'Название товара обязательно' };
    }
    if (!product.price || typeof product.price !== 'number' || product.price <= 0) {
        return { isValid: false, error: 'Цена должна быть положительным числом' };
    }
    return { isValid: true };
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Получение всех товаров
app.get('/api/products', async (req, res) => {
    try {
        console.log('Запрос на получение товаров');
        const products = await readProducts();
        console.log('Отправлено товаров:', products.length);
        res.json(products);
    } catch (error) {
        console.error('Ошибка при получении товаров:', error);
        res.status(500).json({ error: 'Ошибка при получении товаров' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const products = await readProducts();
        const product = products.find(p => p.id === parseInt(req.params.id));
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Товар не найден' });
        }
    } catch (error) {
        console.error('Ошибка при получении товара:', error);
        res.status(500).json({ error: 'Ошибка при получении товара' });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const validation = validateProduct(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        const products = await readProducts();
        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            ...req.body,
            createdAt: new Date().toISOString()
        };
        products.push(newProduct);
        
        if (await saveProducts(products)) {
            console.log('Создан новый товар:', newProduct.id);
            res.status(201).json(newProduct);
        } else {
            res.status(500).json({ error: 'Ошибка сохранения товара' });
        }
    } catch (error) {
        console.error('Ошибка при создании товара:', error);
        res.status(500).json({ error: 'Ошибка при создании товара' });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const validation = validateProduct(req.body);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        const products = await readProducts();
        const index = products.findIndex(p => p.id === parseInt(req.params.id));
        if (index !== -1) {
            products[index] = {
                ...products[index],
                ...req.body,
                updatedAt: new Date().toISOString()
            };
            if (await saveProducts(products)) {
                console.log('Обновлен товар:', products[index].id);
                res.json(products[index]);
            } else {
                res.status(500).json({ error: 'Ошибка сохранения товара' });
            }
        } else {
            res.status(404).json({ error: 'Товар не найден' });
        }
    } catch (error) {
        console.error('Ошибка при обновлении товара:', error);
        res.status(500).json({ error: 'Ошибка при обновлении товара' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const products = await readProducts();
        const index = products.findIndex(p => p.id === parseInt(req.params.id));
        if (index !== -1) {
            const deletedProduct = products[index];
            products.splice(index, 1);
            if (await saveProducts(products)) {
                console.log('Удален товар:', deletedProduct.id);
                res.status(204).send();
            } else {
                res.status(500).json({ error: 'Ошибка удаления товара' });
            }
        } else {
            res.status(404).json({ error: 'Товар не найден' });
        }
    } catch (error) {
        console.error('Ошибка при удалении товара:', error);
        res.status(500).json({ error: 'Ошибка при удалении товара' });
    }
});

// Обработка всех остальных маршрутов
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`API сервер запущен на http://localhost:${PORT}`);
}); 