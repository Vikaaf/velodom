import { db } from './db.js';
import { bikes } from './seed-data.js';

// заготовки запросов: «?» — места, куда подставятся значения
const insertBike = db.prepare(`
  INSERT INTO bikes (sku, name, brand, type, description, price, old_price, wheel_size, speeds,
                     gender, age_group, model_year, weight, rating, reviews_count, badge, popularity)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertSize = db.prepare(
    'INSERT INTO bike_sizes (bike_id, frame_size, min_height, max_height, in_stock) VALUES (?, ?, ?, ?, ?)'
);
const insertColor = db.prepare(
    'INSERT INTO bike_colors (bike_id, name, color_group, hex) VALUES (?, ?, ?, ?)'
);
const insertImage = db.prepare(
    'INSERT INTO bike_images (bike_id, url, sort_order) VALUES (?, ?, ?)'
);
const insertSpec = db.prepare(
    'INSERT INTO bike_specs (bike_id, group_name, name, value, sort_order) VALUES (?, ?, ?, ?, ?)'
);
const insertReview = db.prepare(
    'INSERT INTO reviews (bike_id, author, rating, frame_size, usage_period, text, helpful_count) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

// транзакция: либо выполнится всё, либо ничего
db.exec('BEGIN');
try {
    // очищаем таблицы, чтобы скрипт можно было запускать повторно
    db.exec('DELETE FROM order_items; DELETE FROM orders; DELETE FROM bikes;');

    for (const bike of bikes) {
        const result = insertBike.run(
            bike.sku, bike.name, bike.brand, bike.type, bike.description, bike.price, bike.old_price,
            bike.wheel_size, bike.speeds, bike.gender, bike.age_group, bike.model_year, bike.weight,
            bike.rating, bike.reviews_count, bike.badge, bike.popularity
        );
        const bikeId = result.lastInsertRowid; // id, который база выдала новому велосипеду

        for (const size of bike.sizes) {
            insertSize.run(bikeId, size.frame_size, size.min_height, size.max_height, size.in_stock);
        }
        for (const color of bike.colors) {
            insertColor.run(bikeId, color.name, color.color_group, color.hex);
        }
        bike.images.forEach((url, index) => {
            insertImage.run(bikeId, url, index + 1);
        });
        bike.specs.forEach(([groupName, name, value], index) => {
            insertSpec.run(bikeId, groupName, name, value, index + 1);
        });
        for (const review of bike.reviews) {
            insertReview.run(bikeId, review.author, review.rating, review.frame_size,
                review.usage_period, review.text, review.helpful_count);
        }
    }

    db.exec('COMMIT');
    console.log(`Готово: добавлено велосипедов — ${bikes.length}`);
} catch (error) {
    db.exec('ROLLBACK');
    console.error('Ошибка, ничего не сохранено:', error.message);
}