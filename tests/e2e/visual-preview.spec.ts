import { test, expect } from '@playwright/test';

test('homepage provides full editorial experiences when Supabase is offline', async ({page})=>{
  await page.route('http://127.0.0.1:54399/**',route=>route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading',{name:/Uma cidade para sentir/})).toBeVisible();
  await expect(page.getByRole('heading',{name:/Existe um São João/})).toBeVisible();
  await expect(page.locator('.destination-mosaic .visual-photo img')).toHaveCount(4);
  await expect(page.getByRole('link',{name:/Ver mapa da cidade/})).toBeVisible();
  await expect(page.getByRole('link',{name:/Abrir mapa em tela cheia/})).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('curated routes and itinerary builder work without a database',async ({page})=>{
  await page.route('http://127.0.0.1:54399/**',route=>route.abort());
  await page.goto('/roteiros');
  await expect(page.getByRole('heading',{name:/Roteiros que/})).toBeVisible();
  await page.getByRole('link',{name:/Explorar roteiro/}).first().click();
  await expect(page.getByText('Passo a passo,')).toBeVisible();
  await expect(page.getByText('4 paradas')).toBeVisible();
  await page.getByRole('checkbox',{name:/Incluir Igreja de São Francisco/}).uncheck();
  await expect(page.getByText('3 paradas')).toBeVisible();
  await page.goto('/planejar');
  await page.getByRole('button',{name:/Encontrar meu roteiro/}).click();
  await expect(page.getByRole('link',{name:/Ver roteiro com/})).toBeVisible();
});

test('map retains an immediately visible flat fallback',async ({page})=>{
  await page.route('http://127.0.0.1:54399/**',route=>route.abort());
  await page.goto('/mapa-3d');
  await expect(page.getByTitle('Mapa de São João del-Rei')).toBeVisible();
  await expect(page.getByRole('button',{name:/Ativar 3D/})).toBeVisible();
});

test('main map is a first-class destination with map filters even when the catalog is offline',async ({page})=>{
  await page.route('http://127.0.0.1:54399/**',route=>route.abort());
  await page.goto('/mapa');
  await expect(page.getByRole('heading',{name:/Descubra a cidade/})).toBeVisible();
  await expect(page.getByRole('region',{name:'Mapa de São João del-Rei com pontos turísticos'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Igrejas',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Igrejas',exact:true}).click();
  await expect(page.getByText('Igreja de São Francisco de Assis',{exact:true}).first()).toBeVisible();
  await page.getByRole('button',{name:'Eventos',exact:true}).click();
  await expect(page.getByText(/Ainda não há eventos futuros publicados/)).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('3D map either renders its real canvas or reports a clear browser limitation',async ({page})=>{
  test.setTimeout(35000);
  await page.goto('/mapa-3d');
  await expect(page.getByTitle('Mapa de São João del-Rei')).toBeVisible();
  await page.getByRole('button',{name:'Ativar 3D'}).click();
  await expect.poll(async()=>{
    if(await page.getByRole('button',{name:'Ver plano'}).count())return 'ready';
    if(await page.getByRole('alert').count())return 'error';
    return 'loading';
  },{timeout:28000}).not.toBe('loading');
  if(await page.getByRole('button',{name:'Ver plano'}).count()){
    await expect(page.locator('.maplibregl-canvas')).toBeVisible();
    await page.getByRole('button',{name:'Ver plano'}).click();
    await expect(page.getByRole('button',{name:'Ver 3D'})).toBeVisible();
  }else{
    await expect(page.getByRole('alert')).toContainText(/WebGL|elevação|MapLibre|relevo|falha/i);
  }
});

test('real bundled MapLibre terrain renders in Chromium with elevation tiles',async ({page})=>{
  test.setTimeout(70000);
  const errors:string[]=[];
  page.on('requestfailed',request=>{if(/mapterhorn|openstreetmap/.test(request.url()))errors.push(request.url()+': '+(request.failure()?.errorText??''));});
  await page.goto('/mapa-3d');
  await page.getByRole('button',{name:'Ativar 3D'}).click();
  try{
    await expect(page.getByRole('button',{name:'Ver plano'})).toBeVisible({timeout:45000});
    await expect(page.locator('.maplibregl-canvas')).toBeVisible();
    await page.getByRole('button',{name:'Ver plano'}).click();
    await expect(page.getByRole('button',{name:'Ver 3D'})).toBeVisible();
  }catch(e){
    console.error('Terrain source network issues:',errors);
    console.error('Terrain status:',await page.getByRole('alert').allTextContents());
    throw e;
  }
});
