import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Building2, Mail, Megaphone, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { Page } from '../components/tourism/common';
import { Button } from '../components/ui/button';
const plan = z.object({
  id: z.string().uuid(), name: z.string(), slug: z.string(), price_cents: z.number().int().nonnegative(),
  features: z.record(z.unknown()), published: z.boolean()
});
const interest = z.object({
  contact_name: z.string().trim().min(2).max(120),
  business_name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30),
  message: z.string().trim().max(1000),
  plan_slug: z.string().trim().max(100),
  website: z.string().max(0),
  consent: z.boolean().refine((value) => value === true),
});
type Interest = z.infer<typeof interest>;
const fresh: Interest = {
  contact_name: '', business_name: '', email: '', phone: '', message: '', plan_slug: '', website: '', consent: true
};
export default function Partners() {
  const plans = useQuery({
    queryKey: ['public-advertiser-plans'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase indisponível');
      const { data, error } = await supabase.from('plans').select('id,name,slug,price_cents,features,published').eq('published', true).order('price_cents');
      if (error) throw error;
      return z.array(plan).parse(data);
    },
    retry: 1,
  });
  const [fields, setFields] = useState<Interest>(fresh);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<'success'|'error'|'invalid'|null>(null);
  function change<K extends keyof Interest>(key: K, value: Interest[K]) { setFields(previous => ({ ...previous, [key]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const parsed = interest.safeParse(fields);
    if (!parsed.success || !fields.consent) { setFeedback('invalid'); return; }
    if (!supabase) { setFeedback('error'); return; }
    setSending(true);
    setFeedback(null);
    try {
      const { error } = await supabase.functions.invoke('partner-intake', { body: parsed.data });
      if (error) throw error;
      setFeedback('success');
      setFields(fresh);
    } catch { setFeedback('error'); }
    finally { setSending(false); }
  }
  return (
    <Page eyebrow="PARCEIROS E ANÚNCIOS" title="Seu negócio faz parte da experiência"
      description="Apresente seu estabelecimento a quem está explorando São João del-Rei. Consulte os planos publicados e envie uma solicitação de contato, sem contratar ou pagar automaticamente.">
      <section className="partner-hero">
        <div>
          <p className="eyebrow !text-ochre">VISIBILIDADE LOCAL</p>
          <h2 className="max-w-2xl font-display text-4xl leading-tight md:text-5xl">Mais encontros. Mais descobertas. <em className="text-ochre">Mais oportunidades.</em></h2>
          <p className="mt-6 max-w-lg leading-8 text-white/75">O anunciante poderá conectar seu negócio ao roteiro do visitante. A publicação de anúncios depende de aprovação e validação das informações.</p>
          <a className="mt-8 inline-flex items-center gap-2 rounded-full bg-ochre px-6 py-3 font-semibold text-colonial" href="#interesse">Quero anunciar <ArrowRight size={18}/></a>
        </div>
        <div aria-hidden="true" className="partner-visual"><Megaphone size={100} strokeWidth={0.9}/><span>DESCUBRA <b>SJDR</b></span></div>
      </section>
      <div className="my-12 grid gap-5 md:grid-cols-3">
        {[
          {icon: Building2, heading:'Perfil com identidade', description:'Seu endereço, fotos licenciadas e contatos em um lugar só.'},
          {icon: Sparkles, heading:'Descobertas relevantes', description:'Espaço para benefícios e destaques conforme um plano ativo.'},
          {icon: MessageCircle, heading:'Contato direto', description:'Canais próprios para conversar com interessados sem intermediação fictícia.'},
        ].map(({icon:Icon,heading,description}) => <article className="official-card" key={heading}><Icon size={28} className="text-clay"/><h3 className="mt-6 font-display text-2xl">{heading}</h3><p className="mt-3 leading-7 text-colonial/75">{description}</p></article>)}
      </div>
      <section className="py-8">
        <p className="eyebrow">MODELOS DE DIVULGAÇÃO</p>
        <h2 className="section-title">Planos disponíveis</h2>
        <p className="my-5 max-w-2xl text-sm leading-7 text-colonial/70">Preços e benefícios são lidos do banco. Uma consulta de interesse não constitui contratação.</p>
        {plans.isPending && <p role="status">Consultando planos publicados…</p>}
        {plans.isError && <p role="alert" className="text-sm">Os planos não estão disponíveis nesta prévia. Você ainda pode enviar seu interesse.</p>}
        {plans.data?.length === 0 && <p className="state-panel">Ainda não há planos comerciais publicados. Solicite uma proposta para receber informações quando disponíveis.</p>}
        <div className="grid gap-5 md:grid-cols-3">{plans.data?.map(p => <article className="plan-card" key={p.id}>
          <BadgeCheck className="text-clay" size={26}/>
          <h3 className="mt-5 font-display text-3xl">{p.name}</h3>
          <p className="mt-3 text-3xl font-semibold">{p.price_cents === 0 ? 'Gratuito' : (p.price_cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}<span className="text-sm font-normal">{p.price_cents>0?' / mês':''}</span></p>
          <p className="mt-3 text-xs text-colonial/65">Recursos conforme disponibilidade e contrato.</p>
          <a className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-clay" href="#interesse" onClick={()=>change('plan_slug',p.slug)}>Tenho interesse <ArrowRight size={16}/></a>
        </article>)}</div>
      </section>
      <section id="interesse" className="partner-form-shell">
        <div>
          <p className="eyebrow">VAMOS CONVERSAR</p>
          <h2 className="font-display text-4xl">Solicite um contato</h2>
          <p className="mt-5 max-w-md leading-8 text-colonial/75">Preencha os dados do seu negócio. A solicitação é registrada para retorno manual, sem disparos automáticos de WhatsApp.</p>
          <p className="mt-6 flex items-center gap-2 text-sm text-colonial/70"><ShieldCheck size={18}/> Dados usados apenas para responder à solicitação comercial.</p>
        </div>
        <form onSubmit={(e)=>void submit(e)} className="partner-fields">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>Seu nome<input required value={fields.contact_name} onChange={e=>change('contact_name',e.target.value)} maxLength={120}/></label>
            <label>Nome do negócio<input required value={fields.business_name} onChange={e=>change('business_name',e.target.value)} maxLength={160}/></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>E-mail<input required type="email" value={fields.email} onChange={e=>change('email',e.target.value)} maxLength={254}/></label>
            <label>WhatsApp / telefone (opcional)<input type="tel" value={fields.phone} onChange={e=>change('phone',e.target.value)} maxLength={30}/></label>
          </div>
          <label>Plano de interesse<select value={fields.plan_slug} onChange={e=>change('plan_slug',e.target.value)}><option value="">Quero conhecer as opções</option>{plans.data?.map(p=><option value={p.slug} key={p.id}>{p.name}</option>)}</select></label>
          <label>Sua mensagem<textarea value={fields.message} rows={4} maxLength={1000} onChange={e=>change('message',e.target.value)} placeholder="Conte um pouco do negócio…"/></label>
          <div className="hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={fields.website} onChange={e=>change('website',e.target.value)}/></label></div>
          <label className="!flex-row !items-start !gap-3 !text-xs"><input type="checkbox" required checked={fields.consent} onChange={e=>change('consent',e.target.checked)}/> Autorizo o uso destes dados para retorno da minha solicitação.</label>
          <Button type="submit" disabled={sending} className="w-full">{sending ? 'Enviando solicitação…':'Enviar interesse'}</Button>
          {feedback === 'success' && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-900">Solicitação recebida. Nossa equipe poderá entrar em contato pelos dados informados.</p>}
          {feedback === 'error' && <p role="alert" className="text-sm text-clay">Não foi possível registrar. Tente novamente mais tarde.</p>}
          {feedback === 'invalid' && <p role="alert" className="text-sm text-clay">Confira os campos e aceite o uso dos dados.</p>}
          <Link className="text-link" to="/minha-empresa"><Mail size={16}/> Já sou anunciante: gerenciar meus locais</Link>
        </form>
      </section>
    </Page>
  );
}
