import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import api from '../api/axios';
import EstablishmentCard from '../components/EstablishmentCard';
import { MapPin, SlidersHorizontal, RefreshCw, Navigation, Zap, ChevronLeft, ChevronRight, EyeOff, Eye, LayoutGrid, List, Maximize2, Minimize2 } from 'lucide-react';
import './Home.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CATEGORY_ICON = {
  supermarket: '🛒', pharmacy: '💊', bakery: '🥖', butcher: '🥩',
  restaurant: '🍽️', convenience: '🏪', petshop: '🐾', electronics: '📱',
  clothing: '👔', other: '🏬',
};

const CATEGORY_LABELS = {
  supermarket: 'Supermercado', pharmacy: 'Farmácia', bakery: 'Padaria',
  butcher: 'Açougue', restaurant: 'Restaurante', convenience: 'Conveniência',
  petshop: 'Pet Shop', electronics: 'Eletrônicos', clothing: 'Vestuário', other: 'Outros',
};

const CATEGORY_COLOR = {
  supermarket: '#10B981', pharmacy: '#3B82F6', bakery: '#F59E0B',
  butcher: '#EF4444', restaurant: '#F97316', convenience: '#8B5CF6',
  petshop: '#EC4899', electronics: '#06B6D4', clothing: '#6366F1', other: '#6B7280',
};

function makeIcon(est) {
  if (est.isSponsored) {
    return new L.DivIcon({
      html: `<div style="background:linear-gradient(135deg,#FF5A1F,#FF2D55);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(255,90,31,0.5);font-size:16px;">⚡</div>`,
      className: '', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22],
    });
  }
  const color = CATEGORY_COLOR[est.category] || '#6B7280';
  const icon = CATEGORY_ICON[est.category] || '🏬';
  return new L.DivIcon({
    html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.25);font-size:16px;">${icon}</div>`,
    className: '', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -22],
  });
}

const userIcon = new L.DivIcon({
  html: `<div style="background:#3B82F6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 5px rgba(59,130,246,0.25);"></div>`,
  className: '', iconSize: [16, 16], iconAnchor: [8, 8],
});

const CATEGORIES = [
  { value: '', label: 'Todos' },
  { value: 'supermarket', label: '🛒 Supermercado' },
  { value: 'pharmacy', label: '💊 Farmácia' },
  { value: 'bakery', label: '🥖 Padaria' },
  { value: 'butcher', label: '🥩 Açougue' },
  { value: 'restaurant', label: '🍽️ Restaurante' },
  { value: 'convenience', label: '🏪 Conveniência' },
  { value: 'petshop', label: '🐾 Pet Shop' },
  { value: 'electronics', label: '📱 Eletrônicos' },
  { value: 'other', label: '🏬 Outros' },
];

const MOGI_CENTER = { lat: -23.5232, lng: -46.1897 };
const PAGE_SIZE = 12;

function FlyToUser({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.flyTo([location.lat, location.lng], 16, { duration: 1.2 });
  }, [location, map]);
  return null;
}

function InvalidateOnResize({ trigger }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 220);
    return () => clearTimeout(t);
  }, [trigger, map]);
  return null;
}

export default function Home() {
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(MOGI_CENTER);
  const [category, setCategory] = useState('');
  const [radius, setRadius] = useState(5000);
  const [locating, setLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [listView, setListView] = useState('cards');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const categoriesRef = useRef(null);

  useEffect(() => {
    if (!mapFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setMapFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [mapFullscreen]);

  const fetchEstablishments = useCallback(async (loc, cat, rad) => {
    setLoading(true);
    setVisibleCount(PAGE_SIZE);
    try {
      const params = { limit: 100 };
      if (loc) { params.lat = loc.lat; params.lng = loc.lng; params.radius = rad; }
      if (cat) params.category = cat;
      const { data } = await api.get('/establishments', { params });
      setEstablishments(data.establishments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setMapCenter(loc);
        },
        () => {},
        { timeout: 10000 }
      );
    }
  }, []);

  useEffect(() => {
    fetchEstablishments(userLocation, category, radius);
  }, [userLocation, category, radius, fetchEstablishments]);

  const locateUser = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setMapCenter(loc);
        setLocating(false);
      },
      () => {
        alert('Não foi possível obter sua localização.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const scrollCategories = (dir) => {
    if (!categoriesRef.current) return;
    categoriesRef.current.scrollBy({ left: dir === 'right' ? 200 : -200, behavior: 'smooth' });
  };

  const sponsored = establishments.filter(e => e.isSponsored);
  const regular = establishments.filter(e => !e.isSponsored);
  const visibleRegular = regular.slice(0, visibleCount);
  const hasMore = visibleCount < regular.length;

  return (
    <div className="home page-enter">
      {/* Hero */}
      <div className="home-hero">
        <div className="container">
          <h1 className="home-hero-title">
            Encontre o que você precisa<br />
            <span>perto de você</span>
          </h1>
          <div className="home-hero-actions">
            <button className="btn btn-primary btn-lg" onClick={locateUser} disabled={locating}>
              {locating ? <><div className="spinner" /> Localizando...</> : <><Navigation size={18} /> Usar minha localização</>}
            </button>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="container" style={{ contain: 'layout style' }}>
        {/* Row 1: categories with arrows */}
        <div className="home-filters-row1">
          <button className="cat-arrow-btn" onClick={() => scrollCategories('left')} aria-label="Rolar esquerda">
            <ChevronLeft size={16} />
          </button>
          <div className="home-filters-categories" ref={categoriesRef}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                className={`filter-chip ${category === cat.value ? 'active' : ''}`}
                onClick={() => setCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <button className="cat-arrow-btn" onClick={() => scrollCategories('right')} aria-label="Rolar direita">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Row 2: hide map + filters */}
        <div className="home-filters-row2">
          <button
            className={`btn btn-ghost btn-sm ${!showMap ? 'active-ghost' : ''}`}
            onClick={() => setShowMap(v => !v)}
          >
            {showMap ? <EyeOff size={16} /> : <Eye size={16} />}
            {showMap ? 'Ocultar mapa' : 'Ver mapa'}
          </button>

          <button
            className={`btn btn-ghost btn-sm ${showFilters ? 'active-ghost' : ''}`}
            onClick={() => setShowFilters(v => !v)}
          >
            <SlidersHorizontal size={16} />
            Filtros
          </button>
        </div>

        {showFilters && (
          <div className="home-filter-panel">
            <div className="form-group">
              <label className="form-label">Raio de busca: {(radius / 1000).toFixed(1)}km</label>
              <input type="range" min="500" max="20000" step="500" value={radius}
                onChange={e => setRadius(parseInt(e.target.value))} className="radius-slider" />
              <div className="radius-labels"><span>500m</span><span>20km</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="container">
        {/* Map */}
        {showMap && (
          <div className={`home-map-wrapper${mapFullscreen ? ' home-map-fullscreen' : ''}`}>
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={14}
              className="home-map"
            >
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
                maxZoom={19}
              />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                maxZoom={19}
              />
              <FlyToUser location={userLocation} />
              <InvalidateOnResize trigger={mapFullscreen} />
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                  <Popup>Você está aqui</Popup>
                </Marker>
              )}
              {establishments.map(est => (
                <Marker
                  key={est._id}
                  position={[est.location.coordinates[1], est.location.coordinates[0]]}
                  icon={makeIcon(est)}
                >
                  <Popup minWidth={220} className="map-popup">
                    <div className="map-popup-inner">
                      {est.coverImage && (
                        <img src={est.coverImage} alt={est.name} className="map-popup-cover" />
                      )}
                      <div className="map-popup-body">
                        <div className="map-popup-top">
                          {est.logo && <img src={est.logo} alt="" className="map-popup-logo" />}
                          <div>
                            <div className="map-popup-name">{est.name}</div>
                            <div className="map-popup-category">
                              {CATEGORY_ICON[est.category] || '🏬'} {CATEGORY_LABELS[est.category] || est.category}
                            </div>
                          </div>
                        </div>
                        {est.isSponsored && (
                          <div className="map-popup-sponsored">⚡ Patrocinado</div>
                        )}
                        {est.address?.neighborhood && (
                          <div className="map-popup-neighborhood">📍 {est.address.neighborhood}</div>
                        )}
                        <Link to={`/establishment/${est.slug || est._id}`} className="map-popup-btn">
                          Ver estabelecimento →
                        </Link>
                        <div className="map-popup-routes">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${est.location.coordinates[1]},${est.location.coordinates[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="map-popup-route-btn map-popup-route-gmaps"
                            title="Abrir rota no Google Maps"
                          >
                            <img src="https://www.google.com/images/branding/product/1x/maps_32dp.png" alt="" width="14" height="14" />
                            Google Maps
                          </a>
                          <a
                            href={`https://www.waze.com/ul?ll=${est.location.coordinates[1]},${est.location.coordinates[0]}&navigate=yes`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="map-popup-route-btn map-popup-route-waze"
                            title="Abrir rota no Waze"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.54 6.63a9.71 9.71 0 0 1 1.09 7.54 9.49 9.49 0 0 1-9.23 7.08 9.87 9.87 0 0 1-2.22-.26 2.76 2.76 0 0 1-5.15-.53 2.75 2.75 0 0 1-1.36-4.51A9.42 9.42 0 0 1 3 11.25C3 6.14 7.29 2 12.57 2a9.5 9.5 0 0 1 7.97 4.63zM9 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-2.5 3.5c1.79 0 3.31-1.01 3.86-2.39a.5.5 0 0 0-.93-.37c-.4 1-1.58 1.76-2.93 1.76s-2.53-.76-2.93-1.76a.5.5 0 1 0-.93.37c.55 1.38 2.07 2.39 3.86 2.39z"/></svg>
                            Waze
                          </a>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <div className="home-map-count">{establishments.length} estabelecimento{establishments.length !== 1 ? 's' : ''}</div>
            <button
              type="button"
              className="home-map-fs-btn"
              onClick={() => setMapFullscreen(v => !v)}
              aria-label={mapFullscreen ? 'Fechar tela cheia' : 'Expandir mapa'}
              title={mapFullscreen ? 'Fechar tela cheia (Esc)' : 'Expandir mapa'}
            >
              {mapFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        )}

        {/* List */}
        {sponsored.length > 0 && (
          <section className="home-section">
            <div className="home-section-header">
              <h2><Zap size={20} className="section-icon-sponsored" /> Destaques Patrocinados</h2>
            </div>
            <div className={listView === 'list' ? 'establishments-list' : 'establishments-grid'}>
              {sponsored.map(est => <EstablishmentCard key={est._id} establishment={est} listView={listView === 'list'} />)}
            </div>
          </section>
        )}

        <section className="home-section">
          <div className="home-section-header">
            <h2>
              <MapPin size={20} />
              {userLocation ? `Próximos de você (${regular.length})` : `Estabelecimentos (${regular.length})`}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${listView === 'cards' ? 'active' : ''}`}
                  onClick={() => setListView('cards')}
                  title="Cards"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  className={`view-toggle-btn ${listView === 'list' ? 'active' : ''}`}
                  onClick={() => setListView('list')}
                  title="Lista"
                >
                  <List size={15} />
                </button>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => fetchEstablishments(userLocation, category, radius)}>
                <RefreshCw size={14} /> Atualizar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="establishments-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="est-card-skeleton">
                  <div className="skeleton" style={{ height: 140 }} />
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ height: 16, width: '70%' }} />
                    <div className="skeleton" style={{ height: 12, width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : regular.length === 0 && sponsored.length === 0 ? (
            <div className="home-empty">
              <MapPin size={48} />
              <h3>Nenhum estabelecimento encontrado</h3>
              <p>Tente aumentar o raio de busca ou mudar a categoria.</p>
            </div>
          ) : (
            <>
              <div className={listView === 'list' ? 'establishments-list' : 'establishments-grid'}>
                {visibleRegular.map(est => <EstablishmentCard key={est._id} establishment={est} listView={listView === 'list'} />)}
              </div>
              {hasMore && (
                <div className="home-show-more">
                  <button className="btn btn-secondary" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
                    Mostrar mais ({regular.length - visibleCount} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
