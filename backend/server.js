import express from 'express';
import path from 'node:path';
import { db } from './db/db.js';

const app = express();
const PORT = 3000;

// отдаём файлы сайта из папки frontend
app.use(express.static(path.join(import.meta.dirname, '..', 'frontend')));

// первый адрес API: проверка, что сервер жив
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});