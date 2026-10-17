import { Router } from 'express';
import { db } from '../db/db.js';

const router = Router();

// порядок сортировки: значение из адреса → кусок SQL
const SORTS = {
  popular: 'popularity DESC',
  price_asc: 'price ASC',
  price_desc: 'price DESC',
  new: 'created_at DESC, model_year DESC',
  rating: 'rating DESC',
};

// превращаем ?type=city,hybrid в массив ['city', 'hybrid']
function toList(value) {
  return value ? String(value).split(',').filter(Boolean) : [];
}

// GET /api/bikes?type=mountain&maxPrice=50000&sort=price_asc — каталог с фильтрами
router.get('/', (req, res) => {
  const q = req.query;
  const conditions = []; // кусочки WHERE
  const params = [];     // значения для «?» в том же порядке

  const types = toList(q.type);
  if (types.length) {
    conditions.push(`type IN (${types.map(() => '?').join(', ')})`);
    params.push(...types);
  }

  const brands = toList(q.brand);
  if (brands.length) {
    conditions.push(`brand IN (${brands.map(() => '?').join(', ')})`);
    params.push(...brands);
  }

  if (q.minPrice) {
    conditions.push('price >= ?');
    params.push(Number(q.minPrice));
  }
  if (q.maxPrice) {
    conditions.push('price <= ?');
    params.push(Number(q.maxPrice));
  }

  const genders = toList(q.gender);
  if (genders.length) {
    conditions.push(`gender IN (${genders.map(() => '?').join(', ')})`);
    params.push(...genders);
  }

  const ages = toList(q.age);
  if (ages.length) {
    conditions.push(`age_group IN (${ages.map(() => '?').join(', ')})`);
    params.push(...ages);
  }

  // размер рамы и наличие лежат в другой таблице, поэтому EXISTS:
  // «существует размер этого велосипеда, подходящий под условие»
  const frames = toList(q.frame);
  if (frames.length) {
    conditions.push(`EXISTS (SELECT 1 FROM bike_sizes
      WHERE bike_sizes.bike_id = bikes.id
        AND frame_size IN (${frames.map(() => '?').join(', ')}))`);
    params.push(...frames);
  }

  if (q.inStock === '1') {
    conditions.push('EXISTS (SELECT 1 FROM bike_sizes WHERE bike_sizes.bike_id = bikes.id AND in_stock = 1)');
  }

  if (q.discount === '1') {
    conditions.push('old_price > price');
  }

  if (q.search) {
    conditions.push('(name LIKE ? OR brand LIKE ?)');
    params.push(`%${q.search}%`, `%${q.search}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const orderBy = SORTS[q.sort] || SORTS.popular;
  const limit = Number(q.limit) || 12;
  const offset = Number(q.offset) || 0;

  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM bikes ${where}`).get(...params);

  const bikes = db.prepare(`
    SELECT id, sku, name, brand, type, price, old_price, wheel_size, speeds,
           rating, reviews_count, badge,
           (SELECT url FROM bike_images
             WHERE bike_images.bike_id = bikes.id
             ORDER BY sort_order LIMIT 1) AS image,
           (SELECT group_concat(frame_size, ', ') FROM bike_sizes
             WHERE bike_sizes.bike_id = bikes.id) AS frame_sizes
    FROM bikes
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ total, bikes });
});

// порядок размеров рамы в фильтре: сначала детские в дюймах, потом буквенные
const FRAME_ORDER = ['11″', '12″', '13″', '14″', 'XS', 'S', 'M', 'L', 'XL'];

// GET /api/bikes/filters — варианты для панели фильтров каталога.
// Этот маршрут должен стоять ВЫШЕ, чем /:id, иначе Express решит, что 'filters' — это id.
router.get('/filters', (req, res) => {
  const brands = db.prepare('SELECT DISTINCT brand FROM bikes ORDER BY brand').all().map(row => row.brand);
  const frames = db.prepare('SELECT DISTINCT frame_size FROM bike_sizes').all()
    .map(row => row.frame_size)
    .sort((a, b) => FRAME_ORDER.indexOf(a) - FRAME_ORDER.indexOf(b));
  const { minPrice, maxPrice } = db.prepare('SELECT MIN(price) AS minPrice, MAX(price) AS maxPrice FROM bikes').get();

  res.json({ brands, frames, minPrice, maxPrice });
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
