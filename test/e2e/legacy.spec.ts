import { expect, test } from '@playwright/test';

test('v0.2 opens with six NPCs, its default settings and a rendered scene', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#engineState')).toHaveText('● OYUN ÇALIŞIYOR');
  await expect(page.locator('#scene canvas')).toBeVisible();
  await expect(page.locator('#npcCount')).toHaveText('6');
  await expect(page.locator('#duration')).toHaveValue('20');
  await expect(page.locator('#capacity')).toHaveValue('100');
  await expect(page.locator('#joinMethod')).toHaveValue('both');
  for (const id of ['autoLoop', 'autoCamera', 'randomEvents']) {
    await expect(page.locator(`#${id}`)).toBeChecked();
  }
  await expect(page.locator('.pill.demo')).toContainText('DEMO');
  await expect(page.locator('#clock')).not.toHaveText('20:00');
  await page.screenshot({ path: testInfo.outputPath('legacy-startup.png') });
  expect(errors).toEqual([]);
});

test('comment/follow simulations deduplicate a name; all gift controls and population work', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#engineState')).toContainText('ÇALIŞIYOR');
  await page.locator('label.switch').filter({ has: page.locator('#randomEvents') }).click();
  await expect(page.locator('#randomEvents')).not.toBeChecked();
  await page.locator('#username').fill('faz0_katılımcı');
  await page.locator('#joinComment').click();
  await page.locator('#joinComment').click();
  await page.locator('#joinFollow').click();
  await expect(page.locator('#playerCount')).toHaveText('1 / 100');
  for (const kind of ['rose', 'heart', 'drum', 'confetti', 'crown', 'fireworks']) {
    await page.locator(`[data-gift="${kind}"]`).click();
  }
  await expect(page.locator('#events')).toHaveText('7');
  await page.locator('#autoPopulate').click();
  await expect(page.locator('#playerCount')).toHaveText('11 / 100');
  await page.screenshot({ path: testInfo.outputPath('legacy-interactions.png') });
  await page.locator('#clearPlayers').click();
  await expect(page.locator('#playerCount')).toHaveText('0 / 100');
});

test('pause/resume, manual cycle and saved settings survive unchanged', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#engineState')).toContainText('ÇALIŞIYOR');
  await page.locator('#pause').click();
  await expect(page.locator('#engineState')).toContainText('DURAKLATILDI');
  const pausedClock = await page.locator('#clock').textContent();
  // Two real seconds are necessary to observe whether the displayed clock remains stopped.
  await page.waitForTimeout(2100);
  await expect(page.locator('#clock')).toHaveText(pausedClock!);
  await page.locator('#pause').click();
  await expect(page.locator('#clock')).not.toHaveText(pausedClock!);
  await page.locator('#restart').click();
  await expect(page.locator('#cycleNo')).toHaveText('Döngü #2');
  await page.locator('#capacity').selectOption('50');
  await page.reload();
  await expect(page.locator('#capacity')).toHaveValue('50');
  await page.locator('#resetSettings').click();
  await expect(page.locator('#capacity')).toHaveValue('100');
});

test('native Web Audio starts and stops, and Halay/Horon modes remain available', async ({ page }, testInfo) => {
  // Observe native contexts; no audio, Three.js, game logic or events are mocked.
  await page.addInitScript(() => {
    const NativeContext = window.AudioContext;
    const contexts: AudioContext[] = [];
    Object.assign(window, { __phase0Contexts: contexts });
    window.AudioContext = class extends NativeContext {
      constructor(options?: AudioContextOptions) { super(options); contexts.push(this); }
    };
  });
  await page.goto('/');
  await expect(page.locator('#engineState')).toContainText('ÇALIŞIYOR');
  await page.locator('#musicToggle').click();
  await expect(page.locator('#musicStatus')).toContainText('Çalıyor: Halay · 2/4');
  const audioState = () => page.evaluate(() => {
    const observed = window as unknown as { __phase0Contexts: AudioContext[] };
    return observed.__phase0Contexts[0]?.state;
  });
  await expect.poll(audioState).toBe('running');
  await page.locator('#musicNext').click();
  await expect(page.locator('#festivalSub')).toContainText('Horon ritmi • 7/8');
  await page.locator('#musicMode').selectOption('halay');
  await expect(page.locator('#festivalSub')).toContainText('Halay ritmi • 2/4');
  await page.locator('#musicMode').selectOption('horon');
  await page.screenshot({ path: testInfo.outputPath('legacy-horon.png') });
  await page.locator('#musicToggle').click();
  await expect.poll(audioState).toBe('suspended');
  await expect(page.locator('#musicToggle')).toContainText('Müziği başlat');
});
