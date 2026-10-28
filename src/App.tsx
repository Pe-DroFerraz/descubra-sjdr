import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Heart, Landmark, Menu, X } from 'lucide-react';
import { ClockProvider } from './hooks/clock';
import { TripProvider, useTrip } from './trip-context';
import { AuthProvider } from './auth/context';
import { Page } from './components/tourism/common';
const Admin = lazy(() => import('./admin/panel'));
const SignIn = lazy(() => import('./pages/auth'));
const Account = lazy(() =>
  import('./pages/auth').then((module) => ({ default: module.Account })),
);
const Recover = lazy(() =>
  import('./pages/auth').then((module) => ({ default: module.Recover })),
);
const AuthCallback = lazy(() =>
  import('./pages/auth').then((module) => ({ default: module.AuthCallback })),
);
const NewPassword = lazy(() =>
  import('./pages/auth').then((module) => ({ default: module.NewPassword })),
);
const Home = lazy(() => import('./pages/home'));
const Map3D = lazy(() => import('./pages/map3d'));
const PublicServices = lazy(() => import('./pages/public-services'));
const PublicNotices = lazy(() => import('./pages/public-notices'));
const Partners = lazy(() => import('./pages/partners'));
const AdvertiserStudio = lazy(() => import('./pages/advertiser'));
const Places = lazy(() => import('./pages/places'));
const PlaceDetail = lazy(() => import('./pages/place-detail'));
const RoutesPage = lazy(() => import('./pages/routes'));
const RouteDetail = lazy(() =>
  import('./pages/routes').then((module) => ({ default: module.RouteDetail })),
);
const Events = lazy(() => import('./pages/events'));
const EventDetail = lazy(() =>
  import('./pages/events').then((module) => ({ default: module.EventDetail })),
);
const Tips = lazy(() => import('./pages/tips'));
const Trip = lazy(() => import('./pages/trip'));
const navigation = [
  ['/lugares', 'places'],
  ['/mapa', 'map'],
  ['/roteiros', 'routes'],
  ['/eventos', 'events'],
  ['/dicas', 'tips'],
  ['/mapa-3d', 'Mapa 3D'],
  ['/editais', 'Editais'],
  ['/anuncie', 'Anuncie'],
] as const;
function Layout() {
  const { t, i18n } = useTranslation();
  const trip = useTrip();
  const location = useLocation();
  const [menu, setMenu] = useState(false),
    [privacy, setPrivacy] = useState(false);
  useEffect(() => {
    setMenu(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.title = `${t(navigation.find(([url]) => location.pathname === url || location.pathname.startsWith(url + '/'))?.[1] ?? 'home')} · Descubra SJDR`;
  }, [i18n.language, location.pathname, t]);
  function language(value: string) {
    void i18n.changeLanguage(value);
    try {
      localStorage.setItem('sjdr-language', value);
    } catch {
      /* Language still works for this session. */
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        {t('skip')}
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand" aria-label="Descubra SJDR">
            <span className="brand-icon">
              <Landmark size={28} strokeWidth={1.4} />
            </span>
            <span>
              descubra<span className="brand-city">SÃO JOÃO DEL-REI</span>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label={t('menu')}>
            {navigation.map(([to, key]) => (
              <NavLink key={to} to={to}>
                {t(key)}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <label className="language-select">
              <span className="sr-only">{t('language')}</span>
              <select
                value={i18n.language.slice(0, 2)}
                onChange={(e) => language(e.target.value)}
              >
                <option value="pt">PT</option>
                <option value="en">EN</option>
                <option value="es">ES</option>
              </select>
            </label>
            <Link
              to="/favoritos"
              className="trip-link"
              aria-label={t('favorites')}
            >
              <Heart size={18} />
              <span className="hidden sm:inline">{t('favorites')}</span>
              {trip.items.length > 0 && (
                <span className="trip-count">{trip.items.length}</span>
              )}
            </Link>
            <button
              className="icon-button lg:hidden"
              aria-label={t('menu')}
              aria-expanded={menu}
              aria-controls="mobile-navigation"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menu && (
          <nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label={t('menu')}
          >
            {navigation.map(([to, key]) => (
              <NavLink key={to} to={to}>
                {t(key)}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main id="main" tabIndex={-1}>
        {i18n.language !== 'pt' && (
          <p className="bg-white px-5 py-3 text-center text-xs text-colonial/80">
            {t('contentLanguage')}
          </p>
        )}
        <Suspense
          fallback={
            <div className="state-panel" role="status">
              {t('loading')}
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/entrar" element={<SignIn />} />
            <Route path="/conta" element={<Account />} />
            <Route path="/recuperar-senha" element={<Recover />} />
            <Route path="/auth/confirmar" element={<AuthCallback />} />
            <Route path="/auth/nova-senha" element={<NewPassword />} />
            <Route path="/lugares" element={<Places />} />
            <Route path="/lugares/:slug" element={<PlaceDetail />} />
            <Route path="/mapa" element={<Places map />} />
            <Route path="/mapa-3d" element={<Map3D />} />
            <Route path="/servicos-oficiais" element={<PublicServices />} />
            <Route path="/editais" element={<PublicNotices />} />
            <Route path="/anuncie" element={<Partners />} />
            <Route path="/minha-empresa" element={<AdvertiserStudio />} />
            <Route path="/roteiros" element={<RoutesPage />} />
            <Route path="/roteiros/:slug" element={<RouteDetail />} />
            <Route path="/eventos" element={<Events />} />
            <Route path="/eventos/:id" element={<EventDetail />} />
            <Route path="/dicas" element={<Tips />} />
            <Route path="/favoritos" element={<Trip />} />
            <Route
              path="/q/:code"
              element={<Page title="QR Code" description={t('qrPending')} />}
            />
            <Route
              path="*"
              element={
                <Page title={t('notFound')}>
                  <Link className="text-link" to="/">
                    {t('back')} <ArrowRight size={16} />
                  </Link>
                </Page>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <footer className="site-footer">
        <div className="page-shell">
          <div className="footer-grid">
            <div>
              <Link to="/" className="brand">
                <Landmark size={30} />
                <span>
                  descubra<span className="brand-city">SÃO JOÃO DEL-REI</span>
                </span>
              </Link>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
                {t('footerText')}
              </p>
            </div>
            <nav
              className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm"
              aria-label={t('discover')}
            >
              {navigation.map(([to, key]) => (
                <Link key={to} to={to}>
                  {t(key)}
                </Link>
              ))}
              <Link to="/favoritos">{t('favorites')}</Link>
              <Link to="/conta">{t('auth.account')}</Link>
              <Link to="/servicos-oficiais">Serviços oficiais</Link>
            </nav>
            <div className="max-w-xs">
              <p className="text-sm leading-relaxed text-white/70">
                {t('footerNote')}
              </p>
              <button
                onClick={() => setPrivacy(!privacy)}
                aria-expanded={privacy}
                className="mt-4 text-sm underline underline-offset-4"
              >
                {t('privacy')}
              </button>
              {privacy && (
                <p className="mt-4 text-sm text-white/80">{t('privacyText')}</p>
              )}
            </div>
          </div>
          <div className="footer-bottom">
            <span>São João del-Rei · Minas Gerais · Brasil</span>
            <span>© {new Date().getFullYear()} Descubra SJDR</span>
          </div>
        </div>
      </footer>
      {trip.storageError && (
        <div
          className="fixed bottom-4 left-4 right-4 z-[1100] rounded-xl bg-white p-4 shadow-xl"
          role="alert"
        >
          {t('storageError')}
        </div>
      )}
    </>
  );
}
export default function App() {
  return (
    <AuthProvider>
      <ClockProvider>
        <TripProvider>
          <Layout />
        </TripProvider>
      </ClockProvider>
    </AuthProvider>
  );
}
