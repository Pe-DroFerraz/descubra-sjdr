import { ArrowUpRight, ExternalLink, FileSearch, FileText, Info } from 'lucide-react';
import { Page } from '../components/tourism/common';
const listings = [
  { title: 'Licitações e contratos — Transparência', url: 'https://ptn.saojoaodelrei.mg.gov.br/', description: 'Consulte processos, licitações e contratos divulgados pela administração.' },
  { title: 'Portal institucional da Prefeitura', url: 'https://www.saojoaodelrei.mg.gov.br/', description: 'Acompanhe os avisos, atos, editais e comunicados publicados no site oficial.' },
  { title: 'Sistema de licitações eletrônicas', url: 'https://saojoaodelrei.licitapp.com.br/', description: 'Acesse os certames eletrônicos e os documentos disponíveis na plataforma.' },
] as const;
export default function PublicNotices() {
  return (
    <Page eyebrow="EDITAIS E PUBLICAÇÕES" title="Oportunidades e documentos públicos"
      description="Uma central de atalhos para as fontes oficiais de editais. Os prazos e documentos devem ser conferidos diretamente nos respectivos portais.">
      <div className="gov-headline"><Info size={24}/><p>Não existe, nesta etapa, sincronização automática ou certificação de editais. Não exibimos processos como abertos sem consulta atualizada à fonte oficial.</p></div>
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
