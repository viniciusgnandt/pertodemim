import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import api from '../api/axios';
import EstablishmentCard from '../components/EstablishmentCard';
import { MapPin, SlidersHorizontal, RefreshCw, Navigation, Zap } from 'lucide-react';
import './Home.css';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const sponsoredIcon = new L.DivIcon({
  html: `<div style="background:#FF5A1F;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(255,90,31,0.5);font-size:14px;">⚡</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

const regularIcon = new L.DivIcon({
  html: `<div style="background:#1A1A2E;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:12px;">📍</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
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

// Mogi das Cruzes center
const MOGI_CENTER = { lat: -23.5232, lng: -46.1897 };

export default function Home() {
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(MOGI_CENTER);
  const [category, setCategory] = useState('');
  const [radius, setRadius] = useState(5000);
  const [locating, setLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchEstablishments = useCallback(async (loc, cat, rad) => {
    setLoading(true);
    try {
      const params = { limit: 50 };
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
        alert('Não foi possível obter sua localização. Mostrando Mogi das Cruzes.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const sponsored = establishments.filter(e => e.isSponsored);
  const regular = establishments.filter(e => !e.isSponsored);

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
            <button
              className="btn btn-primary btn-lg"
              onClick={locateUser}
              disabled={locating}
            >
              {locating ? <><div className="spinner" /> Localizando...</> : <><Navigation size={18} /> Usar minha localização</>}
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Filters bar */}
        <div className="home-filters">
          <div className="home-filters-categories">
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
          <button
            className="btn btn-ghost btn-sm home-filter-toggle"
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
              <input
                type="range"
                min="500"
                max="20000"
                step="500"
                value={radius}
                onChange={e => setRadius(parseInt(e.target.value))}
                className="radius-slider"
              />
              <div className="radius-labels">
                <span>500m</span><span>20km</span>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="home-map-wrapper">
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={14}
            className="home-map"
            key={`${mapCenter.lat}-${mapCenter.lng}`}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={new L.DivIcon({
                  html: `<div style="background:#3B82F6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`,
                  className: '',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                })}
              >
                <Popup>Você está aqui</Popup>
              </Marker>
            )}
            {establishments.map(est => (
              <Marker
                key={est._id}
                position={[est.location.coordinates[1], est.location.coordinates[0]]}
                icon={est.isSponsored ? sponsoredIcon : regularIcon}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong>{est.name}</strong>
                    {est.isSponsored && <span style={{ display: 'block', color: '#FF5A1F', fontSize: 11, fontWeight: 700 }}>⚡ Patrocinado</span>}
                    <p style={{ fontSize: 12, color: '#666', margin: '4px 0' }}>{est.address?.neighborhood}</p>
                    <a href={`/establishment/${est._id}`} style={{ color: '#FF5A1F', fontWeight: 600, fontSize: 12 }}>Ver estabelecimento →</a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Sponsored section */}
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

        {/* All establishments */}
        <section className="home-section">
          <div className="home-section-header">
            <h2>
              <MapPin size={20} />
              {userLocation ? 'Próximos de você' : 'Estabelecimentos em Mogi das Cruzes'}
            </h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => fetchEstablishments(userLocation, category, radius)}
            >
              <RefreshCw size={14} />
              Atualizar
            </button>
          </div>

          {loading ? (
            <div className="establishments-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="est-card-skeleton">
                  <div className="skeleton" style={{ height: 140 }} />
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ height: 16, width: '70%' }} />
                    <div className="skeleton" style={{ height: 12, width: '50%' }} />
                    <div className="skeleton" style={{ height: 12, width: '90%' }} />
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
            <div className="establishments-grid">
              {regular.map(est => <EstablishmentCard key={est._id} establishment={est} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
