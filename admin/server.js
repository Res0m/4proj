const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Путь к файлу с данными
const dataPath = path.join(__dirname, '../data/products.json');

// Helper function to read and write products
async function getProducts() {
    try {
        const data = await fs.readFile(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка при чтении файла продуктов:', error);
        return [];
    }
}

async function saveProducts(products) {
    try {
        await fs.writeFile(dataPath, JSON.stringify(products, null, 2));
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении файла продуктов:', error);
        return false;
    }
}

// Валидация продукта
function validateProduct(product) {
    if (!product.name || typeof product.name !== 'string') {
        return { isValid: false, error: 'Название товара обязательно' };
    }
    if (!product.price || typeof product.price !== 'number' || product.price <= 0) {
        return { isValid: false, error: 'Цена должна быть положительным числом' };
    }
    if (!product.categories || !Array.isArray(product.categories)) {
        return { isValid: false, error: 'Категории должны быть массивом' };
    }
    return { isValid: true };
}

// REST API endpoints
app.get('/api/products', async (req, res) => {
    try {
        const products = await getProducts();
        res.json(products);
    } catch (error) {
        console.error('Ошибка при получении товаров:', error);
        res.status(500).json({ error: 'Ошибка при получении товаров' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const products = await getProducts();
        const productId = parseInt(req.params.id);
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        res.json(product);
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

        const products = await getProducts();
        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        if (await saveProducts(products)) {
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

        const products = await getProducts();
        const productId = parseInt(req.params.id);
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        products[productIndex] = {
            ...products[productIndex],
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        
        if (await saveProducts(products)) {
            res.json(products[productIndex]);
        } else {
            res.status(500).json({ error: 'Ошибка сохранения товара' });
        }
    } catch (error) {
        console.error('Ошибка при обновлении товара:', error);
        res.status(500).json({ error: 'Ошибка при обновлении товара' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const products = await getProducts();
        const productId = parseInt(req.params.id);
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        products.splice(productIndex, 1);
        if (await saveProducts(products)) {
            res.json({ message: 'Товар успешно удален' });
        } else {
            res.status(500).json({ error: 'Ошибка удаления товара' });
        }
    } catch (error) {
        console.error('Ошибка при удалении товара:', error);
        res.status(500).json({ error: 'Ошибка при удалении товара' });
    }
});

// Serve admin panel
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Что-то пошло не так!' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Админ-панель запущена на http://localhost:${PORT}`);
}); 