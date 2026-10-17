// Корзина хранится в браузере (localStorage), пока пользователь не оформит заказ.
// Формат: [{ id: 1, size: 'M', color: 'чёрный', qty: 2 }, ...]
// size и color могут быть null, если товар добавили из каталога без выбора.

const KEY = 'velodom-cart';

export function getCart() {
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(KEY, JSON.stringify(cart));
  updateCartCount();
}

// один и тот же велосипед разного размера или цвета — это разные строки корзины
export function addToCart(id, { size = null, color = null, qty = 1 } = {}) {
  const cart = getCart();
  const item = cart.find(entry => entry.id === id && entry.size === size && entry.color === color);
  if (item) {
    item.qty += qty;
  } else {
    cart.push({ id, size, color, qty });
  }
  saveCart(cart);
}

// число на кнопке «Корзина · N» в шапке
export function updateCartCount() {
  const count = getCart().reduce((sum, entry) => sum + entry.qty, 0);
  document.getElementById('cart-count').textContent = count;
}
