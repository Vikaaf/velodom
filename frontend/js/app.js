// Простой роутер для SPA: смотрим на часть адреса после # и показываем нужную страницу.
// #/            → главная
// #/catalog     → каталог
// #/bike/5      → карточка велосипеда с id 5

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
    { path: /^\/$/, page: stub('Главная', 'Здесь будет первый экран, опрос и популярные велосипеды.') },
    { path: /^\/catalog$/, page: stub('Каталог', 'Здесь будет каталог с фильтрами.') },
    { path: /^\/quiz$/, page: stub('Опрос', 'Здесь будет опрос.') },
    { path: /^\/bike\/(\d+)$/, page: stub('Велосипед', 'Здесь будет карточка товара.') },
    { path: /^\/cart$/, page: stub('Корзина', 'Корзину сделаем на следующем этапе.') },
];

function router() {
    const path = location.hash.slice(1) || '/';   // '#/catalog' → '/catalog'
    const route = routes.find(r => r.path.test(path));

    if (route) {
        const params = path.match(route.path).slice(1); // то, что в скобках регулярки, например id
        route.page(...params);
    } else {
        stub('Страница не найдена', 'Проверьте адрес или вернитесь на главную.')();
    }

    // подсвечиваем активный пункт меню
    document.querySelectorAll('.nav__link').forEach(link => {
        link.classList.toggle('nav__link--active', link.getAttribute('href') === '#' + path);
    });

    window.scrollTo(0, 0);
}

window.addEventListener('hashchange', router); // адрес после # поменялся → перерисовать
router();                                       // первый показ при загрузке
