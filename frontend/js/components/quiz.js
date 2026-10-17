import { matchBikes } from '../api.js';
import { bikeCard } from './bikeCard.js';
import { escapeHtml } from '../utils.js';

// Шаги опроса описаны данными: чтобы добавить вопрос, достаточно дописать объект в массив.
// key — поле в ответах, value — что отправится на сервер.
const STEPS = [
  {
    label: 'Рост и рама',
    question: 'Какой рост у велосипедиста?',
    key: 'height',
    options: [
      { title: 'до 150 см', text: 'рама XS, колёса 24 дюйма', value: { heightMin: 90, heightMax: 150 } },
      { title: '150–160 см', text: 'рама S, колёса 26 дюймов', value: { heightMin: 150, heightMax: 160 } },
      { title: '160–170 см', text: 'рама M, колёса 27,5 дюйма', value: { heightMin: 160, heightMax: 170 } },
      { title: '170–180 см', text: 'рама L, колёса 27,5–29 дюймов', value: { heightMin: 170, heightMax: 180 } },
      { title: '180 см и выше', text: 'рама XL, колёса 29 дюймов', value: { heightMin: 180, heightMax: 210 } },
    ],
  },
  {
    label: 'Стиль катания',
    question: 'Где будет проходить большинство поездок?',
    key: 'style',
    options: [
      { icon: '▦', title: 'Город и парки', text: 'ровный асфальт, короткие поездки', value: 'city' },
      { icon: '◈', title: 'Грунтовые дороги', text: 'лёгкое бездорожье, лесные тропы', value: 'gravel' },
      { icon: '▲', title: 'Горы и трейлы', text: 'спуски, подъёмы, пересечённая местность', value: 'mountain' },
      { icon: '━', title: 'Шоссе', text: 'скорость, ровная дорога', value: 'road' },
      { icon: '◆', title: 'Смешанный стиль', text: 'город плюс лёгкое бездорожье', value: 'mixed' },
    ],
  },
  {
    label: 'Цвет',
    question: 'Какой цвет велосипеда вам нравится?',
    key: 'color',
    compact: true,
    options: [
      { title: 'Без разницы', value: 'any' },
      { title: 'Чёрный', swatch: '#1E1E1E', value: 'black' },
      { title: 'Белый', swatch: '#F2F2F2', value: 'white' },
      { title: 'Синий', swatch: '#2456A6', value: 'blue' },
      { title: 'Красный', swatch: '#C62F2F', value: 'red' },
      { title: 'Зелёный', swatch: '#27A65A', value: 'green' },
      { title: 'Жёлтый', swatch: '#F2C230', value: 'yellow' },
      { title: 'Оранжевый', swatch: '#E9752B', value: 'orange' },
      { title: 'Розовый', swatch: '#E58BB0', value: 'pink' },
      { title: 'Серый', swatch: '#8A8F8C', value: 'gray' },
    ],
  },
  {
    label: 'Бюджет',
    question: 'Каков основной бюджет?',
    key: 'budget',
    budget: true, // особый шаг: поля ввода вместо карточек
  },
  {
    label: 'Пол',
    question: 'Для кого подбираем велосипед?',
    key: 'gender',
    options: [
      { title: 'Для женщины', text: 'подходит более широкое седло, укороченная рама и руль меньшей ширины', value: 'female' },
      { title: 'Для мужчины', text: 'подходит стандартное седло и классическая геометрия рамы', value: 'male' },
      { title: 'Не имеет значения', text: 'подойдёт универсальная геометрия и стандартное седло', value: 'any' },
    ],
  },
  {
    label: 'Возраст',
    question: 'Какого возраста велосипедист?',
    key: 'age',
    options: [
      { title: 'До 14 лет', text: 'лёгкая рама, ограничение по скорости', value: 'kids' },
      { title: '14–17 лет', text: 'облегчённая рама, универсальная геометрия', value: 'teen' },
      { title: '18 лет и старше', text: 'универсальная комплектация', value: 'adult' },
    ],
  },
];

const TOTAL = STEPS.length + 1; // +1 — шаг «Итог»

export function initQuiz(root) {
  // состояние опроса: номер шага и ответы
  const state = {
    step: 0,
    answers: { budget: { minPrice: 0, maxPrice: 60000, discount: 0 } },
  };

  function progress() {
    const labels = [...STEPS.map(s => s.label), 'Итог'];
    const percent = ((state.step + 1) / TOTAL) * 100;
    return `
      <div class="quiz__progress">
        <div class="quiz__bar"><div class="quiz__bar-fill" style="width: ${percent}%"></div></div>
        <ol class="quiz__stages">
          ${labels.map((label, i) => `
            <li class="${i < state.step ? 'is-done' : ''} ${i === state.step ? 'is-current' : ''}">${i + 1}. ${label}</li>
          `).join('')}
        </ol>
      </div>
    `;
  }

  function header(title, hint) {
    return `
      <div class="quiz__head">
        <div>
          <p class="quiz__step">ШАГ ${state.step + 1} ИЗ ${TOTAL}</p>
          <h2 class="section-title">${title}</h2>
        </div>
        <p class="quiz__hint">${hint}</p>
      </div>
    `;
  }

  function optionsHtml(step) {
    const selected = state.answers[step.key];
    return `
      <div class="quiz__options ${step.compact ? 'quiz__options--compact' : ''}">
        ${step.options.map((option, i) => {
          const isActive = JSON.stringify(selected) === JSON.stringify(option.value);
          return `
            <button class="quiz-option ${isActive ? 'is-active' : ''}" type="button" data-option="${i}">
              ${option.icon ? `<span class="quiz-option__icon">${option.icon}</span>` : ''}
              ${option.swatch ? `<span class="quiz-option__swatch" style="background: ${option.swatch}"></span>` : ''}
              <span class="quiz-option__title">${option.title}</span>
              ${option.text ? `<span class="quiz-option__text">${option.text}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  function budgetHtml() {
    const b = state.answers.budget;
    return `
      <div class="quiz-budget">
        <label class="quiz-budget__field">
          <span>Минимальная цена, ₽</span>
          <input class="input" type="number" min="0" step="1000" name="minPrice" value="${b.minPrice}">
        </label>
        <label class="quiz-budget__field">
          <span>Максимальная цена, ₽</span>
          <input class="input" type="number" min="0" step="1000" name="maxPrice" value="${b.maxPrice}">
        </label>
        <label class="quiz-budget__field">
          <span>Размер скидки от, %</span>
          <input class="input" type="number" min="0" max="90" step="5" name="discount" value="${b.discount}">
        </label>
      </div>
    `;
  }

  function render() {
    if (state.step === STEPS.length) {
      return renderResult();
    }
    const step = STEPS[state.step];
    const answered = step.budget || state.answers[step.key] !== undefined;
    const isLast = state.step === STEPS.length - 1;

    root.innerHTML = `
      ${header('Подбор велосипеда', 'Выбери подходящий вариант — остальные параметры тоже учтём в подборке.')}
      ${progress()}
      <div class="quiz__card">
        <h3 class="quiz__question">${step.question}</h3>
        ${step.budget ? budgetHtml() : optionsHtml(step)}
        <div class="quiz__controls">
          <button class="btn btn--outline" type="button" data-action="back" ${state.step === 0 ? 'disabled' : ''}>← Назад</button>
          <button class="btn btn--primary" type="button" data-action="next" ${answered ? '' : 'disabled'}>
            ${isLast ? 'Показать подборку' : 'Далее →'}
          </button>
        </div>
        <p class="quiz__note">На последнем шаге появится кнопка «Показать подборку»</p>
      </div>
    `;
  }

  async function renderResult() {
    root.innerHTML = `
      ${header('Рекомендуем начать с них', 'Все модели можно посмотреть в каталоге — кнопка «Каталог».')}
      ${progress()}
      <div class="quiz__card"><p class="quiz__loading">Подбираем велосипеды…</p></div>
    `;

    const { height, budget, ...rest } = state.answers;
    try {
      const bikes = await matchBikes({ ...height, ...budget, ...rest });
      const cards = bikes.length
        ? bikes.slice(0, 4).map(bike => bikeCard(bike, `
            <ul class="bike-card__reasons">
              ${bike.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}
            </ul>
          `)).join('')
        : '<p>Под эти ответы ничего не нашлось. Попробуйте изменить бюджет или посмотрите весь каталог.</p>';

      root.querySelector('.quiz__card').innerHTML = `
        <div class="bike-grid">${cards}</div>
        <div class="quiz__controls">
          <button class="btn btn--outline" type="button" data-action="restart">Пройти заново</button>
          <a class="btn btn--dark" href="#/catalog">Смотреть весь каталог →</a>
        </div>
        <p class="quiz__note">Чтобы пройти опрос заново, нажмите «Пройти заново».</p>
      `;
    } catch (error) {
      root.querySelector('.quiz__card').innerHTML =
        `<p>Не удалось получить подборку: ${escapeHtml(error.message)}</p>`;
    }
  }

  // Один обработчик на весь блок опроса (делегирование событий):
  // смотрим, по какому элементу кликнули, через closest()
  root.addEventListener('click', event => {
    const option = event.target.closest('[data-option]');
    if (option) {
      const step = STEPS[state.step];
      state.answers[step.key] = step.options[option.dataset.option].value;
      render();
      return;
    }

    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'next') state.step += 1;
    if (action === 'back') state.step -= 1;
    if (action === 'restart') {
      state.step = 0;
      state.answers = { budget: { minPrice: 0, maxPrice: 60000, discount: 0 } };
    }
    if (action) render();
  });

  // поля бюджета: сохраняем значение при каждом вводе
  root.addEventListener('input', event => {
    if (event.target.name) {
      state.answers.budget[event.target.name] = Number(event.target.value) || 0;
    }
  });

  render();
}
