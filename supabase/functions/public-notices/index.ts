const CNPJ = '17749896000109';
const base = 'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao';
function accepted(origin: string) {
  try {
    const u = new URL(origin);
    return u.protocol === 'https:' && (u.hostname === 'descubra-sjdr.vercel.app' ||
      u.hostname === 'descubra-sjdr-pedroeferraz-1272s-projects.vercel.app' ||
      /^descubra-sjdr-[a-z0-9]+-pedroeferraz-1272s-projects\.vercel\.app$/.test(u.hostname));
  } catch { return false; }
}
function reply(payload:unknown,origin:string,status=200) {
  return new Response(JSON.stringify(payload), {
    status, headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Access-Control-Allow-Origin':origin,
      'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods':'OPTIONS, POST',
      'Cache-Control':'no-store',
      'Vary':'Origin'
    }
  });
}
Deno.serve(async req => {
  const origin=req.headers.get('origin') || '';
  if(!accepted(origin))return new Response(null,{status:403});
  if(req.method==='OPTIONS')return reply({},origin,200);
  if(req.method!=='POST')return reply({error:'method_not_allowed'},origin,405);
  const today = new Date();
  const from = new Date(today.getTime()-60*86400000);
  const format = (d:Date) => d.toISOString().slice(0,10).replaceAll('-','');
  const modalities = [6,8,9];
  const items: Array<Record<string,unknown>> = [];
  let failures = 0;
  await Promise.all(modalities.map(async modality => {
    const url = new URL(base);
    url.searchParams.set('dataInicial',format(from));
    url.searchParams.set('dataFinal',format(today));
    url.searchParams.set('codigoModalidadeContratacao',String(modality));
    url.searchParams.set('cnpj',CNPJ);
    url.searchParams.set('pagina','1');
    url.searchParams.set('tamanhoPagina','30');
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),6000);
    try {
      const response=await fetch(url,{signal:controller.signal,headers:{'Accept':'application/json'}});
      if(!response.ok)throw new Error('unavailable');
      const payload=await response.json();
      if(!Array.isArray(payload.data))throw new Error('invalid');
      for(const record of payload.data) {
        const issuer=String(record?.orgaoEntidade?.cnpj || '').replace(/\D/g,'');
        const year=Number(record?.anoCompra);
        const sequence=Number(record?.sequencialCompra);
        if(issuer!==CNPJ||!Number.isInteger(year)||year<2020||year>today.getUTCFullYear()+1 ||
          !Number.isInteger(sequence)||sequence<1||sequence>100000000)continue;
        items.push({
          id:String(record.numeroControlePNCP || year+'/'+sequence),
          title:String(record.objetoCompra || 'Contratação pública').slice(0,350),
          organ:String(record.orgaoEntidade?.razaoSocial || 'Prefeitura Municipal').slice(0,150),
          modality:String(record.modalidadeNome || '').slice(0,80),
          published_at:String(record.dataPublicacaoPncp || '').slice(0,40),
          deadline:String(record.dataEncerramentoProposta || '').slice(0,40),
          url:'https://pncp.gov.br/app/editais/'+CNPJ+'/'+year+'/'+sequence,
        });
      }
    } catch { failures++; } finally { clearTimeout(timer); }
  }));
  items.sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at)));
  return reply({items:items.slice(0,24),partial:failures>0,available:failures<modalities.length,
    source:'PNCP',queried_at:today.toISOString()},origin);
});
