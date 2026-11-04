import {test,expect} from '@playwright/test';
test('admin demo shows operational metrics without private database access',async ({page})=>{
 let calls=0;
 await page.route('https://itegpsgjtuclbsatcdxr.supabase.co/**',route=>{calls++;return route.abort();});
 await page.goto('/painel-demo');
 await expect(page.getByRole('heading',{name:/Sua cidade/})).toBeVisible();
 await expect(page.getByText(/AMBIENTE DEMONSTRATIVO/)).toBeVisible();
 await expect(page.getByText('Café do Largo — exemplo')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Interessados'})).toBeVisible();
 await page.getByRole('button',{name:'Interessados'}).click();
 await expect(page.getByText('Café do Largo — exemplo')).toBeVisible();
 expect(calls).toBe(0);
});
test('admin demo exercises CRM stage selection and commercial moderation in isolation',async ({page})=>{
 await page.goto('/painel-demo');
 await page.getByRole('button',{name:'Interessados'}).click();
 await page.getByRole('button',{name:/Café do Largo/}).click();
 await page.getByRole('combobox',{name:'Etapa comercial'}).selectOption('proposal');
 await expect(page.getByRole('status').last()).toContainText('simulada');
 await page.getByRole('button',{name:'Comercial'}).click();
 await expect(page.getByText('Pousada demonstrativa')).toBeVisible();
 await page.getByRole('button',{name:'Mapa editorial'}).click();
 await expect(page.getByLabel('Mapa de atrações e referências do centro histórico')).toBeVisible();
 await expect(page.getByText(/Igreja de São Francisco de Assis/).first()).toBeVisible();
});
