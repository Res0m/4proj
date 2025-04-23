const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const schema = require('./schema');

const app = express();
const PORT = 3001;

// Функция для чтения данных о продуктах
async function readProductsData() {
    try {
        const data = await fs.readFile(path.join(__dirname, '../data/products.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка при чтении файла продуктов:', error);
        return [];
    }
}

// Функция для сохранения данных о продуктах
async function saveProductsData(products) {
    try {
        await fs.writeFile(
            path.join(__dirname, '../data/products.json'),
            JSON.stringify(products, null, 2)
        );
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении файла продуктов:', error);
        return false;
    }
}

// Root resolver
const root = {
    // Запросы
    products: async () => {
        return await readProductsData();
    },
    product: async ({ id }) => {
        const data = await readProductsData();
        return data.find(product => product.id === parseInt(id));
    },
    productsByCategory: async ({ category }) => {
        const data = await readProductsData();
        return data.filter(product => product.categories && product.categories.includes(category));
    },

    // Мутации
    createProduct: async ({ input }) => {
        const products = await readProductsData();
        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            ...input,
            createdAt: new Date().toISOString()
        };
        products.push(newProduct);
        await saveProductsData(products);
        return newProduct;
    },

    updateProduct: async ({ id, input }) => {
        const products = await readProductsData();
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index === -1) {
            throw new Error('Товар не найден');
        }
        products[index] = {
            ...products[index],
            ...input,
            updatedAt: new Date().toISOString()
        };
        await saveProductsData(products);
        return products[index];
    },

    deleteProduct: async ({ id }) => {
        const products = await readProductsData();
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index === -1) {
            throw new Error('Товар не найден');
        }
        products.splice(index, 1);
        await saveProductsData(products);
        return true;
    }
};

// Middleware
app.use(cors());
app.use(express.static('public'));

// GraphQL endpoint
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
    customFormatErrorFn: (error) => ({
        message: error.message,
        locations: error.locations,
        path: error.path
    })
}));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Что-то пошло не так!' });
});

app.listen(PORT, () => {
    console.log(`Клиентский сервер запущен на http://localhost:${PORT}`);
}); 