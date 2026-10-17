import { formatPrice, escapeHtml, plural } from '../utils.js';

export const TYPE_NAMES = {
  city: 'Городской',
  mountain: 'Горный',
  road: 'Шоссейный',
  kids: 'Детский',
  hybrid: 'Гибрид',
};

// Бейдж на фото: «Хит» или «Новинка», а если их нет и есть старая цена — размер скидки
function badgeHtml(bike) {
  if (bike.badge === 'hit') return '<span class="bike-card__badge">Хит</span>';
  if (bike.badge === 'new') return '<span class="bike-card__badge">Новинка</span>';
  if (bike.old_price > bike.price) {
    const percent = Math.round((1 - bike.price / bike.old_price) * 100);
    return `<span class="bike-card__badge bike-card__badge--sale">−${percent}%</span>`;
  }
  return '';
}

// Карточка велосипеда из макета: фото, бренд и рейтинг, название, характеристики, цена, кнопка
export function bikeCard(bike, extra = '') {
  const specs = [
    TYPE_NAMES[bike.type],
    bike.frame_sizes ? `рама ${bike.frame_sizes}` : '',
    `${bike.speeds} ${plural(bike.speeds, ['скорость', 'скорости', 'скоростей'])}`,
    `${bike.wheel_size}″`,
  ].filter(Boolean).join(' · ');

  return `
    <article class="bike-card">
      <a class="bike-card__photo" href="#/bike/${bike.id}">
        <img src="${escapeHtml(bike.image)}" alt="${escapeHtml(bike.name)}" loading="lazy">
        ${badgeHtml(bike)}
      </a>
      <div class="bike-card__info">
        <div class="bike-card__meta">
          <span class="bike-card__brand">${escapeHtml(bike.brand)}</span>
          ${bike.rating ? `<span class="bike-card__rating">★ ${bike.rating}</span>` : ''}
        </div>
        <a class="bike-card__name" href="#/bike/${bike.id}">${escapeHtml(bike.name)}</a>
        <p class="bike-card__specs">${escapeHtml(specs)}</p>
        <p class="bike-card__price">
          ${formatPrice(bike.price)}
          ${bike.old_price ? `<s>${formatPrice(bike.old_price)}</s>` : ''}
        </p>
        ${extra}
      </div>
      <button class="btn btn--primary bike-card__btn" type="button" data-add-to-cart="${bike.id}">
        Добавить в корзину
      </button>
    </article>
  `;
}
