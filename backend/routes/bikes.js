import { Router } from 'express';
import { db } from '../db/db.js';

const router = Router();

// GET /api/bikes — список велосипедов для каталога
router.get('/', (req, res) => {
    const bikes = db.prepare(`
    SELECT id, sku, name, brand, type, price, old_price, wheel_size, speeds,
           rating, reviews_count, badge,
           (SELECT url FROM bike_images
             WHERE bike_images.bike_id = bikes.id
             ORDER BY sort_order LIMIT 1) AS image
    FROM bikes
    ORDER BY popularity DESC
  `).all();

    res.json(bikes);
});

// GET /api/bikes/5 — один велосипед со всеми подробностями
router.get('/:id', (req, res) => {
    const id = Number(req.params.id);
    const bike = db.prepare('SELECT * FROM bikes WHERE id = ?').get(id);

    if (!bike) {
        return res.status(404).json({ error: 'Велосипед не найден' });
    }

    bike.sizes = db.prepare('SELECT frame_size, min_height, max_height, in_stock FROM bike_sizes WHERE bike_id = ?').all(id);
    bike.colors = db.prepare('SELECT name, color_group, hex FROM bike_colors WHERE bike_id = ?').all(id);
    bike.images = db.prepare('SELECT url FROM bike_images WHERE bike_id = ? ORDER BY sort_order').all(id).map(row => row.url);
    bike.specs = db.prepare('SELECT group_name, name, value FROM bike_specs WHERE bike_id = ? ORDER BY sort_order').all(id);
    bike.reviews = db.prepare('SELECT author, rating, frame_size, usage_period, text, helpful_count, created_at FROM reviews WHERE bike_id = ? ORDER BY helpful_count DESC').all(id);

    res.json(bike);
});

export default router;