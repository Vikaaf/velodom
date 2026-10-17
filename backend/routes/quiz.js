import { Router } from 'express';
import { db } from '../db/db.js';

const router = Router();

// какие типы велосипедов подходят под стиль катания: основной и запасной
const STYLE_TYPES = {
    city: { main: ['city'], extra: ['hybrid'] },
    gravel: { main: ['hybrid'], extra: ['mountain'] },
    mountain: { main: ['mountain'], extra: [] },
    road: { main: ['road'], extra: ['hybrid'] },
    mixed: { main: ['hybrid'], extra: ['city', 'mountain'] },
};

// POST /api/quiz — подбор велосипедов по ответам опроса
// пример тела запроса:
// { "height": 175, "style": "city", "color": "blue", "minPrice": 20000, "maxPrice": 50000,
//   "discount": 0, "gender": "any", "age": "adult" }
router.post('/', (req, res) => {
    const answers = req.body;

    if (!answers || !Number(answers.height) || !answers.age) {
        return res.status(400).json({ error: 'Нужно указать рост и возраст' });
    }
    const height = Number(answers.height);
    const gender = answers.gender === 'female' || answers.gender === 'male' ? answers.gender : 'any';

    // 1. Жёсткие условия: подходящий возраст, есть размер рамы под рост,
    //    и если выбран пол — велосипед для этого пола или универсальный
    const candidates = db.prepare(`
    SELECT bikes.*, bike_sizes.frame_size AS recommended_size, bike_sizes.in_stock AS size_in_stock,
           (SELECT url FROM bike_images
             WHERE bike_images.bike_id = bikes.id
             ORDER BY sort_order LIMIT 1) AS image
    FROM bikes
    JOIN bike_sizes ON bike_sizes.bike_id = bikes.id
    WHERE bikes.age_group = ?
      AND ? BETWEEN bike_sizes.min_height AND bike_sizes.max_height
      AND (? = 'any' OR bikes.gender IN ('unisex', ?))
    GROUP BY bikes.id
  `).all(answers.age, height, gender, gender);

    const colorsOf = db.prepare('SELECT color_group FROM bike_colors WHERE bike_id = ?');

    // 2. Мягкие условия: за каждое совпадение начисляем баллы
    const results = candidates.map(bike => {
        let score = 0;
        const reasons = [`Рама ${bike.recommended_size} подходит для роста ${height} см`];

        const style = STYLE_TYPES[answers.style];
        if (style?.main.includes(bike.type)) {
            score += 30;
            reasons.push('Создан для вашего стиля катания');
        } else if (style?.extra.includes(bike.type)) {
            score += 15;
            reasons.push('Подходит для вашего стиля катания');
        }

        const minPrice = Number(answers.minPrice) || 0;
        const maxPrice = Number(answers.maxPrice) || Infinity;
        if (bike.price >= minPrice && bike.price <= maxPrice) {
            score += 25;
            reasons.push('Укладывается в бюджет');
        } else if (bike.price <= maxPrice * 1.1) {
            score += 10; // чуть дороже бюджета, но всё ещё можно показать
        }

        const discount = bike.old_price ? Math.round((1 - bike.price / bike.old_price) * 100) : 0;
        if (Number(answers.discount) > 0 && discount >= Number(answers.discount)) {
            score += 5;
            reasons.push(`Скидка ${discount}%`);
        }

        if (answers.color && answers.color !== 'any') {
            const colors = colorsOf.all(bike.id).map(row => row.color_group);
            if (colors.includes(answers.color)) {
                score += 10;
                reasons.push('Есть в выбранном цвете');
            }
        }

        if (gender !== 'any' && bike.gender === gender) {
            score += 15;
            reasons.push(gender === 'female' ? 'Женская геометрия рамы' : 'Мужская геометрия рамы');
        }

        if (bike.size_in_stock) {
            score += 5;
        }

        return {
            id: bike.id,
            name: bike.name,
            brand: bike.brand,
            type: bike.type,
            price: bike.price,
            old_price: bike.old_price,
            image: bike.image,
            rating: bike.rating,
            recommended_size: bike.recommended_size,
            score,
            reasons,
        };
    });

    // 3. Сортируем: больше баллов — выше; при равенстве выше популярные
    results.sort((a, b) => b.score - a.score || b.rating - a.rating);

    res.json(results.slice(0, 6));
});

export default router;
