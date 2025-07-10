import { test, expect } from '@playwright/test';

// Включаем запись видео для просмотра анимации
test.use({ video: 'on' });

test('spiral ship flight animation on game-edge click', async ({ page }) => {
  // Шаг 1: Заходим на стартовую страницу и входим в портфолио
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: 'Enter Portfolio' }).click();
  await page.waitForURL('**/home');

  // Шаг 2: Наводим курсор на игровую зону и кликаем для старта анимации
  await page.locator('.game-edge').hover();
  await page.waitForTimeout(500);
  await page.locator('.game-edge').click();

  // Шаг 3: Ждём перехода на страницу игры
  await page.waitForURL('**/game');

  // Шаг 4: Дожидаемся появления игрового канваса по data-testid
  const gameCanvas = page.locator('[data-testid="game-canvas"]');
  await gameCanvas.waitFor({ state: 'visible', timeout: 5000 });
  
  // Шаг 5: Ждём окончания анимации (~4 сек)
  await page.waitForTimeout(4000);
  
  // Шаг 6: Проверяем, что игровой канвас видим после анимации
  await expect(gameCanvas).toBeVisible();
}); 