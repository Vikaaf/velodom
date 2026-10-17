// Простой роутер для SPA: смотрим на часть адреса после # и показываем нужную страницу.
// #/            → главная
// #/catalog     → каталог
// #/catalog?type=city&sort=price_asc → каталог с фильтрами
// #/bike/5      → карточка велосипеда с id 5

import { homePage } from './pages/home.js';
import { catalogPage } from './pages/catalog.js';
import { bikePage } from './pages/bike.js';
import { initQuiz } from './components/quiz.js';
import { addToCart, updateCartCount } from './cart.js';

const app = document.getElementById('app');

// пока страницы — заглушки, на следующих шагах заменим их настоящими
function stub(title, text) {
  return () => {
    app.innerHTML = `
      <section class="page-stub">
        <div class="container">
          <h1 class="section-title">${title}</h1>
          <p>${text}</p>
        </div>
      </section>
    `;
  };
}

const routes = [
  { path: /^\/$/, page: () => homePage(app) },
  { path: /^\/catalog$/, page: query => catalogPage(app, query) },
  {
    path: /^\/quiz$/,
    page: () => {
      app.innerHTML = '<section class="quiz"><div class="container" id="quiz-root"></div></section>';
      initQuiz(document.getElementById('quiz-root'));
    },
  },
  { path: /^\/bike\/(\d+)$/, page: id => bikePage(app, id) },
  { path: /^\/cart$/, page: stub('Корзина', 'Корзину сделаем на следующем этапе.') },
];

function router() {
  const hash = location.hash.slice(1) || '/';   // '#/catalog?type=city' → '/catalog?type=city'
  const [path, queryString] = hash.split('?');   // → '/catalog' и 'type=city'
  const query = new URLSearchParams(queryString);
  const route = routes.find(r => r.path.test(path));

  if (route) {
    const params = path.match(route.path).slice(1); // то, что в скобках регулярки, например id
    route.page(...params, query);                   // query — параметры после «?»
  } else {
    stub('Страница не найдена', 'Проверьте адрес или вернитесь на главную.')();
  }

  // подсвечиваем активный пункт меню
  document.querySelectorAll('.nav__link').forEach(link => {
    link.classList.toggle('nav__link--active', link.getAttribute('href') === '#' + path);
  });

  window.scrollTo(0, 0);
}

// кнопки «Добавить в корзину» есть на разных страницах, поэтому слушаем клики на всём документе
document.addEventListener('click', event => {
  const button = event.target.closest('[data-add-to-cart]');
  if (button) {
    addToCart(Number(button.dataset.addToCart));
    button.textContent = 'В корзине ✓';
  }
});

window.addEventListener('hashchange', router); // адрес после # поменялся → перерисовать
updateCartCount();
router();                                       // первый показ при загрузке
