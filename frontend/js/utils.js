// 56490 → «56 490 ₽»
export function formatPrice(value) {
  return value.toLocaleString('ru-RU') + ' ₽';
}

// Экранируем текст перед вставкой в HTML, чтобы символы < > & " не ломали разметку
export function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// Склоняем слово по числу: plural(21, ['скорость', 'скорости', 'скоростей']) → «скорость»
export function plural(n, forms) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}
