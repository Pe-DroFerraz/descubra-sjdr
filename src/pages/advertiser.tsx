import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { z } from 'zod';
import { ArrowLeft, Building2, CheckCircle2, PencilLine, Plus, Save, Send } from 'lucide-react';
import { useAuth } from '../auth/context';
import { supabase } from '../lib/supabase';
import { Page, Notice } from '../components/tourism/common';
import { Button } from '../components/ui/button';

const companySchema = z.object({
  id: z.string().uuid(), name: z.string(), status: z.string()
});
const placeSchema = z.object({
  id: z.string().uuid(), advertiser_id: z.string().uuid(), category_id: z.string().uuid(),
  slug: z.string(), name: z.string(), description: z.string(), address: z.string().nullable(),
  phone: z.string().nullable(), whatsapp: z.string().nullable(), website: z.string().nullable(),
  status: z.string(), updated_at: z.string()
});
const categorySchema = z.object({ id: z.string().uuid(), name: z.string(), slug: z.string() });
const editorSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  description: z.string().trim().max(20000),
  category_id: z.string().uuid(),
  address: z.string().trim().max(1000),
  phone: z.string().trim().max(80),
  whatsapp: z.string().trim().max(80),
  website: z.union([z.literal(''), z.string().url().startsWith('https://')]),
});
type Editor = z.infer<typeof editorSchema>;
const initial: Editor = { name:'',slug:'',description:'',category_id:'',address:'',phone:'',whatsapp:'',website:'' };
const companiesKey = (uid?: string) => ['advertiser','companies',uid] as const;
const placesKey = (uid?: string, company?: string) => ['advertiser','places',uid,company] as const;

export default function AdvertiserStudio() {
  const auth = useAuth();
  const cache = useQueryClient();
  const companies = useQuery({
    queryKey: companiesKey(auth.user?.id),
    enabled: Boolean(auth.user && supabase && !auth.pending),
    queryFn: async () => {
      if (!supabase || !auth.user) throw new Error('not authenticated');
      const { data, error } = await supabase.from('advertisers').select('id,name,status').eq('owner_id',auth.user.id).order('name');
      if (error) throw error;
      return z.array(companySchema).parse(data);
    },
  });
  const [companyId,setCompanyId] = useState('');
  const current = companies.data?.find(x=>x.id===companyId) ?? companies.data?.[0];
  const places = useQuery({
    queryKey: placesKey(auth.user?.id,current?.id),
    enabled: Boolean(current?.id && auth.user && supabase && !auth.pending),
    queryFn: async () => {
      if (!supabase || !current) throw new Error('not ready');
      const {data,error}=await supabase.from('places')
        .select('id,advertiser_id,category_id,slug,name,description,address,phone,whatsapp,website,status,updated_at')
        .eq('advertiser_id', current.id).order('name');
      if(error)throw error;
      return z.array(placeSchema).parse(data);
    },
  });
  const categories = useQuery({
    queryKey: ['advertiser','published-categories'],
    enabled: Boolean(auth.user && supabase && !auth.pending),
    queryFn: async () => {
      if (!supabase) throw new Error('not ready');
      const { data, error } = await supabase.from('categories').select('id,name,slug').eq('published',true).order('name');
      if(error)throw error;
      return z.array(categorySchema).parse(data);
    },
  });
  const [form,setForm] = useState<Editor>(initial);
  const [editing,setEditing]=useState<{id:string;updated_at:string;status:string}|null>(null);
  const [showForm,setShowForm]=useState(false);
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState('');
  function edit(p: z.infer<typeof placeSchema>) {
    setEditing({id:p.id, updated_at:p.updated_at,status:p.status});
    setForm({ name:p.name, slug:p.slug, description:p.description, category_id:p.category_id,
      address:p.address??'',phone:p.phone??'',whatsapp:p.whatsapp??'',website:p.website??'' });
    setShowForm(true);setFeedback('');
  }
  async function save(e: FormEvent, submitForReview:boolean) {
    e.preventDefault();
    if (!supabase || !current || busy || current.status!=='approved') return;
    const parsed=editorSchema.safeParse(form);
    if (!parsed.success) {setFeedback('Revise os campos. O endereço do site deve começar por https://.');return;}
    if (editing && editing.status!=='draft' && editing.status!=='pending') {
      setFeedback('Conteúdo já publicado não pode ser editado diretamente. Solicite revisão.');return;
    }
    setBusy(true);setFeedback('');
    const v=parsed.data;
    const payload={
      name:v.name, slug:v.slug, description:v.description, category_id:v.category_id,
      address:v.address||null,phone:v.phone||null,whatsapp:v.whatsapp||null,
      website:v.website||null, status:submitForReview?'pending':'draft',
      verified_at:null,is_demo:false,advertiser_id:current.id
    };
    try {
      if (editing) {
        const {data,error}=await supabase.from('places').update(payload)
          .eq('id',editing.id).eq('advertiser_id',current.id)
          .eq('updated_at',editing.updated_at)
          .select('id,updated_at').maybeSingle();
        if(error)throw error;
        if(!data){setFeedback('O registro mudou. Recarregue antes de editar.');return;}
      } else {
        const {error}=await supabase.from('places').insert(payload);
        if(error)throw error;
      }
      await cache.invalidateQueries({queryKey:placesKey(auth.user?.id,current.id)});
      setShowForm(false);setEditing(null);setForm(initial);
      setFeedback(submitForReview?'Estabelecimento enviado para revisão.':'Rascunho salvo.');
    } catch {
      setFeedback('Não foi possível salvar. Verifique suas permissões e os campos.');
    } finally {setBusy(false);}
  }
  if(auth.pending)return <Page title="Área do anunciante"><p role="status">Validando sua sessão…</p></Page>;
  if(!auth.user)return <Navigate to="/entrar?next=%2Fconta" replace/>;
  return (
    <Page title="Minha empresa" eyebrow="GESTÃO DO ANUNCIANTE"
      description="Acompanhe os seus estabelecimentos, atualize os rascunhos e envie conteúdo para revisão antes da publicação.">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link to="/anuncie" className="text-link"><ArrowLeft size={16}/> Sobre os planos de divulgação</Link>
        <span className="inline-flex items-center gap-2 text-xs"><Building2 size={16}/> Acesso associado à sua conta</span>
      </div>
      {companies.isLoading && <p role="status">Carregando empresas…</p>}
      {companies.isError && <Notice>Não foi possível confirmar suas empresas. Verifique seu acesso.</Notice>}
      {companies.data?.length === 0 && <div className="state-panel"><Building2 className="mx-auto mb-5" size={38}/><h2>Seu cadastro ainda não foi vinculado a uma empresa</h2><p>Envie seu interesse pela página de anúncios. O vínculo com uma empresa depende de aprovação e não é criado automaticamente.</p><Link className="text-link mt-5" to="/anuncie">Solicitar cadastro</Link></div>}
      {Boolean(companies.data?.length) && current && (
        <>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-5 rounded-2xl border border-colonial/10 bg-white p-6">
            <label className="filter-label grow">Estabelecimento responsável
              <select className="min-w-56" value={current.id} onChange={e=>{setCompanyId(e.target.value);setShowForm(false);setEditing(null);setFeedback('');}}>
                {companies.data?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <span className="pill bg-ivory">{current.status==='approved'?'Conta aprovada':'Aguardando aprovação'}</span>
          </div>
          {current.status!=='approved' && <Notice>Seu cadastro está em análise. A edição de estabelecimentos só fica disponível após a aprovação.</Notice>}
          {feedback && <p role="status" className="my-5 rounded-xl bg-white p-4 text-sm">{feedback}</p>}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="section-title">Meus locais</h2>
            <Button disabled={current.status!=='approved'} onClick={()=>{setEditing(null);setForm({...initial,category_id:categories.data?.[0]?.id??''});setShowForm(true);setFeedback('');}}>
              <Plus size={16} className="mr-2"/> Novo local
            </Button>
          </div>
          {showForm && (
            <form onSubmit={e=>void save(e,false)} className="partner-fields mb-8 rounded-3xl border border-colonial/10 bg-white p-6">
              <h3 className="font-display text-2xl">{editing?'Editar estabelecimento':'Novo estabelecimento'}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label>Nome<input required maxLength={200} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
                <label>Slug (endereço da página)<input required value={form.slug} maxLength={160} onChange={e=>setForm({...form,slug:e.target.value.toLowerCase().replaceAll(' ','-')})}/></label>
                <label>Categoria<select required value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}>
                  <option value="">Selecione</option>{categories.data?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select></label>
                <label>Endereço<input maxLength={1000} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
                <label>Telefone<input maxLength={80} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
                <label>WhatsApp<input maxLength={80} value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})}/></label>
                <label>Website HTTPS<input type="url" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></label>
              </div>
              <label>Descrição<textarea rows={5} maxLength={20000} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
              {categories.data?.length===0 && <Notice>Nenhuma categoria publicada no momento. O cadastro de lugares depende de categorias disponíveis.</Notice>}
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={busy||!categories.data?.length}><Save size={16} className="mr-2"/> Salvar rascunho</Button>
                <Button variant="outline" type="button" disabled={busy||!categories.data?.length}
                  onClick={e=>void save(e as unknown as FormEvent,true)}><Send size={16} className="mr-2"/> Enviar para revisão</Button>
                <Button variant="outline" type="button" onClick={()=>{setShowForm(false);setEditing(null);}}>Cancelar</Button>
              </div>
            </form>
          )}
          {places.isLoading && <p role="status">Buscando locais…</p>}
          {places.isError && <Notice>Não foi possível consultar seus locais.</Notice>}
          {places.data?.length===0 && <div className="state-panel">Ainda não existem locais vinculados a esta empresa.</div>}
          <div className="grid gap-4 md:grid-cols-2">{places.data?.map(p=><article key={p.id} className="official-card">
            <div className="flex justify-between gap-3"><h3 className="font-display text-2xl">{p.name}</h3><span className="pill bg-ivory">{p.status}</span></div>
            <p className="my-4 line-clamp-3 text-sm leading-7 text-colonial/70">{p.description||'Sem descrição'}</p>
            {(p.status==='draft'||p.status==='pending') ? <Button variant="outline" onClick={()=>edit(p)}><PencilLine size={16} className="mr-2"/> Editar</Button>:<p className="inline-flex items-center gap-2 text-xs"><CheckCircle2 size={16}/> Edição sujeita a revisão</p>}
          </article>)}</div>
        </>
      )}
    </Page>
  );
}
