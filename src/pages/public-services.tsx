import { ArrowUpRight, BookOpen, Building2, FileText, Landmark, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Page } from '../components/tourism/common';

export const governmentLinks = [
  { title: 'Prefeitura Municipal', kind: 'Portal institucional', url: 'https://www.saojoaodelrei.mg.gov.br/', description: 'Acesso aos canais e publicações da administração municipal.' },
  { title: 'Portal da Transparência', kind: 'Contas públicas e licitações', url: 'https://ptn.imp.saojoaodelrei.mg.gov.br/', description: 'Consulta às informações e procedimentos publicados pelo município.' },
  { title: 'Licitações eletrônicas', kind: 'Processos licitatórios', url: 'https://saojoaodelrei.licitapp.com.br/', description: 'Plataforma referida nos avisos oficiais de licitação. Confira sempre os editais e prazos na fonte.' },
  { title: 'Mapa do Turismo Brasileiro', kind: 'Ministério do Turismo', url: 'https://mapa.turismo.gov.br/mapa/init.html', description: 'Consulta ao mapa nacional das regiões e municípios turísticos.' },
  { title: 'Guia Turístico — Museu Regional', kind: 'Instituto Brasileiro de Museus', url: 'https://museuregionaldesaojoaodelrei.museus.gov.br/guia-de-turismo/', description: 'Guia de atrativos e endereços, última atualização declarada em julho de 2025; confirme horários antes da visita.' },
] as const;
export function SourceCard({source}:{source:typeof governmentLinks[number]}) {
  return (
    <a className="official-card group" href={source.url} target="_blank" rel="noopener noreferrer">
      <div className="flex items-start justify-between gap-3">
        <div className="official-icon"><Landmark size={22}/></div><ArrowUpRight size={19} aria-hidden className="text-clay"/>
      </div>
      <span className="eyebrow mt-6 block">{source.kind}</span>
      <h3 className="font-display text-2xl">{source.title}</h3>
      <p className="mt-3 text-sm leading-6 text-colonial/75">{source.description}</p>
      <span className="text-link mt-5">Acessar fonte oficial <ArrowUpRight size={16}/></span>
    </a>
  );
}
export default function PublicServices() {
  return (
    <Page eyebrow="FONTES E SERVIÇOS PÚBLICOS" title="Informação com origem verificável"
      description="Um ponto de partida para consultar fontes governamentais e culturais. Links externos oficiais, sem vínculo institucional ou parceria formal com a prefeitura.">
      <div className="gov-headline">
        <ShieldCheck size={26}/>
        <p>Mostramos a fonte de cada informação. Datas, horários e editais podem mudar: a versão oficial é sempre a publicada pelo órgão responsável.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {governmentLinks.map(source => <SourceCard key={source.url} source={source}/>)}
      </div>
      <div className="my-14 grid gap-5 lg:grid-cols-2">
        <Link className="feature-panel" to="/editais">
          <FileText size={28}/>
          <span className="eyebrow mt-5">EDITAIS</span>
          <h2 className="font-display text-3xl">Documentos e oportunidades</h2>
          <p className="mt-3 leading-7 opacity-80">Acesse licitações, avisos e processos nos portais responsáveis.</p>
          <span className="mt-6 inline-flex items-center gap-2 font-semibold">Consultar editais <ArrowUpRight size={18}/></span>
        </Link>
        <a className="feature-panel feature-panel-light" href="https://museuregionaldesaojoaodelrei.museus.gov.br/guia-de-turismo/" target="_blank" rel="noopener noreferrer">
          <BookOpen size={28}/>
          <span className="eyebrow mt-5">GUIA CULTURAL</span>
          <h2 className="font-display text-3xl">Memória e patrimônio</h2>
          <p className="mt-3 leading-7 opacity-80">Confira a publicação do Museu Regional antes de planejar sua visita.</p>
          <span className="mt-6 inline-flex items-center gap-2 font-semibold">Abrir guia <ArrowUpRight size={18}/></span>
        </a>
      </div>
      <p className="mb-14 flex gap-3 text-sm text-colonial/65"><Building2 size={18}/> Esta página organiza acessos a fontes externas; não reproduz uma API oficial em tempo real.</p>
    </Page>
  );
}
