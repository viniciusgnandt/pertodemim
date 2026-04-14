import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import api from '../api/axios';
import EstablishmentCard from '../components/EstablishmentCard';
import { MapPin, SlidersHorizontal, RefreshCw, Navigation, Zap, List, Map } from 'lucide-react';
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

export default function Home() {
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(MOGI_CENTER);
  const [category, setCategory] = useState('');
  const [radius, setRadius] = useState(5000);
  const [locating, setLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState('list');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
          <p className="home-hero-subtitle">
            Veja produtos com preços antes de sair de casa. Supermercados, farmácias, padarias e muito mais.
          </p>
          <div className="home-hero-actions">
            <button className="btn btn-primary btn-lg" onClick={locateUser} disabled={locating}>
              {locating ? <><div className="spinner" /> Localizando...</> : <><Navigation size={18} /> Usar minha localização</>}
            </button>
          </div>
        </div>
      </div>

      {/* Filters bar — outside map container to avoid Leaflet CSS leak */}
      <div className="container" style={{ contain: 'layout style' }}>
        <div className="home-filters" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, padding: '20px 0 12px' }}>
          <div className="home-filters-categories" style={{ display: 'flex', flexDirection: 'row', gap: 8, flex: 1, minWidth: 0, overflowX: 'auto' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                className={`filter-chip ${category === cat.value ? 'active' : ''}`}
                onClick={() => setCategory(cat.value)}
                style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', height: 'auto', width: 'auto', flexShrink: 0 }}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="home-filters-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div className="view-toggle">
              <button className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')} title="Lista">
                <List size={16} />
              </button>
              <button className={`view-toggle-btn ${view === 'map' ? 'active' : ''}`} onClick={() => setView('map')} title="Mapa">
                <Map size={16} />
              </button>
            </div>
            <button className="btn btn-ghost btn-sm home-filter-toggle" onClick={() => setShowFilters(v => !v)}>
              <SlidersHorizontal size={16} />
              Filtros
            </button>
          </div>
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
        {/* Map view */}
        {view === 'map' && (
          <div className="home-map-wrapper">
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={14}
              className="home-map"
              key={`${mapCenter.lat}-${mapCenter.lng}`}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
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
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <strong style={{ fontSize: 14 }}>{est.name}</strong>
                      {est.isSponsored && <span style={{ display: 'block', color: '#FF5A1F', fontSize: 11, fontWeight: 700, marginTop: 2 }}>⚡ Patrocinado</span>}
                      {est.address?.neighborhood && <p style={{ fontSize: 12, color: '#666', margin: '4px 0 6px' }}>{est.address.neighborhood}</p>}
                      <Link to={`/establishment/${est._id}`} style={{ color: '#FF5A1F', fontWeight: 700, fontSize: 13 }}>Ver estabelecimento →</Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <div className="home-map-count">{establishments.length} estabelecimento{establishments.length !== 1 ? 's' : ''}</div>
          </div>
        )}

        {/* List view */}
        {view === 'list' && (
          <>
            {sponsored.length > 0 && (
              <section className="home-section">
                <div className="home-section-header">
                  <h2><Zap size={20} className="section-icon-sponsored" /> Destaques Patrocinados</h2>
                </div>
                <div className="establishments-grid">
                  {sponsored.map(est => <EstablishmentCard key={est._id} establishment={est} />)}
                </div>
              </section>
            )}

            <section className="home-section">
              <div className="home-section-header">
                <h2>
                  <MapPin size={20} />
                  {userLocation ? `Próximos de você (${regular.length})` : `Estabelecimentos (${regular.length})`}
                </h2>
                <button className="btn btn-ghost btn-sm" onClick={() => fetchEstablishments(userLocation, category, radius)}>
                  <RefreshCw size={14} /> Atualizar
                </button>
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
                  <div className="establishments-grid">
                    {visibleRegular.map(est => <EstablishmentCard key={est._id} establishment={est} />)}
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
          </>
        )}
      </div>
    </div>
  );
}
