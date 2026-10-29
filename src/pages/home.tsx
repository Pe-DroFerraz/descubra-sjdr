import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Compass, MapPinned, Search, ShieldCheck } from 'lucide-react';
import { usePlaces } from '../data/queries';
import { journeys, topics, visitorGuide } from '../data/editorial';
import { EditorialImage } from '../components/tourism/editorial-image';
import { HeritagePhoto } from '../components/tourism/heritage-photo';
export default function Home() {
  const {t}=useTranslation();
  const navigate=useNavigate();
  const [search,setSearch]=useState('');
  const places=usePlaces();
  function submit(e:FormEvent){e.preventDefault();navigate('/explorar'+(search.trim()?'?q='+encodeURIComponent(search.trim()):''));}
  return <>
    <section className="destination-hero">
      <div className="destination-hero-image"><EditorialImage photo="francisco" eager credit={false}/></div>
      <div className="destination-hero-overlay"/>
      <div className="destination-hero-inner">
        <p className="destination-overline"><span className="destination-diamond"/> SÃO JOÃO DEL-REI · MINAS GERAIS</p>
        <h1 aria-label="Uma cidade para sentir">Uma cidade<br/>para <em>sentir.</em></h1>
        <p className="destination-hero-lead">Descubra lugares, histórias e experiências que fazem de cada viagem uma memória.</p>
        <div className="destination-hero-actions">
          <Link className="destination-button-primary" to="/explorar">Comece a explorar <ArrowUpRight size={19}/></Link>
          <Link className="destination-button-light" to="/planejar">Monte sua viagem <ArrowRight size={18}/></Link>
        </div>
        <form className="destination-hero-search" onSubmit={submit}>
          <Search size={19} aria-hidden/>
          <label htmlFor="destination-search" className="sr-only">{t('searchLabel')}</label>
          <input id="destination-search" value={search} onChange={e=>setSearch(e.target.value)}
            maxLength={120} placeholder="Igrejas, museus, experiências..." />
          <button type="submit">{t('search')} <ArrowRight size={17}/></button>
        </form>
        <div className="destination-hero-foot"><span>01 — 04</span><span>Herança, cultura e novos caminhos</span><a href="#conheca" aria-label="Descer para experiências"><ArrowDownRight size={24}/></a></div>
      </div>
      <a className="destination-hero-photo-credit" href="https://commons.wikimedia.org/wiki/File:Igreja_de_S%C3%A3o_Francisco_de_Assis%2C_S%C3%A3o_Jo%C3%A3o_del-Rei%2C_MG_-_2023-11-08_-_DSC05317.jpg" target="_blank" rel="noopener noreferrer">Fotografia: Wikimedia Commons · ver licença</a>
    </section>

    <div className="destination-intro-strip">
      <span>DESTINO DE MUITAS HISTÓRIAS</span><p>Arquitetura que encanta. Cultura que permanece. Experiências que surpreendem.</p><Link to="/roteiros">Conheça os roteiros <ArrowUpRight size={16}/></Link>
    </div>

    <section className="destination-section" id="conheca">
      <div className="destination-section-head">
        <div><p className="destination-kicker">ESCOLHA SUA EXPERIÊNCIA</p><h2 aria-label="Existe um São João para cada viajante">Existe um São João<br/><em>para cada viajante.</em></h2></div>
        <p>Explore a cidade a partir do que mais desperta sua curiosidade. História, cultura, natureza e encontros inesperados.</p>
      </div>
      <div className="destination-mosaic">
        {topics.map((topic,i)=><article key={topic.id} className={'destination-mosaic-item '+(i===0?'destination-mosaic-lead':'')}>
          <EditorialImage photo={topic.image} />
          <div className="destination-mosaic-scrim"/>
          <div className="destination-mosaic-content">
            <span>{topic.eyebrow}</span>
            <h3>{topic.name}</h3>
            <p>{topic.copy}</p>
            <Link to={'/explorar?interesse='+topic.id} className="destination-circle-link" aria-label={'Explorar '+topic.name}><ArrowUpRight size={21}/></Link>
          </div>
        </article>)}
      </div>
    </section>

    <section className="destination-feature">
      <div className="destination-feature-photo"><EditorialImage photo="carmo" /></div>
      <div className="destination-feature-copy">
        <p className="destination-kicker">O MELHOR DA VIAGEM</p>
        <h2>Mais do que ver.<br/><em>É viver o lugar.</em></h2>
        <p>Entre o som dos sinos e as ruas de pedra, a cidade guarda histórias que não cabem em um roteiro apressado.</p>
        <p>Nossa proposta é ajudar você a descobrir com contexto, respeitando o patrimônio e apoiando quem faz a cidade acontecer.</p>
        <Link className="destination-text-link" to="/explorar">Descubra os lugares <ArrowRight size={18}/></Link>
      </div>
    </section>

    <section className="destination-section destination-journeys">
      <div className="destination-section-head">
        <div><p className="destination-kicker">ROTEIROS COM PROPÓSITO</p><h2 aria-label="Seus próximos dias começam aqui">Seus próximos dias<br/><em>começam aqui.</em></h2></div>
        <div><p>Experiências organizadas para você aproveitar melhor o tempo, sem perder a liberdade de explorar.</p><Link className="destination-text-link" to="/roteiros">Todos os roteiros <ArrowUpRight size={18}/></Link></div>
      </div>
      <div className="destination-journey-grid">
        {journeys.map((r,i)=><article className="destination-journey-card" key={r.slug}>
          <div className="destination-journey-photo"><EditorialImage photo={r.image}/><span>{String(i+1).padStart(2,'0')}</span></div>
          <div className="destination-journey-body"><p>{r.label} · {r.duration}</p><h3>{r.title}</h3><span>{r.short}</span>
            <Link to={'/roteiros/guias/'+r.slug}>Ver roteiro completo <ArrowUpRight size={17}/></Link></div>
        </article>)}
      </div>
    </section>

    <section className="destination-planner-teaser">
      <div><p className="destination-kicker">SEU TEMPO, SUA VIAGEM</p><h2>Você escolhe o ritmo.<br/><em>A cidade faz o resto.</em></h2>
        <p>Uma tarde, um fim de semana ou a primeira visita. Escolha seus interesses e personalize um percurso para levar com você.</p>
        <Link className="destination-button-gold" to="/planejar">Planejar minha viagem <ArrowUpRight size={19}/></Link>
      </div>
      <div className="destination-planner-graphic"><span>MG</span><span>21°08′ S / 44°15′ W</span><Compass size={110} strokeWidth={.65} /><strong>SÃO JOÃO<br/>DEL-REI</strong></div>
    </section>

    <section className="destination-section">
      <div className="destination-section-head">
        <div><p className="destination-kicker">PATRIMÔNIO PARA DESCOBRIR</p><h2>Ícones que contam<br/><em>a nossa história.</em></h2></div>
        <Link className="destination-text-link" to="/lugares">Consultar atrações do catálogo <ArrowRight size={18}/></Link>
      </div>
      <div className="destination-places-grid">
        {(places.data?.length? places.data.slice(0,3) : [
          {id:'heritage1',slug:'igreja-sao-francisco-de-assis-sjdr',name:'Igreja de São Francisco de Assis'},
          {id:'heritage2',slug:'museu-regional-sao-joao-del-rei',name:'Museu Regional'},
          {id:'heritage3',slug:'catedral-nossa-senhora-do-pilar',name:'Catedral Basílica do Pilar'},
        ]).map((place,i)=><article className="destination-place" key={place.id}>
          <div className="destination-place-photo"><HeritagePhoto slug={place.slug} alt={place.name}/></div>
          <span>{String(i+1).padStart(2,'0')} / SÃO JOÃO DEL-REI</span>
          <h3>{place.name}</h3>
          <Link to={'/lugares/'+place.slug}>Conhecer <ArrowUpRight size={16}/></Link>
        </article>)}
      </div>
    </section>

    <section className="destination-map-teaser">
      <div className="destination-map-image"><EditorialImage photo="serra"/></div>
      <div className="destination-map-copy"><MapPinned size={30}/><p className="destination-kicker">ALÉM DO CENTRO HISTÓRICO</p>
        <h2>A região é um<br/><em>convite para ir além.</em></h2>
        <p>Descubra o entorno de São João del-Rei, encontre os lugares no mapa e crie seu próprio caminho.</p>
        <Link to="/mapa-3d" className="destination-button-primary">Explore no mapa <ArrowUpRight size={18}/></Link>
      </div>
    </section>

    <section className="destination-community">
      <div><p className="destination-kicker">UMA CIDADE FEITA DE PESSOAS</p><h2>Seu negócio também<br/><em>faz parte dessa história.</em></h2><p>Um espaço para empreendedores locais, turismo e cultura se encontrarem. Anúncios identificados e informações revisadas, sem parcerias institucionais implícitas.</p></div>
      <div className="destination-community-actions"><Link className="destination-button-dark" to="/anuncie">Anuncie no Descubra <ArrowUpRight size={17}/></Link>
      <Link className="destination-text-link" to="/servicos-oficiais"><ShieldCheck size={16}/> Consulte fontes oficiais</Link></div>
    </section>
    <p className="destination-source-note">Roteiros editoriais baseados em referências culturais e no <a href={visitorGuide} target="_blank" rel="noopener noreferrer">guia turístico do Museu Regional</a> (atualizado em julho de 2025). Confira funcionamento e condições de visita diretamente com os responsáveis.</p>
  </>;
}
