import { EditorialImage } from './editorial-image';
import type { PhotoKey } from '../../data/editorial';
const photoMap:Record<string,PhotoKey>={
 'igreja-sao-francisco-de-assis-sjdr':'francisco',
 'museu-regional-sao-joao-del-rei':'museum',
 'catedral-nossa-senhora-do-pilar':'pilar',
 'museu-ferroviario-estacao-efom':'station',
};
export function HeritagePhoto({slug,alt}:{slug:string;alt:string}) {
  const key=photoMap[slug];
  return key?<EditorialImage photo={key} alt={alt} />:<img className="h-full w-full object-cover" src="/heritage.svg" alt="Ilustração do patrimônio local"/>;
}
