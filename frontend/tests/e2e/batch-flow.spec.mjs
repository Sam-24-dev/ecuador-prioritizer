import { test, expect } from 'playwright/test';

const VALID_URL = 'https://fixture.example/noticias/reforma-educativa';
const INVALID_URL = 'https://fixture.example/invalid';
const OFFLINE_URL = 'https://fixture.example/offline';
const URL_ARTICLE = 'Contenido extraído de fixture para probar la edición y el análisis XGBoost-shaped.';
const MANUAL_ARTICLE = 'Noticia manual para confirmar el flujo principal de análisis.';
const PASTE_ARTICLES = [
  'Primera noticia pegada con contenido suficiente para el análisis.',
  'Segunda noticia pegada con contenido suficiente para el análisis.',
].join('\n--- NUEVA NOTICIA ---\n');
const TXT_ARTICLE = 'Noticia importada desde un archivo TXT con contenido suficiente.';

const extractionFixture = {
  original_url: VALID_URL,
  final_url: 'https://fixture.example/noticias/reforma-educativa?utm_source=fixture',
  domain: 'fixture.example',
  title: 'Reforma educativa en Ecuador',
  author: 'Autora Fixture',
  published_at: '2026-08-20',
  text: URL_ARTICLE,
  original_length: URL_ARTICLE.length,
  truncated: false,
  warnings: ['Fixture local: contenido preparado para E2E.'],
};

function analysisFixture(body) {
  return {
    total: body.items.length,
    items: body.items.map((item, index) => ({
      client_id: item.client_id ?? null,
      preliminary_class: index % 2 === 0 ? 'Falso' : 'Verdadero',
      p_true: index % 2 === 0 ? 0.12 : 0.88,
      score_false: index % 2 === 0 ? 0.88 : 0.12,
      source: item.source ?? null,
      text_snippet: item.text.slice(0, 120),
    })),
  };
}

async function installDeterministicTransport(page, state) {
  const appOrigin = 'http://127.0.0.1:4173';
  await page.route('**/*', async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());

    if (requestUrl.pathname.startsWith('/api/v1/')) {
      state.apiRequests.push(request);
      if (requestUrl.pathname.endsWith('/extractions/url')) {
        const body = JSON.parse(request.postData() ?? '{}');
        if (body.url === INVALID_URL) {
          await route.fulfill({
            status: 422,
            contentType: 'application/json',
            headers: {
              'Access-Control-Allow-Origin': 'http://127.0.0.1:4173',
              'Access-Control-Expose-Headers': 'X-Request-ID',
              'X-Request-ID': 'fixture-invalid-123',
            },
            body: JSON.stringify({ error: { code: 'invalid_url', message: 'validation failed: URL must use http or https' } }),
          });
          return;
        }
        if (body.url === OFFLINE_URL) {
          await route.fulfill({
            status: 502,
            contentType: 'application/json',
            body: JSON.stringify({ error: { code: 'upstream_unavailable', message: 'upstream timeout from provider' } }),
          });
          return;
        }
        expect(body).toEqual({ url: VALID_URL });
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(extractionFixture) });
        return;
      }
      if (requestUrl.pathname.endsWith('/analysis/batch')) {
        const body = JSON.parse(request.postData() ?? '{}');
        state.batchBodies.push(body);
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(analysisFixture(body)) });
        return;
      }
      state.unexpectedApiRequests.push(request.url());
      await route.abort();
      return;
    }

    if (requestUrl.origin !== appOrigin) {
      state.externalRequests.push(request.url());
      await route.abort();
      return;
    }
    await route.continue();
  });
}

async function expectNoUnexpectedNetwork(state) {
  expect(state.externalRequests, 'external network requests').toEqual([]);
  expect(state.unexpectedApiRequests, 'unexpected API requests').toEqual([]);
}

async function readDownload(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function addManualArticle(page, text = MANUAL_ARTICLE) {
  await page.getByRole('button', { name: 'Agregar una noticia' }).click();
  await page.getByLabel('Contenido de la noticia').last().fill(text);
}

test.describe('Phase 11 deterministic batch journeys', () => {
  test('URL import dialog restores focus to its trigger after Escape and close', async ({ page }) => {
    const state = { apiRequests: [], batchBodies: [], externalRequests: [], unexpectedApiRequests: [] };
    await installDeterministicTransport(page, state);
    await page.goto('/');

    const trigger = page.getByRole('button', { name: 'Importar desde URL' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#news-file-import')).toBeFocused();

    await trigger.focus();
    await trigger.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /Cerrar/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('paste preview restores focus to its trigger after Escape, cancel, and close', async ({ page }) => {
    const state = { apiRequests: [], batchBodies: [], externalRequests: [], unexpectedApiRequests: [] };
    await installDeterministicTransport(page, state);
    await page.goto('/');

    const trigger = page.getByRole('button', { name: 'Pegar varias noticias' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.getByLabel('Noticias para revisar').fill(PASTE_ARTICLES);
    await page.getByRole('button', { name: 'Revisar noticias' }).click();
    await expect(page.getByRole('heading', { name: 'Noticia detectada 1' })).toBeVisible();
    await page.getByRole('button', { name: /Seguir corrigiendo/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.getByRole('dialog').getByRole('button', { name: /Cerrar/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expectNoUnexpectedNetwork(state);
  });

  test('paste preview keeps edits after close, clears after confirmation, and supports explicit discard', async ({ page }) => {
    const state = { apiRequests: [], batchBodies: [], externalRequests: [], unexpectedApiRequests: [] };
    await installDeterministicTransport(page, state);
    await page.goto('/');

    const trigger = page.getByRole('button', { name: 'Pegar varias noticias' });
    await trigger.click();
    await page.getByLabel('Noticias para revisar').fill(PASTE_ARTICLES);
    await page.getByRole('button', { name: 'Revisar noticias' }).click();
    const editedText = `${PASTE_ARTICLES.split('\n--- NUEVA NOTICIA ---\n')[0]} Editada.`;
    await page.getByLabel('Contenido de la noticia').first().fill(editedText);
    await page.getByLabel('Fuente (opcional)').first().fill('Fuente editada');
    await page.getByRole('button', { name: /Seguir corrigiendo/ }).click();

    await trigger.click();
    await expect(page.getByLabel('Contenido de la noticia').first()).toHaveValue(editedText);
    await expect(page.getByLabel('Fuente (opcional)').first()).toHaveValue('Fuente editada');
    await page.getByRole('button', { name: 'Confirmar y agregar noticias' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByLabel('Contenido de la noticia').first()).toHaveValue(editedText);
    await expect(page.getByLabel('Fuente (opcional)').first()).toHaveValue('Fuente editada');

    await trigger.click();
    await expect(page.getByRole('heading', { name: 'Noticia detectada 1' })).toHaveCount(0);
    await page.getByRole('dialog').getByLabel('Noticias para revisar').fill(PASTE_ARTICLES);
    await page.getByRole('button', { name: 'Revisar noticias' }).click();
    await page.getByRole('button', { name: /Descartar vista previa/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await trigger.click();
    await expect(page.getByRole('heading', { name: 'Noticia detectada 1' })).toHaveCount(0);
    await expectNoUnexpectedNetwork(state);
  });

  test('URL preview maps to a lot, returns XGBoost-shaped results, and exports CSV', async ({ page }) => {
    const state = { apiRequests: [], batchBodies: [], externalRequests: [], unexpectedApiRequests: [] };
    await installDeterministicTransport(page, state);
    await page.goto('/');

    await page.getByRole('button', { name: 'Importar desde URL' }).click();
    await page.getByLabel('URL de la noticia').fill(VALID_URL);
    await page.getByRole('button', { name: 'Extraer vista previa' }).click();
    await expect(page.getByRole('heading', { name: 'Vista previa extraída' })).toBeVisible();
    await expect(page.getByLabel('Título extraído')).toHaveValue(extractionFixture.title);
    await page.getByRole('button', { name: 'Importar otra URL' }).click();
    await expect(page.getByLabel('URL de la noticia')).toHaveValue('');
    await expect(page.getByRole('heading', { name: /Vista previa/ })).toHaveCount(0);
    await page.getByLabel('URL de la noticia').fill(VALID_URL);
    await page.getByRole('button', { name: 'Extraer vista previa' }).click();
    await page.locator('#url-preview-text').fill(`${URL_ARTICLE} Editada.`);
    await page.getByRole('button', { name: 'Confirmar vista previa y agregar al lote' }).click();
    await expect(page.getByRole('dialog').getByRole('status')).toContainText('Noticia agregada al lote. Puedes importar otra URL.');
    await expect(page.getByLabel('URL de la noticia')).toHaveValue('');
    await page.getByRole('dialog').getByRole('button', { name: /Cerrar/ }).click();
    await expect(page.getByRole('status')).toContainText('La noticia importada se agreg');
    await page.getByRole('button', { name: 'Importar desde URL' }).click();
    await expect(page.getByLabel('URL de la noticia')).toHaveValue('');
    await page.getByRole('dialog').getByRole('button', { name: /Cerrar/ }).click();
    await expect(page.getByLabel('Contenido de la noticia')).toHaveValue(`${URL_ARTICLE} Editada.`);

    await page.getByRole('button', { name: 'Analizar 1 noticia' }).click();
    await expect(page).toHaveURL(/\/resultados$/);
    await expect(page.getByText('Posible desinformación')).toBeVisible();
    await expect(page.getByText('Puntaje').first()).toBeVisible();
    await expect(page.getByText('88 / 100')).toBeVisible();
    await expect(page.getByRole('link', { name: VALID_URL })).toBeVisible();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
    await page.getByRole('button', { name: 'Copiar fuente' }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(VALID_URL);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar todos los resultados (CSV)' }).click();
    const download = await downloadPromise;
    await expect(page.getByRole('status').filter({ hasText: 'La exportación CSV se inició.' })).toBeVisible();
    expect(download.suggestedFilename()).toBe('ecuador-prioritizer-resultados.csv');
    const csv = await readDownload(download);
    expect(csv).toContain('"orden_de_revision","resultado_de_priorizacion","puntaje_de_posible_desinformacion_0_a_100","fuente","texto"');
    expect(csv).toContain('"1","Posible desinformación","88"');
    expect(csv).toContain('"Posible desinformación","88","fixture.example"');
    expect(csv).toContain('Editada.');

    expect(state.batchBodies).toHaveLength(1);
    expect(state.batchBodies[0].items[0]).toEqual({
      client_id: expect.any(String),
      text: `${URL_ARTICLE} Editada.`,
      source: 'fixture.example',
    });
    expect(JSON.stringify(state.batchBodies[0])).not.toContain('Autora Fixture');
    expect(JSON.stringify(state.batchBodies[0])).not.toContain('reforma-educativa?utm_source');
    await expectNoUnexpectedNetwork(state);
  });

  test('results map both raw classes to user-facing priority labels and preserve batch order', async ({ page }) => {
    const state = { apiRequests: [], batchBodies: [], externalRequests: [], unexpectedApiRequests: [] };
    await installDeterministicTransport(page, state);
    await page.goto('/');

    await addManualArticle(page, 'Primera noticia para verificar prioridad.');
    await addManualArticle(page, 'Segunda noticia para verificar prioridad.');
    await page.getByRole('button', { name: 'Analizar 2 noticias' }).click();
    await expect(page).toHaveURL(/\/resultados$/);

    await expect(page.getByText('Posible desinformación')).toBeVisible();
    await expect(page.getByText('Menor señal de desinformación')).toBeVisible();
    await expect(page.getByText('88 / 100')).toBeVisible();
    await expect(page.getByText('12 / 100')).toBeVisible();
    await expect(page.getByText('Revisar después', { exact: true })).toHaveCount(2);
    await expect(page.getByText('Revisar primero', { exact: true })).toHaveCount(2);
    await expect(page.getByText('Clasificación preliminar:', { exact: false })).toHaveCount(0);
    await expect(page.getByText('Puntaje falso', { exact: false })).toHaveCount(0);
    await expect(page.getByText('Nota de priorización:', { exact: false })).toHaveCount(0);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar todos los resultados (CSV)' }).click();
    const csv = await readDownload(await downloadPromise);
    expect(csv).toContain('"1","Posible desinformación","88"');
    expect(csv).toContain('"2","Menor señal de desinformación","12"');
    expect(csv).not.toContain('clase_preliminar');
    expect(csv).not.toContain('p_verdadero');

    expect(state.batchBodies).toHaveLength(1);
    expect(state.batchBodies[0].items.map((item) => item.text)).toEqual([
      'Primera noticia para verificar prioridad.',
      'Segunda noticia para verificar prioridad.',
    ]);
    await expectNoUnexpectedNetwork(state);
  });

  test('manual entry, paste, TXT import, new lot, and lot-full guard remain usable', async ({ page }) => {
    const state = { apiRequests: [], batchBodies: [], externalRequests: [], unexpectedApiRequests: [] };
    await installDeterministicTransport(page, state);
    await page.goto('/');

    await addManualArticle(page);
    await page.getByRole('button', { name: 'Pegar varias noticias' }).click();
    await page.getByLabel('Noticias para revisar').fill(PASTE_ARTICLES);
    await page.getByRole('button', { name: 'Revisar noticias' }).click();
    await expect(page.getByRole('heading', { name: 'Noticia detectada 1' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar y agregar noticias' }).click();
    await expect(page.getByText(/3 de 10/)).toBeVisible();

    const txtInput = page.locator('#news-file-import');
    await txtInput.setInputFiles({ name: 'fixture.txt', mimeType: 'text/plain', buffer: Buffer.from(TXT_ARTICLE) });
    await expect(page.getByText('Archivo: fixture.txt')).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar y agregar noticias' }).click();
    await expect(page.getByText(/4 de 10/)).toBeVisible();

    await page.getByRole('button', { name: 'Analizar 4 noticias' }).click();
    await expect(page).toHaveURL(/\/resultados$/);
    await page.getByRole('button', { name: 'Borrar resultados' }).click();
    await expect(page).toHaveURL(/\/$/);
    await addManualArticle(page, 'Noticia del lote nuevo después de borrar resultados.');
    await expect(page.getByText(/1 de 10/)).toBeVisible();

    for (let index = 1; index < 10; index += 1) {
      await page.getByRole('button', { name: 'Agregar una noticia' }).click();
      await page.getByLabel('Contenido de la noticia').last().fill(`Noticia ${index + 1} del lote lleno con contenido suficiente.`);
    }
    await expect(page.getByText(/10 de 10/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agregar una noticia' })).toBeDisabled();
    const requestCountBeforeFullLotImport = state.apiRequests.length;
    await page.getByRole('button', { name: 'Importar desde URL' }).click();
    await expect(page.getByRole('alert')).toContainText('Este lote ya tiene 10 noticias');
    await expect(page.getByRole('button', { name: 'Extraer vista previa' })).toBeDisabled();
    expect(state.apiRequests).toHaveLength(requestCountBeforeFullLotImport);
    await expectNoUnexpectedNetwork(state);
  });

  test('invalid URL and backend-off responses stay visible without network fallback', async ({ page }) => {
    const state = { apiRequests: [], batchBodies: [], externalRequests: [], unexpectedApiRequests: [] };
    await installDeterministicTransport(page, state);
    await page.goto('/');

    await page.getByRole('button', { name: 'Importar desde URL' }).click();
    await page.getByLabel('URL de la noticia').fill(INVALID_URL);
    await page.getByRole('button', { name: 'Extraer vista previa' }).click();
    await expect(page.getByRole('alert')).toContainText('No fue posible extraer esta URL.');
    await expect(page.getByRole('alert')).toContainText('Edita la dirección o prueba con otro artículo público.');
    await expect(page.getByRole('alert')).toContainText('ID de referencia: fixture-invalid-123');
    await expect(page.getByRole('alert')).not.toContainText('validation failed');

    await page.getByLabel('URL de la noticia').fill('no-es-una-url');
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(await page.getByLabel('URL de la noticia').evaluate((input) => input.validity.typeMismatch)).toBe(true);
    await page.getByLabel('URL de la noticia').fill(OFFLINE_URL);
    await page.getByRole('button', { name: 'Extraer vista previa' }).click();
    await expect(page.getByRole('alert')).toContainText('No fue posible extraer esta URL.');
    await expect(page.getByRole('alert')).toContainText('Intenta de nuevo más tarde.');
    await expect(page.getByRole('alert')).not.toContainText('upstream timeout');
    await expectNoUnexpectedNetwork(state);
  });
});

