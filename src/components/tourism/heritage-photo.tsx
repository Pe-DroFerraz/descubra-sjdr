import { commonsFile, commonsAttribution } from './editorial-showcase';
const photos: Record<string,string> = {
  'igreja-sao-francisco-de-assis-sjdr':'Igreja de São Francisco de Assis, em São Joao Del Rei.jpg',
  'museu-regional-sao-joao-del-rei':'Museu Regional de São João Del-Rei.jpg',
  'catedral-nossa-senhora-do-pilar':'Igreja de Nossa Senhora do Pilar.jpg',
  'museu-ferroviario-estacao-efom':'Estação ferroviária de São João del-Rei.jpg',
};
export function HeritagePhoto({slug, alt}:{slug:string;alt:string}) {
  const file=photos[slug];
  if(!file)return <img className="h-full w-full object-cover" src="/heritage.svg" alt="Ilustração do patrimônio cultural da cidade"/>;
  return <div className="relative h-full w-full">
    <img className="h-full w-full object-cover" src={commonsFile(file)} alt={alt} loading="lazy"
      onError={e=>{const img=e.currentTarget;img.onerror=null;img.src='/heritage.svg';}}/>
    <a href={commonsAttribution(file)} target="_blank" rel="noopener noreferrer" className="heritage-credit" onClick={e=>e.stopPropagation()}>Imagem: Wikimedia Commons · créditos</a>
  </div>;
}
