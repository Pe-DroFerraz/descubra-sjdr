import { ArrowUpRight, ExternalLink, FileSearch, FileText, Info } from 'lucide-react';
import { Page } from '../components/tourism/common';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
const listings = [
  { title: 'Licitações e contratos — Transparência', url: 'https://ptn.saojoaodelrei.mg.gov.br/', description: 'Consulte processos, licitações e contratos divulgados pela administração.' },
  { title: 'Portal institucional da Prefeitura', url: 'https://www.saojoaodelrei.mg.gov.br/', description: 'Acompanhe os avisos, atos, editais e comunicados publicados no site oficial.' },
  { title: 'Sistema de licitações eletrônicas', url: 'https://saojoaodelrei.licitapp.com.br/', description: 'Acesse os certames eletrônicos e os documentos disponíveis na plataforma.' },
] as const;
const itemSchema = z.object({ id:z.string(),title:z.string(),organ:z.string(),modality:z.string(),published_at:z.string(),deadline:z.string(),url:z.string().url() });
const responseSchema = z.object({items:z.array(itemSchema),available:z.boolean(),partial:z.boolean(),source:z.string(),queried_at:z.string()});
export default function PublicNotices() {
  const notices=useQuery({
    queryKey:['public','pncp-sjdr'],
    enabled:!!supabase,
    staleTime:15*60*1000,
    retry:1,
    queryFn:async()=>{
      if(!supabase)throw new Error('Not configured');
      const {data,error}=await supabase.functions.invoke('public-notices',{body:{}});
      if(error)throw error;
      return responseSchema.parse(data);
    }
  });
  return (
    <Page eyebrow="EDITAIS E PUBLICAÇÕES" title="Oportunidades e documentos públicos"
      description="Uma central de atalhos para as fontes oficiais de editais. Os prazos e documentos devem ser conferidos diretamente nos respectivos portais.">
      <div className="gov-headline"><Info size={24}/><p>O portal consulta registros públicos do PNCP quando o serviço está disponível. Não classifica um processo como aberto sem verificar prazos diretamente na origem. Consulte sempre o edital oficial.</p></div>
      <section className="mb-10">
        <div className="mb-6 flex items-center gap-3"><FileSearch size={24} className="text-clay"/><div><p className="eyebrow">INTEGRAÇÃO GOVERNAMENTAL</p><h2 className="font-display text-3xl">Publicações no PNCP</h2></div></div>
        <p className="mb-5 max-w-3xl text-sm leading-7 text-colonial/75">Consulta ao Portal Nacional de Contratações Públicas, filtrada pelo CNPJ da Prefeitura e por publicações dos últimos 60 dias nas modalidades consultadas. A listagem não é exaustiva.</p>
        {notices.isPending && <p role="status" className="state-panel">Consultando o PNCP…</p>}
        {notices.isError && <p role="alert" className="state-panel">A consulta automática não está disponível agora. Use os portais oficiais abaixo.</p>}
        {notices.data && (!notices.data.available || !notices.data.items.length) && <p className="state-panel">Nenhuma publicação retornada pelos filtros desta consulta, ou fonte temporariamente indisponível. Isso não significa ausência de licitações. Consulte os portais oficiais abaixo.</p>}
        {notices.data?.partial && <p className="mb-5 text-xs text-clay">Consulta parcial: uma ou mais modalidades não responderam.</p>}
        <div className="grid gap-4 md:grid-cols-2">{notices.data?.items.map(n=><a className="official-card" key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"><span className="eyebrow">{n.modality||"Publicação oficial"}</span><h3 className="font-display text-xl">{n.title}</h3><p className="mt-3 text-xs text-colonial/70">{n.organ} · Publicado em {n.published_at ? n.published_at.slice(0,10).split("-").reverse().join("/") : "data não informada"}</p><span className="text-link mt-5">Ver processo no PNCP <ArrowUpRight size={16}/></span></a>)}</div>
        <p className="mt-5 text-xs text-colonial/65">Fonte: <a className="underline" href="https://pncp.gov.br/app/editais" target="_blank" rel="noopener noreferrer">PNCP</a>. Dados recebidos: {notices.data?.queried_at ? new Date(notices.data.queried_at).toLocaleString("pt-BR") : "consulta indisponível"}.</p>
      </section>
      <div className="mb-10 grid gap-5 md:grid-cols-3">
        {listings.map((item) => (
          <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className="official-card group">
            <FileText size={30} className="text-clay"/>
            <h2 className="mt-6 font-display text-2xl">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-colonial/75">{item.description}</p>
            <span className="text-link mt-6">Abrir portal <ArrowUpRight size={17}/></span>
          </a>
        ))}
      </div>
      <section className="mb-14 rounded-3xl border border-colonial/10 bg-white p-8">
        <div className="flex items-center gap-3"><FileSearch size={25} className="text-clay"/><h2 className="font-display text-3xl">Como consultar um edital</h2></div>
        <p className="mt-4 max-w-3xl leading-8 text-colonial/80">Abra o portal de origem, encontre o número do processo e confirme objeto, anexos, data e condições de participação. Em caso de divergência, prevalece sempre a publicação oficial.</p>
        <a className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-clay" href="https://ptn.saojoaodelrei.mg.gov.br/" target="_blank" rel="noopener noreferrer">Consultar no Portal da Transparência <ExternalLink size={17}/></a>
      </section>
    </Page>
  );
}
