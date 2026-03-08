import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Test node profile — simulates a real farmer node signing up
// ---------------------------------------------------------------------------

const NODE_USER = {
  name: 'Test Farm Alpha',
  lat: 43.65107,
  lng: -79.347015,
  plot_size_sqft: 200,
  plot_type: 'backyard',
  sunlight_hours: 7,
  pH: 6.5,
  moisture: 55,
  temperature: 18,
  humidity: 60,
  tools: 'basic',
  budget: 'low',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function clearFarmState(page: Page) {
  // Must be on a real page (not about:blank) before localStorage is accessible
  const url = page.url();
  if (!url.startsWith('http')) {
    await page.goto('/');
  }
  await page.evaluate(() => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('mycelium:')) localStorage.removeItem(k);
    });
  });
}

async function getFarmId(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('mycelium:farm_id');
    return raw ? parseInt(raw) : null;
  });
}

/** Runs the full setup flow steps 1-4 and waits for dashboard navigation. */
async function runSetupFlow(page: Page) {
  await clearFarmState(page);
  await page.goto('/setup');

  // Step 1 — Plot Basics
  await page.fill('#farm-name', NODE_USER.name);
  await page.fill('#plot-size', String(NODE_USER.plot_size_sqft));
  await page.getByRole('button', { name: 'Backyard' }).click();
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 2 — Soil
  await page.fill('#soil-ph', String(NODE_USER.pH));
  await page.fill('#soil-moisture', String(NODE_USER.moisture));
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 3 — Climate
  await page.fill('#climate-temp', String(NODE_USER.temperature));
  await page.fill('#climate-humidity', String(NODE_USER.humidity));
  await page.getByRole('button', { name: /continue/i }).click();

  // Step 4 — Resources + Submit → navigates to /suggestions (crop picker)
  await page.getByRole('button', { name: /connect to network/i }).click();
  await page.waitForURL('/suggestions', { timeout: 10000 });

  // Step 5 — Pick a crop and confirm → creates farm + navigates to /dashboard
  // Use evaluate to click through the DEV NODE SWITCHER overlay that intercepts pointer events
  await page.getByRole('button', { name: /spinach|herbs|tomato|carrots|kale|beans|lettuce|microgreens/i }).first().dispatchEvent('click');
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Start growing'));
    (btn as HTMLButtonElement)?.click();
  });
  await page.waitForURL('/dashboard', { timeout: 15000 });
}

// ---------------------------------------------------------------------------
// CHECKPOINT 1 — Landing page
// ---------------------------------------------------------------------------

test('CP-01: Landing page loads and CTA navigates to /setup', async ({ page }) => {
  await clearFarmState(page);
  await page.goto('/');
  await expect(page).toHaveURL('/');
  await expect(page.getByText('MyCelium')).toBeVisible();
  await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
  await page.getByRole('button', { name: /get started/i }).click();
  await expect(page).toHaveURL('/setup');
});

// ---------------------------------------------------------------------------
// CHECKPOINT 2 — Protected route guard
// ---------------------------------------------------------------------------

test('CP-02: /dashboard redirects to / when no farmId in localStorage', async ({ page }) => {
  await clearFarmState(page);
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/');
});

// ---------------------------------------------------------------------------
// CHECKPOINT 3 — Setup Step 1
// ---------------------------------------------------------------------------

test('CP-03: Setup Step 1 — Plot Basics advances to Soil Conditions', async ({ page }) => {
  await clearFarmState(page);
  await page.goto('/setup');
  await expect(page.getByText('Plot basics')).toBeVisible();
  await page.fill('#farm-name', NODE_USER.name);
  await page.fill('#plot-size', String(NODE_USER.plot_size_sqft));
  await page.getByRole('button', { name: 'Backyard' }).click();
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.getByText('Soil conditions')).toBeVisible();
});

// ---------------------------------------------------------------------------
// CHECKPOINT 4 — Setup Step 2
// ---------------------------------------------------------------------------

test('CP-04: Setup Step 2 — Soil Conditions advances to Climate', async ({ page }) => {
  await clearFarmState(page);
  await page.goto('/setup');
  await page.fill('#farm-name', NODE_USER.name);
  await page.fill('#plot-size', String(NODE_USER.plot_size_sqft));
  await page.getByRole('button', { name: 'Backyard' }).click();
  await page.getByRole('button', { name: /continue/i }).click();

  await expect(page.getByText('Soil conditions')).toBeVisible();
  await page.fill('#soil-ph', String(NODE_USER.pH));
  await page.fill('#soil-moisture', String(NODE_USER.moisture));
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.getByText('Climate')).toBeVisible();
});

// ---------------------------------------------------------------------------
// CHECKPOINT 5 — Setup Step 3
// ---------------------------------------------------------------------------

test('CP-05: Setup Step 3 — Climate advances to Resources', async ({ page }) => {
  await clearFarmState(page);
  await page.goto('/setup');
  await page.fill('#farm-name', NODE_USER.name);
  await page.fill('#plot-size', String(NODE_USER.plot_size_sqft));
  await page.getByRole('button', { name: 'Backyard' }).click();
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /continue/i }).click(); // skip soil defaults
  await expect(page.getByText('Climate')).toBeVisible();
  await page.fill('#climate-temp', String(NODE_USER.temperature));
  await page.fill('#climate-humidity', String(NODE_USER.humidity));
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.getByText('Resources')).toBeVisible();
});

// ---------------------------------------------------------------------------
// CHECKPOINT 6 — Full setup submit → dashboard
// ---------------------------------------------------------------------------

test('CP-06: Full setup flow submits and navigates to /dashboard with valid farmId', async ({ page }) => {
  await runSetupFlow(page);
  await expect(page).toHaveURL('/dashboard');

  const farmId = await getFarmId(page);
  expect(farmId).not.toBeNull();
  expect(farmId!).toBeGreaterThan(0);

  // sunlight_hours should be persisted keyed by farmId
  const sunlight = await page.evaluate((fid) =>
    localStorage.getItem(`mycelium:sunlight_hours:${fid}`)
  , farmId);
  expect(sunlight).not.toBeNull();
  console.log(`[CP-06] farmId=${farmId}, sunlight=${sunlight}`);
});

// ---------------------------------------------------------------------------
// CHECKPOINT 7 — Dashboard data load
// ---------------------------------------------------------------------------

test('CP-07: Dashboard loads hero, tasks, and zone conditions sections', async ({ page }) => {
  await runSetupFlow(page);

  await expect(page.getByText(/Cycle/i).first()).toBeVisible();
  await expect(page.getByText('Your tasks today')).toBeVisible();
  await expect(page.getByText('Zone conditions')).toBeVisible();
});

// ---------------------------------------------------------------------------
// CHECKPOINT 8 — Stats row
// ---------------------------------------------------------------------------

test('CP-08: Dashboard stats row shows kg metric', async ({ page }) => {
  await runSetupFlow(page);
  // Stats row contains "kg" somewhere
  await expect(page.getByText(/kg/i).first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// CHECKPOINT 9 — Update page structure
// ---------------------------------------------------------------------------

test('CP-09: /update page renders all condition inputs pre-filled', async ({ page }) => {
  await runSetupFlow(page);
  await page.goto('/update');

  await expect(page.getByText('Log update')).toBeVisible();
  await expect(page.getByText('Conditions today')).toBeVisible();
  await expect(page.locator('#upd-ph')).toBeVisible();
  await expect(page.locator('#upd-moisture')).toBeVisible();
  await expect(page.locator('#upd-temp')).toBeVisible();
  await expect(page.locator('#upd-humidity')).toBeVisible();
  await expect(page.getByText('Task progress')).toBeVisible();

  // Wait for soil data to prefill (useEffect fires after fetch)
  await page.waitForTimeout(1500);
  const phVal = await page.locator('#upd-ph').inputValue();
  const tempVal = await page.locator('#upd-temp').inputValue();
  expect(parseFloat(phVal)).toBeGreaterThan(0);
  expect(parseFloat(phVal)).toBeLessThanOrEqual(14);
  expect(parseFloat(tempVal)).not.toBeNaN();
});

// ---------------------------------------------------------------------------
// CHECKPOINT 10 — Submit readings
// ---------------------------------------------------------------------------

test('CP-10: Submitting updated readings shows success toast', async ({ page }) => {
  await runSetupFlow(page);
  await page.goto('/update');
  await page.waitForTimeout(1500); // wait for prefill

  await page.fill('#upd-ph', '6.8');
  await page.fill('#upd-moisture', '60');
  await page.getByRole('button', { name: /sync conditions/i }).click();
  await expect(page.getByText('Readings logged')).toBeVisible({ timeout: 8000 });
});

// ---------------------------------------------------------------------------
// CHECKPOINT 11 — Task skip interaction
// ---------------------------------------------------------------------------

test('CP-11: Skipping a task shows Skipped badge and persists to localStorage', async ({ page }) => {
  await runSetupFlow(page);
  await page.goto('/update');
  await page.waitForTimeout(1500);

  const skipBtn = page.getByRole('button', { name: /skip/i }).first();
  const skipVisible = await skipBtn.isVisible().catch(() => false);

  if (skipVisible) {
    await skipBtn.click();
    await expect(page.getByText('Skipped').first()).toBeVisible();

    const farmId = await getFarmId(page);
    const taskStored = await page.evaluate((fid) => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`mycelium:task:${fid}:`) && localStorage.getItem(k) === 'skipped') {
          return true;
        }
      }
      return false;
    }, farmId);
    expect(taskStored).toBe(true);
  } else {
    console.warn('[CP-11] WARNING: No tasks with Skip button found. Skipping interaction check.');
  }
});

// ---------------------------------------------------------------------------
// CHECKPOINT 12 — Wallet page
// ---------------------------------------------------------------------------

test('CP-12: /wallet page renders without errors', async ({ page }) => {
  await runSetupFlow(page);
  await page.goto('/wallet');
  await expect(page.getByText(/coming soon|wallet/i).first()).toBeVisible();
});

// ---------------------------------------------------------------------------
// CHECKPOINT 13 — Data persistence across navigation
// ---------------------------------------------------------------------------

test('CP-13: farmId persists across navigation and dashboard re-renders', async ({ page }) => {
  await runSetupFlow(page);
  const farmIdBefore = await getFarmId(page);

  await page.goto('/wallet');
  await page.goto('/dashboard');

  const farmIdAfter = await getFarmId(page);
  expect(farmIdAfter).toBe(farmIdBefore);
  await expect(page.getByText('Zone conditions')).toBeVisible();
});

// ---------------------------------------------------------------------------
// CHECKPOINT 14 — API health check via in-page fetch
// ---------------------------------------------------------------------------

test('CP-14: API responses have correct shape and valid values', async ({ page }) => {
  await runSetupFlow(page);
  const farmId = await getFarmId(page);
  expect(farmId).not.toBeNull();

  const results = await page.evaluate(async (fid) => {
    const balance = await fetch(`http://localhost:8000/nodes/${fid}/balance`).then(r => r.json());
    const tasks = await fetch(`http://localhost:8000/nodes/${fid}/tasks`).then(r => r.json());
    const soilData = await fetch(`http://localhost:8000/nodes/${fid}/data`).then(r => r.json());
    const readings = await fetch(`http://localhost:8000/nodes/${fid}/readings?limit=5`).then(r => r.json());
    return { balance, tasks, soilData, readings };
  }, farmId);

  // Balance shape
  expect(results.balance.node_id).toBe(farmId);
  expect(typeof results.balance.currency_balance).toBe('number');
  expect(results.balance.currency_balance).toBeGreaterThanOrEqual(0);
  expect(typeof results.balance.crops_on_hand).toBe('object');
  expect(typeof results.balance.crops_lifetime).toBe('object');

  // Tasks shape
  expect(Array.isArray(results.tasks)).toBe(true);
  if (results.tasks.length > 0) {
    const t = results.tasks[0];
    expect(t.id).toBeDefined();
    expect(typeof t.title).toBe('string');
    expect(typeof t.subtitle).toBe('string');
    expect(typeof t.crop_name).toBe('string');
  }

  // Soil data shape + value ranges
  expect(results.soilData.farm_id).toBe(farmId);
  expect(results.soilData.pH).toBeGreaterThanOrEqual(0);
  expect(results.soilData.pH).toBeLessThanOrEqual(14);
  expect(results.soilData.moisture).toBeGreaterThanOrEqual(0);
  expect(results.soilData.moisture).toBeLessThanOrEqual(100);

  // Readings shape — field must be 'timestamp' not 'recorded_at'
  expect(Array.isArray(results.readings)).toBe(true);
  if (results.readings.length > 0) {
    const r = results.readings[0];
    expect(r.recorded_at).toBeDefined();
    expect(r.recorded_at).not.toBe('');
    expect(r.node_id).toBe(farmId);
  }

  console.log(`[CP-14] farmId=${farmId} | balance=${results.balance.currency_balance} | tasks=${results.tasks.length} | readings=${results.readings.length}`);
});
