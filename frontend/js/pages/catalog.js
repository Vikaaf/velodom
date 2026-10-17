// Каталог: поиск, сортировка, панель фильтров, чипы выбранных фильтров,
// сетка карточек, «Показать ещё» и пустая выдача.
// Выбранные фильтры хранятся в адресе (#/catalog?type=city&sort=price_asc),
// поэтому ссылкой на подборку можно поделиться, а после обновления страницы фильтры не теряются.

import { getBikes, getFilters } from '../api.js';
import { bikeCard, TYPE_NAMES } from '../components/bikeCard.js';
import { formatPrice, escapeHtml, plural } from '../utils.js';

const PAGE_SIZE = 12;

// иконка лупы; цвет берёт из CSS-свойства color (currentColor)
const searchIcon = size => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7"></circle>
    <path d="m20 20-4-4"></path>
  </svg>
`;

const SORTS = {
  popular: 'По популярности',
  price_asc: 'Цена: по возрастанию',
  price_desc: 'Цена: по убыванию',
  new: 'По новизне',
  rating: 'По рейтингу',
};

const GENDERS = { male: 'Мужской', female: 'Женский', unisex: 'Унисекс' };
const AGES = { adult: 'Взрослый', teen: 'Подростковый', kids: 'Детский' };

// фильтры-списки (можно отметить несколько галочек); ключ совпадает с параметром API
const LIST_KEYS = ['type', 'frame', 'brand', 'gender', 'age'];

// название варианта для чипа: 'city' → 'Городской', 'M' → 'Рама M'
function optionLabel(key, value) {
  if (key === 'type') return TYPE_NAMES[value];
  if (key === 'gender') return GENDERS[value];
  if (key === 'age') return AGES[value];
  if (key === 'frame') return `Рама ${value}`;
  return value; // бренд показываем как есть
}

// ===== Состояние фильтров ⇄ адрес страницы =====

function emptyState() {
  return {
    type: [], frame: [], brand: [], gender: [], age: [],
    minPrice: '', maxPrice: '', inStock: false, discount: false,
    search: '', sort: 'popular',
  };
}

// из адреса (?type=city,hybrid&maxPrice=50000) в объект состояния
function stateFromQuery(query) {
  const state = emptyState();
  for (const key of LIST_KEYS) {
    state[key] = query.get(key) ? query.get(key).split(',') : [];
  }
  state.minPrice = query.get('minPrice') || '';
  state.maxPrice = query.get('maxPrice') || '';
  state.inStock = query.get('inStock') === '1';
  state.discount = query.get('discount') === '1';
  state.search = query.get('search') || '';
  state.sort = SORTS[query.get('sort')] ? query.get('sort') : 'popular';
  return state;
}

// из объекта состояния в параметры для API и адреса; пустые значения не добавляем
function stateToParams(state) {
  const params = {};
  for (const key of LIST_KEYS) {
    if (state[key].length) params[key] = state[key].join(',');
  }
  if (state.minPrice) params.minPrice = state.minPrice;
  if (state.maxPrice) params.maxPrice = state.maxPrice;
  if (state.inStock) params.inStock = '1';
  if (state.discount) params.discount = '1';
  if (state.search) params.search = state.search;
  if (state.sort !== 'popular') params.sort = state.sort;
  return params;
}

// ===== Разметка =====

function checkbox(name, value, label, checked) {
  return `
    <label class="check">
      <input type="checkbox" name="${name}" value="${escapeHtml(value)}" ${checked ? 'checked' : ''}>
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

// секция фильтра; <details> умеет сворачиваться сам, без JavaScript
function filterSection(title, content, bodyClass = '') {
  return `
    <details class="filter" open>
      <summary class="filter__title">${title}</summary>
      <div class="filter__body ${bodyClass}">${content}</div>
    </details>
  `;
}

function listSection(title, key, labels, state, bodyClass) {
  const boxes = Object.entries(labels)
    .map(([value, label]) => checkbox(key, value, label, state[key].includes(value)))
    .join('');
  return filterSection(title, boxes, bodyClass);
}

// панель фильтров — это <form>: значения галочек потом соберём через FormData
function filtersForm(options, state) {
  const asLabels = list => Object.fromEntries(list.map(item => [item, item])); // ['M'] → { M: 'M' }

  return `
    <form class="filters" id="filters-form">
      ${listSection('Тип', 'type', TYPE_NAMES, state)}
      ${filterSection('Цена', `
        <div class="filter__price">
          <input class="input" type="number" name="minPrice" min="0" step="1000"
                 placeholder="от ${options.minPrice}" value="${escapeHtml(state.minPrice)}">
          <input class="input" type="number" name="maxPrice" min="0" step="1000"
                 placeholder="до ${options.maxPrice}" value="${escapeHtml(state.maxPrice)}">
        </div>
      `)}
      ${listSection('Рама', 'frame', asLabels(options.frames), state, 'filter__body--cols')}
      ${listSection('Бренд', 'brand', asLabels(options.brands), state)}
      ${listSection('Пол', 'gender', GENDERS, state)}
      ${listSection('Возраст', 'age', AGES, state)}
      ${filterSection('Наличие', checkbox('inStock', '1', 'В наличии', state.inStock))}
      ${filterSection('Скидка', checkbox('discount', '1', 'Только со скидкой', state.discount))}
      <div class="filters__actions">
        <button class="btn btn--primary btn--small" type="submit">Применить</button>
        <button class="btn btn--outline btn--small" type="button" data-action="reset">Сбросить</button>
      </div>
    </form>
  `;
}

// чипы «Горный ×», «Рама M ×», «До 80 000 ₽ ×» — по клику фильтр снимается
function chipsHtml(state) {
  const chips = [];
  for (const key of LIST_KEYS) {
    for (const value of state[key]) {
      chips.push({ label: optionLabel(key, value), remove: `${key}:${value}` });
    }
  }
  if (state.minPrice) chips.push({ label: `От ${formatPrice(Number(state.minPrice))}`, remove: 'minPrice' });
  if (state.maxPrice) chips.push({ label: `До ${formatPrice(Number(state.maxPrice))}`, remove: 'maxPrice' });
  if (state.inStock) chips.push({ label: 'В наличии', remove: 'inStock' });
  if (state.discount) chips.push({ label: 'Со скидкой', remove: 'discount' });
  if (state.search) chips.push({ label: `«${state.search}»`, remove: 'search' });

  return chips
    .map(chip => `
      <button class="chip" type="button" data-remove="${escapeHtml(chip.remove)}">
        ${escapeHtml(chip.label)} <span aria-hidden="true">×</span>
      </button>
    `)
    .join('');
}

const EMPTY_HTML = `
  <div class="empty">
    <div class="empty__icon">${searchIcon(34)}</div>
    <h2 class="empty__title">Ничего не найдено</h2>
    <p class="empty__text">Попробуйте изменить фильтры</p>
    <button class="btn btn--primary btn--small" type="button" data-action="reset">Сбросить фильтры</button>
  </div>
`;

// ===== Страница =====

export async function catalogPage(app, query) {
  let state = stateFromQuery(query);
  let options = null;    // варианты фильтров с сервера
  let loaded = 0;        // сколько карточек уже показано
  let lastRequest = 0;   // номер последнего запроса, чтобы не показать устаревший ответ
  let searchTimer = null;

  app.innerHTML = `
    <section class="catalog">
      <div class="container">
        <p class="breadcrumbs"><a href="#/">Главная</a> — Каталог</p>
        <div class="catalog__head">
          <div>
            <h1 class="catalog__title">Каталог велосипедов</h1>
            <p class="catalog__subtitle">Выберите модель по типу, цене, размеру рамы и бренду</p>
          </div>
          <p class="catalog__count" id="catalog-count"></p>
        </div>

        <div class="toolbar">
          <label class="toolbar__search">
            ${searchIcon(18)}
            <input type="search" id="catalog-search" placeholder="Найти велосипед или бренд"
                   value="${escapeHtml(state.search)}">
          </label>
          <select class="toolbar__sort" id="catalog-sort">
            ${Object.entries(SORTS)
              .map(([value, label]) => `<option value="${value}" ${value === state.sort ? 'selected' : ''}>${label}</option>`)
              .join('')}
          </select>
          <button class="btn btn--outline btn--small" type="button" data-action="toggle-filters">Фильтры</button>
        </div>

        <div class="chips" id="catalog-chips"></div>
        <div id="catalog-filters"></div>
        <div id="catalog-results"></div>
      </div>
    </section>
  `;

  const countEl = app.querySelector('#catalog-count');
  const chipsEl = app.querySelector('#catalog-chips');
  const filtersEl = app.querySelector('#catalog-filters');
  const resultsEl = app.querySelector('#catalog-results');

  function renderFilters() {
    filtersEl.innerHTML = options ? filtersForm(options, state) : '';
  }

  // загрузить велосипеды: append = false — заменить список, true — дописать следующую порцию
  async function loadBikes(append = false) {
    const requestId = ++lastRequest;
    const offset = append ? loaded : 0;

    try {
      const { total, bikes } = await getBikes({ ...stateToParams(state), limit: PAGE_SIZE, offset });
      if (requestId !== lastRequest) return; // пока ждали ответ, пользователь изменил фильтры

      countEl.textContent = `Найдено ${total} ${plural(total, ['велосипед', 'велосипеда', 'велосипедов'])}`;

      if (total === 0) {
        loaded = 0;
        resultsEl.innerHTML = EMPTY_HTML;
        return;
      }

      const cards = bikes.map(bike => bikeCard(bike)).join('');
      if (append) {
        resultsEl.querySelector('.catalog__grid').insertAdjacentHTML('beforeend', cards);
        loaded += bikes.length;
      } else {
        resultsEl.innerHTML = `
          <div class="bike-grid catalog__grid">${cards}</div>
          <button class="btn btn--outline catalog__more" type="button" data-action="more">Показать ещё</button>
        `;
        loaded = bikes.length;
      }
      // кнопку «Показать ещё» прячем, когда показали всё
      resultsEl.querySelector('.catalog__more').hidden = loaded >= total;
    } catch (error) {
      resultsEl.innerHTML = '<p>Не удалось загрузить каталог. Проверьте, что сервер запущен.</p>';
    }
  }

  // применить текущее состояние: обновить адрес, чипы и список
  function apply() {
    const params = new URLSearchParams(stateToParams(state)).toString();
    // replaceState меняет адрес без события hashchange, поэтому страница не перерисуется целиком
    history.replaceState(null, '', '#/catalog' + (params ? '?' + params : ''));
    chipsEl.innerHTML = chipsHtml(state);
    loadBikes();
  }

  // ----- события -----

  // «Применить»: собираем отмеченное в форме
  filtersEl.addEventListener('submit', event => {
    event.preventDefault(); // иначе браузер отправит форму и перезагрузит страницу
    const data = new FormData(event.target);
    for (const key of LIST_KEYS) {
      state[key] = data.getAll(key); // все отмеченные галочки с этим name
    }
    state.minPrice = data.get('minPrice');
    state.maxPrice = data.get('maxPrice');
    state.inStock = data.has('inStock');
    state.discount = data.has('discount');
    apply();
  });

  // поиск срабатывает, когда пользователь перестал печатать на 400 мс (debounce),
  // чтобы не отправлять запрос на каждую букву
  app.querySelector('#catalog-search').addEventListener('input', event => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = event.target.value.trim();
      apply();
    }, 400);
  });

  app.querySelector('#catalog-sort').addEventListener('change', event => {
    state.sort = event.target.value;
    apply();
  });

  // все кнопки страницы обрабатываем одним слушателем (делегирование)
  app.querySelector('.catalog').addEventListener('click', event => {
    const chip = event.target.closest('[data-remove]');
    if (chip) {
      const [key, value] = chip.dataset.remove.split(':');
      if (LIST_KEYS.includes(key)) {
        state[key] = state[key].filter(item => item !== value);
      } else {
        state[key] = emptyState()[key]; // вернуть значение по умолчанию
      }
      if (key === 'search') app.querySelector('#catalog-search').value = '';
      renderFilters(); // снять галочку и в панели
      apply();
      return;
    }

    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'reset') {
      state = { ...emptyState(), sort: state.sort };
      app.querySelector('#catalog-search').value = '';
      renderFilters();
      apply();
    } else if (action === 'more') {
      loadBikes(true);
    } else if (action === 'toggle-filters') {
      filtersEl.hidden = !filtersEl.hidden;
    }
  });

  chipsEl.innerHTML = chipsHtml(state);
  loadBikes();

  try {
    options = await getFilters();
    renderFilters();
  } catch (error) {
    filtersEl.innerHTML = '<p>Не удалось загрузить фильтры.</p>';
  }
}
