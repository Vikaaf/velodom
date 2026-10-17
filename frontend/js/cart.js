// Корзина хранится в браузере (localStorage), пока пользователь не оформит заказ.
// Формат: [{ id: 1, qty: 2 }, ...]

const KEY = 'velodom-cart';

export function getCart() {
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}

function saveCart(cart) {
  localStorage.setItem(KEY, JSON.stringify(cart));
  updateCartCount();
}

export function addToCart(id) {
  const cart = getCart();
  const item = cart.find(entry => entry.id === id);
  if (item) {
    item.qty += 1;
  } else {
    cart.push({ id, qty: 1 });
  }
  saveCart(cart);
}

// число на кнопке «Корзина · N» в шапке
export function updateCartCount() {
  const count = getCart().reduce((sum, entry) => sum + entry.qty, 0);
  document.getElementById('cart-count').textContent = count;
}
