// Все запросы к нашему серверу в одном месте.
// fetch возвращает Promise, поэтому функции async и вызываются через await.

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Ошибка сервера: ${response.status}`);
  }
  return response.json();
}

// список велосипедов; params — объект фильтров, например { type: 'mountain', limit: 4 }
export function getBikes(params = {}) {
  const query = new URLSearchParams(params).toString(); // { a: 1, b: 2 } → 'a=1&b=2'
  return request(`/api/bikes?${query}`);
}

// варианты для фильтров каталога: бренды, размеры рам, диапазон цен
export function getFilters() {
  return request('/api/bikes/filters');
}

export function getBike(id) {
  return request(`/api/bikes/${id}`);
}

export function matchBikes(answers) {
  return request('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answers),
  });
}
