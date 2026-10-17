import express from 'express';
import path from 'node:path';
import bikesRouter from './routes/bikes.js';
import quizRouter from './routes/quiz.js';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// отдаём файлы сайта из папки frontend
app.use(express.static(path.join(import.meta.dirname, '..', 'frontend')));

// первый адрес API: проверка, что сервер жив
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/bikes', bikesRouter);
app.use('/api/quiz', quizRouter);

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});