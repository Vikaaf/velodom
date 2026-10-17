import { getBikes } from '../api.js';
import { bikeCard } from '../components/bikeCard.js';
import { initQuiz } from '../components/quiz.js';

export async function homePage(app) {
  app.innerHTML = `
    <section class="hero">
      <div class="container">
        <div class="hero__box">
          <div class="hero__offer">
            <span class="hero__label">ПЕРСОНАЛЬНЫЙ ПОДБОР</span>
            <h1 class="hero__title">Подбери велосипед за&nbsp;2&nbsp;минуты</h1>
            <p class="hero__subtitle">Ответь на несколько вопросов и получи персональную подборку</p>
            <div class="hero__actions">
              <a class="btn btn--primary btn--large" href="#quiz" data-scroll="quiz">Пройти опрос →</a>
              <span class="hero__hint">Бесплатно · без регистрации</span>
            </div>
          </div>
          <img class="hero__photo" src="/images/hero.jpg" alt="Велосипедистка на лесной дороге">
        </div>
      </div>
    </section>

    <section class="trust">
      <div class="container trust__list">
        <div class="trust__item"><span class="trust__icon">✓</span><div><b>Гарантия 2 года</b><span>Официальная гарантия</span></div></div>
        <div class="trust__item"><span class="trust__icon">✓</span><div><b>Доставка от 1 дня</b><span>По всей России</span></div></div>
        <div class="trust__item"><span class="trust__icon">✓</span><div><b>Возврат 14 дней</b><span>Без лишних вопросов</span></div></div>
        <div class="trust__item"><span class="trust__icon">✓</span><div><b>Живая поддержка</b><span>Поможем до и после покупки</span></div></div>
      </div>
    </section>

    <section class="how">
      <div class="container">
        <h2 class="section-title">Как это работает</h2>
        <div class="how__steps">
          <div class="info-card"><span class="info-card__num">01</span><h3>Пройди опрос</h3><p>Шесть простых вопросов о росте, стиле катания и бюджете.</p></div>
          <div class="info-card"><span class="info-card__num">02</span><h3>Получи подборку</h3><p>Покажем подходящие модели и объясним разницу.</p></div>
          <div class="info-card"><span class="info-card__num">03</span><h3>Оформи заказ</h3><p>Доставим настроенный велосипед в удобный день.</p></div>
        </div>
      </div>
    </section>

    <section class="quiz" id="quiz">
      <div class="container" id="quiz-root"></div>
    </section>

    <section class="popular">
      <div class="container">
        <div class="section-head">
          <h2 class="section-title">Популярные велосипеды</h2>
          <p>Фильтруй модели по параметрам или открой полный каталог.</p>
        </div>
        <div class="bike-grid" id="popular-grid"><p>Загружаем…</p></div>
        <a class="btn btn--dark btn--large" href="#/catalog">Смотреть весь каталог →</a>
      </div>
    </section>

    <section class="cta">
      <div class="container cta__inner">
        <div>
          <h2 class="cta__title">Твой велосипед уже где-то рядом</h2>
          <p>Ответь на вопросы — мы сузим выбор до нескольких точных вариантов.</p>
        </div>
        <a class="btn btn--white btn--large" href="#quiz" data-scroll="quiz">Вернуться к опросу ↑</a>
      </div>
    </section>
  `;

  initQuiz(document.getElementById('quiz-root'));

  // кнопки «Пройти опрос» плавно прокручивают к блоку опроса
  app.querySelectorAll('[data-scroll]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault(); // не меняем адрес после #, иначе роутер решит, что это другая страница
      document.getElementById(link.dataset.scroll).scrollIntoView({ behavior: 'smooth' });
    });
  });

  const grid = document.getElementById('popular-grid');
  try {
    const { bikes } = await getBikes({ sort: 'popular', limit: 4 });
    grid.innerHTML = bikes.map(bike => bikeCard(bike)).join('');
  } catch (error) {
    grid.innerHTML = '<p>Не удалось загрузить велосипеды. Проверьте, что сервер запущен.</p>';
  }
}
