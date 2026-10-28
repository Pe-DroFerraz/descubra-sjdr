import { Link } from 'react-router-dom';
import { ArrowUpRight, Camera } from 'lucide-react';
// Visual preview sourced from Wikimedia Commons; external photographs, not Supabase gallery uploads.
const stories = [
  { slug:'igreja-sao-francisco-de-assis-sjdr', title:'Igreja de São Francisco de Assis', label:'Arquitetura e fé', file:'Igreja de São Francisco de Assis, em São Joao Del Rei.jpg' },
  { slug:'museu-regional-sao-joao-del-rei', title:'Museu Regional', label:'História e memória', file:'Museu Regional de São João Del-Rei.jpg' },
  { slug:'catedral-nossa-senhora-do-pilar', title:'Catedral do Pilar', label:'Patrimônio colonial', file:'Igreja de Nossa Senhora do Pilar.jpg' },
  { slug:'museu-ferroviario-estacao-efom', title:'Estação Ferroviária', label:'Viagem no tempo', file:'Estação ferroviária de São João del-Rei.jpg' },
] as const;
export const commonsFile = (file:string) => 'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(file)+'?width=1024';
export const commonsAttribution = (file:string) => 'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(file.replaceAll(' ','_'));
export function EditorialShowcase() {
  return <section className="editorial-showcase" aria-label="Galeria de São João del-Rei">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow">CONHEÇA A CIDADE</p><h2 className="section-title">Uma cidade para <em>sentir.</em></h2>
        <p className="mt-3 max-w-2xl leading-7 text-colonial/70">Uma primeira viagem visual pelo patrimônio de São João del-Rei. Fotos de acervos com fonte identificada; confira detalhes antes de visitar.</p>
      </div><Link className="text-link" to="/lugares">Descobrir mais lugares <ArrowUpRight size={17}/></Link>
    </div>
    <div className="editorial-photo-grid">
      {stories.map((place,i)=><article className={i===0?'editorial-photo-card editorial-photo-lead':'editorial-photo-card'} key={place.slug}>
        <Link to={'/lugares/'+place.slug} className="editorial-photo-link" aria-label={'Conhecer '+place.title}>
          <img src={commonsFile(place.file)} alt={place.title+' em São João del-Rei'} loading={i===0?'eager':'lazy'}
            onError={e=>{const img=e.currentTarget;img.onerror=null;img.src='/heritage.svg';}}/>
          <span className="editorial-photo-shade"/>
          <span className="editorial-photo-copy"><small>{place.label}</small><strong>{place.title}</strong><span>Explorar <ArrowUpRight size={16}/></span></span>
        </Link>
        <a className="photo-credit" href={commonsAttribution(place.file)} target="_blank" rel="noopener noreferrer"><Camera size={12}/> Foto: Wikimedia Commons · autoria e licença</a>
      </article>)}
    </div>
    <p className="mt-4 text-xs text-colonial/60">Créditos e condições de reutilização disponíveis no link de cada fotografia. A galeria é uma apresentação editorial, independente do carregamento do catálogo.</p>
  </section>;
}
