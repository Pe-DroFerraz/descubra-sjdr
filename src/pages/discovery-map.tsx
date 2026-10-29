import { Link } from 'react-router-dom';
import { ArrowRight, Compass, MapPinned, Route } from 'lucide-react';
import { DestinationMap } from '../components/tourism/destination-map';
export default function DiscoverMap(){
 return <>
   <header className="map-landing-heading">
     <div><span className="map-landing-kicker"><MapPinned size={18}/> SEU GUIA DE BOLSO</span>
       <h1>Descubra a cidade.<br/><em>Encontre o caminho.</em></h1>
       <p>Igrejas, museus, gastronomia e eventos em um mapa feito para explorar São João del-Rei. Veja os pontos no mapa, filtre seus interesses e use sua localização somente se quiser.</p></div>
     <Link className="map-landing-secondary" to="/roteiros"><Route size={20}/> Ver roteiros prontos <ArrowRight size={17}/></Link>
   </header>
   <div className="destination-map-page"><DestinationMap/></div>
   <section className="map-planning-banner"><div><Compass size={30}/><h2>Vai passar alguns dias por aqui?</h2><p>Monte seu caminho com visitas, igrejas e experiências — e confira endereços antes de sair.</p></div><Link to="/planejar">Planejar minha visita <ArrowRight size={17}/></Link></section>
 </>;
}
