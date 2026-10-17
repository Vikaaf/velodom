// Страница товара: галерея, выбор размера и цвета, количество, характеристики,
// доставка, отзывы и похожие велосипеды. Данные — из GET /api/bikes/:id.

import { getBike, getBikes } from '../api.js';
import { bikeCard, TYPE_NAMES } from '../components/bikeCard.js';
import { addToCart } from '../cart.js';
import { formatPrice, escapeHtml, plural } from '../utils.js';

const TYPE_PLURAL = {
  city: 'Городские велосипеды',
  mountain: 'Горные велосипеды',
  road: 'Шоссейные велосипеды',
  kids: 'Детские велосипеды',
  hybrid: 'Гибриды',
};

const DELIVERY = [
  ['Курьером', 'Москва и область — от 690 ₽. Ближайшая дата: завтра, 10:00–14:00. Подъём и проверка посадки.'],
  ['Самовывоз', 'Бесплатно из 4 магазинов. Забронируем модель на 3 дня и поможем настроить высоту седла.'],
  ['По России', 'Транспортной компанией от 1 490 ₽. Усиленная упаковка и страхование уже включены.'],
  ['Оплата', 'Картой онлайн, СБП или при получении. Рассрочка без переплаты на 6 месяцев.'],
];

// 4.6 → «★★★★★», 3.4 → «★★★☆☆»
function stars(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function sectionHead(title, text) {
  return `
    <div class="section-head">
      <h2 class="section-title product-section__title">${title}</h2>
      <p>${text}</p>
    </div>
  `;
}

// ===== Блоки страницы =====

function galleryHtml(bike) {
  const badge = bike.badge === 'hit' ? 'Хит' : bike.badge === 'new' ? 'Новинка' : '';
  // миниатюры нужны, только если фото больше одного
  const thumbs = bike.images.length > 1
    ? `<div class="gallery__thumbs">
        ${bike.images.map((url, index) => `
          <button class="gallery__thumb ${index === 0 ? 'is-active' : ''}" type="button" data-image="${escapeHtml(url)}">
            <img src="${escapeHtml(url)}" alt="">
          </button>
        `).join('')}
      </div>`
    : '';

  return `
    <div class="gallery">
      ${thumbs}
      <div class="gallery__main">
        <img id="gallery-main" src="${escapeHtml(bike.images[0] || '')}" alt="${escapeHtml(bike.name)}">
        ${badge ? `<span class="gallery__badge">${badge}</span>` : ''}
      </div>
    </div>
  `;
}

function sizesHtml(bike, selected) {
  return bike.sizes.map(size => `
    <button class="option-btn ${size.frame_size === selected.frame_size ? 'is-active' : ''}"
            type="button" data-size="${escapeHtml(size.frame_size)}" ${size.in_stock ? '' : 'disabled'}
            title="${size.in_stock ? '' : 'Нет в наличии'}">
      ${escapeHtml(size.frame_size)}
    </button>
  `).join('');
}

function colorsHtml(bike, selected) {
  return bike.colors.map(color => `
    <button class="swatch ${color.name === selected.name ? 'is-active' : ''}" type="button"
            data-color="${escapeHtml(color.name)}" title="${escapeHtml(color.name)}"
            style="background: ${escapeHtml(color.hex)}"></button>
  `).join('');
}

function buyHtml(bike, state) {
  const inStock = bike.sizes.some(size => size.in_stock);
  const discount = bike.old_price > bike.price ? Math.round((1 - bike.price / bike.old_price) * 100) : 0;

  return `
    <div class="buy">
      <div class="buy__row buy__muted">
        <span class="buy__brand">${escapeHtml(bike.brand)}</span>
        <span>Арт. ${escapeHtml(bike.sku)}</span>
      </div>
      <h1 class="buy__title">${escapeHtml(bike.name)}</h1>
      <div class="buy__row">
        <a class="buy__rating" href="#reviews" data-scroll="reviews">
          <span class="stars">${stars(bike.rating)}</span>
          <b>${bike.rating}</b>
          <span class="buy__muted">${bike.reviews_count} ${plural(bike.reviews_count, ['отзыв', 'отзыва', 'отзывов'])}</span>
        </a>
        <span class="buy__stock ${inStock ? '' : 'buy__stock--out'}">● ${inStock ? 'В наличии' : 'Нет в наличии'}</span>
      </div>
      <p class="buy__description">${escapeHtml(bike.description)}</p>

      <div class="buy__prices">
        <span class="buy__price">${formatPrice(bike.price)}</span>
        ${discount ? `<s>${formatPrice(bike.old_price)}</s><span class="buy__discount">−${discount}%</span>` : ''}
      </div>

      <div class="buy__group">
        <div class="buy__row">
          <b>Размер рамы</b>
          <a class="buy__link" href="#/quiz">Как выбрать размер?</a>
        </div>
        <div class="buy__options" id="size-options">${sizesHtml(bike, state.size)}</div>
        <p class="buy__muted" id="size-hint"></p>
      </div>

      ${bike.colors.length ? `
        <div class="buy__group">
          <b id="color-name"></b>
          <div class="buy__options" id="color-options">${colorsHtml(bike, state.color)}</div>
        </div>
      ` : ''}

      <div class="buy__actions">
        <div class="qty">
          <button type="button" data-qty="-1" aria-label="Меньше">−</button>
          <span id="qty-value">1</span>
          <button type="button" data-qty="1" aria-label="Больше">+</button>
        </div>
        <button class="btn btn--primary buy__cart" type="button" data-action="buy" ${inStock ? '' : 'disabled'}>
          Добавить в корзину
        </button>
      </div>

      <dl class="terms">
        <div><dt>Доставка</dt><dd>Завтра по Москве — 690 ₽</dd></div>
        <div><dt>Самовывоз</dt><dd>Сегодня из 4 магазинов — бесплатно</dd></div>
        <div><dt>Гарантия</dt><dd>2 года на оборудование, 5 лет на раму</dd></div>
        <div><dt>Возврат</dt><dd>14 дней при сохранении товарного вида</dd></div>
      </dl>
    </div>
  `;
}

// плитки «29″ — Уверенный накат» собираем из полей велосипеда
function highlightsHtml(bike) {
  const items = [
    [`${bike.wheel_size}″`, 'Колёса', bike.wheel_size >= 27.5 ? 'Легче проходят неровности и держат скорость.' : 'Манёвренные и лёгкие в управлении.'],
    [bike.speeds, 'Скорости', bike.speeds > 1 ? 'Подходящая передача для подъёма и разгона.' : 'Простая надёжная конструкция без переключателей.'],
    [`${String(bike.weight).replace('.', ',')} кг`, 'Вес', 'Велосипед легко поднять по лестнице и погрузить в машину.'],
    [bike.model_year, 'Модельный год', 'Актуальная модель с официальной гарантией.'],
  ];
  return items.map(([value, title, text]) => `
    <div class="highlight">
      <span class="highlight__value">${escapeHtml(value)}</span>
      <div><b>${escapeHtml(title)}</b><p>${escapeHtml(text)}</p></div>
    </div>
  `).join('');
}

// характеристики приходят списком строк — группируем их по group_name
function specsHtml(specs) {
  const groups = {};
  for (const spec of specs) {
    groups[spec.group_name] ??= []; // если группы ещё нет — создаём пустой массив
    groups[spec.group_name].push(spec);
  }
  return Object.entries(groups).map(([groupName, rows]) => `
    <div class="spec-group">
      <h3>${escapeHtml(groupName)}</h3>
      <dl>
        ${rows.map(row => `
          <div><dt>${escapeHtml(row.name)}</dt><dd>${escapeHtml(row.value)}</dd></div>
        `).join('')}
      </dl>
    </div>
  `).join('');
}

function reviewsHtml(bike) {
  const cards = bike.reviews.map(review => `
    <article class="review">
      <div class="review__head">
        <b>${escapeHtml(review.author)}</b>
        <span class="stars">${stars(review.rating)}</span>
      </div>
      <p class="buy__muted">Размер ${escapeHtml(review.frame_size)} · ${escapeHtml(review.usage_period)}</p>
      <p>${escapeHtml(review.text)}</p>
      <p class="buy__muted">Полезный отзыв · Да ${review.helpful_count}</p>
    </article>
  `).join('');

  return `
    <div class="reviews">
      <div class="reviews__summary">
        <span class="reviews__score">${bike.rating}</span>
        <span class="stars">${stars(bike.rating)}</span>
        <p class="buy__muted">На основе ${bike.reviews_count} ${plural(bike.reviews_count, ['отзыва', 'отзывов', 'отзывов'])}</p>
      </div>
      ${cards || '<p class="buy__muted">Отзывов пока нет. Станьте первым!</p>'}
    </div>
  `;
}

// ===== Страница =====

export async function bikePage(app, id) {
  app.innerHTML = '<section class="container product-loading"><p>Загружаем велосипед…</p></section>';

  let bike;
  try {
    bike = await getBike(id);
  } catch (error) {
    app.innerHTML = `
      <section class="container product-loading">
        <h1 class="section-title">Велосипед не найден</h1>
        <p><a class="buy__link" href="#/catalog">Вернуться в каталог</a></p>
      </section>
    `;
    return;
  }

  // что выбрал пользователь: по умолчанию первый размер в наличии и первый цвет
  const state = {
    size: bike.sizes.find(size => size.in_stock) || bike.sizes[0] || {},
    color: bike.colors[0] || {},
    qty: 1,
  };

  // всё оборачиваем в .product: при переходе на другую страницу этот элемент удалится
  // вместе со своими обработчиками событий
  app.innerHTML = `
    <div class="product">
    <section class="product-top">
      <div class="container">
        <p class="breadcrumbs">
          <a href="#/">Главная</a> — <a href="#/catalog">Каталог</a> —
          <a href="#/catalog?type=${bike.type}">${TYPE_PLURAL[bike.type]}</a> — ${escapeHtml(bike.name)}
        </p>
        <nav class="anchors">
          <a href="#description" data-scroll="description">Описание</a>
          <a href="#specs" data-scroll="specs">Характеристики</a>
          <a href="#delivery" data-scroll="delivery">Доставка</a>
          <a href="#reviews" data-scroll="reviews">Отзывы</a>
        </nav>
        <div class="product-main">
          ${galleryHtml(bike)}
          ${buyHtml(bike, state)}
        </div>
      </div>
    </section>

    <section class="product-section" id="description">
      <div class="container">
        ${sectionHead('Описание', `${TYPE_NAMES[bike.type]} велосипед ${escapeHtml(bike.brand)}, ${bike.model_year} год.`)}
        <div class="description">
          <div class="description__story">
            <h3>${escapeHtml(bike.name)}</h3>
            <p>${escapeHtml(bike.description)}</p>
            <p>Перед отправкой механик собирает велосипед, настраивает тормоза и переключатели, проверяет затяжку и давление в шинах.</p>
          </div>
          <div class="description__highlights">${highlightsHtml(bike)}</div>
        </div>
      </div>
    </section>

    <section class="product-section product-section--tinted" id="specs">
      <div class="container">
        ${sectionHead('Характеристики', 'Комплектация может незначительно меняться производителем без ухудшения потребительских свойств.')}
        <div class="specs">${specsHtml(bike.specs)}</div>
      </div>
    </section>

    <section class="product-section product-section--white" id="delivery">
      <div class="container">
        ${sectionHead('Доставка и оплата', 'Выберите удобный способ — мы привезём велосипед собранным и настроенным.')}
        <div class="delivery">
          ${DELIVERY.map(([title, text], index) => `
            <div class="info-card">
              <span class="info-card__num">0${index + 1}</span>
              <h3>${title}</h3>
              <p>${text}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section class="product-section" id="reviews">
      <div class="container">
        ${sectionHead('Отзывы покупателей', `${bike.rating} из 5 · ${bike.reviews_count} ${plural(bike.reviews_count, ['отзыв', 'отзыва', 'отзывов'])}`)}
        ${reviewsHtml(bike)}
      </div>
    </section>

    <section class="product-section product-section--tinted">
      <div class="container">
        ${sectionHead('Похожие велосипеды', 'Модели того же типа, которые тоже стоит посмотреть.')}
        <div class="bike-grid" id="similar-grid"></div>
      </div>
    </section>
    </div>
  `;

  // ----- обновление выбранного размера, цвета, количества -----

  function renderSelection() {
    app.querySelector('#size-options').innerHTML = sizesHtml(bike, state.size);
    app.querySelector('#size-hint').textContent = state.size.frame_size
      ? `${state.size.frame_size} · подходит для роста ${state.size.min_height}–${state.size.max_height} см`
      : '';
    if (bike.colors.length) {
      app.querySelector('#color-options').innerHTML = colorsHtml(bike, state.color);
      app.querySelector('#color-name').textContent = `Цвет: ${state.color.name}`;
    }
    app.querySelector('#qty-value').textContent = state.qty;
    // выбор поменялся — снова предлагаем добавить в корзину
    const buyButton = app.querySelector('[data-action="buy"]');
    if (!buyButton.disabled) buyButton.textContent = 'Добавить в корзину';
  }

  renderSelection();

  // все клики страницы — одним обработчиком (делегирование)
  app.querySelector('.product').addEventListener('click', event => {
    const target = event.target;

    const sizeBtn = target.closest('[data-size]');
    if (sizeBtn) {
      state.size = bike.sizes.find(size => size.frame_size === sizeBtn.dataset.size);
      renderSelection();
    }

    const colorBtn = target.closest('[data-color]');
    if (colorBtn) {
      state.color = bike.colors.find(color => color.name === colorBtn.dataset.color);
      renderSelection();
    }

    const qtyBtn = target.closest('[data-qty]');
    if (qtyBtn) {
      state.qty = Math.min(10, Math.max(1, state.qty + Number(qtyBtn.dataset.qty))); // от 1 до 10
      renderSelection();
    }

    const thumb = target.closest('[data-image]');
    if (thumb) {
      app.querySelector('#gallery-main').src = thumb.dataset.image;
      app.querySelectorAll('.gallery__thumb').forEach(item => item.classList.toggle('is-active', item === thumb));
    }

    const scrollLink = target.closest('[data-scroll]');
    if (scrollLink) {
      event.preventDefault(); // не меняем адрес, иначе роутер решит, что это другая страница
      document.getElementById(scrollLink.dataset.scroll).scrollIntoView({ behavior: 'smooth' });
    }

    if (target.closest('[data-action="buy"]')) {
      addToCart(bike.id, { size: state.size.frame_size, color: state.color.name ?? null, qty: state.qty });
      target.closest('[data-action="buy"]').textContent = 'Добавлено в корзину ✓';
    }
  });

  // похожие: тот же тип, без текущего велосипеда
  try {
    const { bikes } = await getBikes({ type: bike.type, limit: 5 });
    const similar = bikes.filter(item => item.id !== bike.id).slice(0, 4);
    app.querySelector('#similar-grid').innerHTML = similar.length
      ? similar.map(item => bikeCard(item)).join('')
      : '<p class="buy__muted">Других моделей этого типа пока нет.</p>';
  } catch (error) {
    app.querySelector('#similar-grid').innerHTML = '';
  }
}
