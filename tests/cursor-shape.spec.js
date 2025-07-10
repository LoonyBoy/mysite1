import { test, expect } from '@playwright/test';

// Тест для проверки формы кастомного курсора на зоне .game-edge
test('custom cursor shape on game-edge hover', async ({ page }) => {
  // Переходим на стартовую страницу и входим в портфолио
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: 'Enter Portfolio' }).click();
  // Ждём перехода на домашнюю страницу
  await page.waitForURL('**/home');

  // Убедимся, что кастомный курсор загружен
  await page.waitForSelector('.cursor');

  // Наводим на левую игровую зону
  await page.locator('.game-edge').hover();
  await page.waitForTimeout(500);

  // Debug: вывод вычисленных стилей курсора
  const cursorStyle = await page.evaluate(() => {
    const el = document.querySelector('.cursor');
    const cs = getComputedStyle(el);
    return {
      width: cs.width,
      height: cs.height,
      backgroundColor: cs.backgroundColor,
      borderRight: cs.borderRight,
      borderTop: cs.borderTop,
      borderBottom: cs.borderBottom
    };
  });
  console.log('DEBUG: computed styles of cursor:', cursorStyle);

  // Выводим классы кастомного курсора для отладки
  const cursorClasses = await page.evaluate(() => Array.from(document.querySelector('.cursor').classList));
  console.log('DEBUG: Cursor classes after hover:', cursorClasses);
  // Проверяем, что применяется класс triangle и нет конфликтующих классов
  expect(cursorClasses).toContain('triangle');
  expect(cursorClasses).not.toContain('hover');
  expect(cursorClasses).not.toContain('navigation');

  // Делаем скриншот курсора
  await page.locator('.cursor').screenshot({ path: 'cursor-game-edge.png' });

  // Заглушка для успешного прохождения теста
  expect(true).toBe(true);
}); 