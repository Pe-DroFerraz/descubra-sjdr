import {Link} from 'react-router-dom';
import AdminCommandCenter from './command-center';
import {ArrowUpRight} from 'lucide-react';
export default function AdminDemo(){
 return <div className="oc-demo-surface">
   <header className="oc-demo-head">
     <div><span>sj.</span><section><h1>Central de Gestão — Demonstração</h1><p>Explore o backend visual antes de criar seu primeiro administrador.</p></section></div>
     <Link to="/estudio">Abrir Ateliê Visual <ArrowUpRight size={16}/></Link>
   </header>
   <AdminCommandCenter demoMode/>
 </div>;
}
