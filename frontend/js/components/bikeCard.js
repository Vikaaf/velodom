import { formatPrice, escapeHtml, plural } from '../utils.js';

const TYPE_NAMES = {
  city: 'Городской',
  mountain: 'Горный',
  road: 'Шоссейный',
  kids: 'Детский',
  hybrid: 'Гибрид',
};

// Карточка велосипеда из макета: фото, название, характеристики, цена, кнопка
export function bikeCard(bike, extra = '') {
  const specs = [
    `${bike.wheel_size}″`,
    bike.frame_sizes ? `рама ${bike.frame_sizes}` : TYPE_NAMES[bike.type],
    `${bike.speeds} ${plural(bike.speeds, ['скорость', 'скорости', 'скоростей'])}`,
  ].join(' · ');

  const badge = bike.badge === 'hit' ? 'Хит' : bike.badge === 'new' ? 'Новинка' : '';

  return `
    <article class="bike-card">
      <a class="bike-card__photo" href="#/bike/${bike.id}">
        <img src="${escapeHtml(bike.image)}" alt="${escapeHtml(bike.name)}" loading="lazy">
        ${badge ? `<span class="bike-card__badge">${badge}</span>` : ''}
      </a>
      <div class="bike-card__info">
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
