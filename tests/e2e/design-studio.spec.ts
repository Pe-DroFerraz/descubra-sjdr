import { test, expect } from '@playwright/test';

test('ateliê opens with demo navigation and instant live theme updates',async ({page})=>{
  await page.route('http://127.0.0.1:54399/**',route=>route.abort());
  await page.goto('/estudio');
  await expect(page.getByText('ATELIÊ VISUAL').first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Página inicial/})).toBeVisible();
  const site=page.locator('.ds-stage-row .st-site').last();
  await expect(site.getByRole('heading',{name:/O melhor da viagem/})).toBeVisible();
  await page.getByRole('tab',{name:/Layout/}).click();
  await page.getByRole('slider').first().fill('36');
  await expect(site).toHaveCSS('--st-radius','36px');
  await page.getByRole('tab',{name:/Cores/}).click();
  await page.getByRole('button',{name:/Barroco contemporâneo/}).click();
  await expect(site).toHaveCSS('--st-primary','#632F33');
  await page.getByRole('button',{name:/Comparar/}).click();
  await expect(page.locator('.ds-stage-row .st-site')).toHaveCount(2);
  await expect(page.locator('.ds-stage-row .st-site').first()).toHaveCSS('--st-primary','#173B37');
  await page.getByRole('button',{name:/Comparar/}).click();
  await page.getByRole('button',{name:'Celular',exact:true}).click().catch(async()=>{
    await page.getByTitle('Celular').click();
  });
  await expect(page.locator('.ds-viewport.mobile')).toBeVisible();
});

test('demo journey, discovery map and lead form work without backend',async ({page})=>{
  await page.route('http://127.0.0.1:54399/**',route=>route.abort());
  await page.goto('/estudio');
  await page.getByRole('button',{name:/Explorar lugares/}).click();
  const site=page.locator('.ds-stage-row .st-site').last();
  await expect(site.getByRole('heading',{name:/Encontre o que faz/})).toBeVisible();
  await site.getByRole('textbox',{name:'Buscar atrações demonstrativas'}).fill('Pilar');
  await expect(site.getByText('Catedral Basílica do Pilar')).toBeVisible();
  await expect(site.getByText('Museu Ferroviário')).toHaveCount(0);
  await page.getByRole('button',{name:/Mapa turístico/}).click();
  await expect(site.locator('.st-map-canvas')).toBeVisible();
  await page.getByRole('button',{name:/Para anunciantes/}).click();
  await site.getByPlaceholder('Nome completo').fill('Joana Ribeiro');
  await site.getByPlaceholder('Ex.: Café do Centro').fill('Café de Teste');
  await site.getByPlaceholder('seuemail@exemplo.com').fill('joana@example.com');
  await site.getByRole('button',{name:/Simular envio/}).click();
  await expect(site.getByText(/Nenhum dado foi enviado/)).toBeVisible();
});

test('theme can be saved, compared, exported and restored locally',async ({page})=>{
  await page.goto('/estudio');
  await page.getByRole('tab',{name:/Layout/}).click();
  await page.getByRole('slider').first().fill('42');
  await page.getByRole('button',{name:/Salvar/}).first().click();
  await expect(page.getByRole('status').last()).toContainText('salvas');
  await page.reload();
  await expect(page.locator('.ds-stage-row .st-site').last()).toHaveCSS('--st-radius','42px');
  await page.getByRole('button',{name:/Criar versão/}).click();
  await expect(page.getByRole('status').last()).toContainText('Versão');
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:/Exportar identidade/}).click();
  expect((await download).suggestedFilename()).toContain('identidade-visual');
});
