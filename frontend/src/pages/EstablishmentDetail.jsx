import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { MapPin, Phone, Clock, ArrowLeft, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import './EstablishmentDetail.css';

const DAY_LABELS = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
};

const CATEGORY_LABELS = {
  supermarket: 'Supermercado', pharmacy: 'Farmácia', bakery: 'Padaria',
  butcher: 'Açougue', restaurant: 'Restaurante', convenience: 'Conveniência',
  petshop: 'Pet Shop', electronics: 'Eletrônicos', clothing: 'Vestuário', other: 'Outros',
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function EstablishmentDetail() {
  const { id } = useParams();
  const [establishment, setEstablishment] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoursOpen, setHoursOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [estRes, prodRes] = await Promise.all([
          api.get(`/establishments/${id}`),
          api.get(`/establishments/${id}/products`),
        ]);
        setEstablishment(estRes.data.establishment);
        setProducts(prodRes.data.products);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="spinner spinner-dark" />
    </div>
  );

  if (!establishment) return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <h2>Estabelecimento não encontrado</h2>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>Voltar</Link>
    </div>
  );

  const [lng, lat] = establishment.location.coordinates;
  const formatPrice = p => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);

  // Group products by category
  const grouped = products.reduce((acc, p) => {
    const cat = p.category || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className="est-detail page-enter">
      {/* Cover */}
      <div className="est-detail-cover">
        {establishment.coverImage
          ? <img src={establishment.coverImage} alt={establishment.name} />
          : <div className="est-detail-cover-placeholder">🏬</div>
        }
        <div className="est-detail-cover-overlay" />
        <div className="container est-detail-cover-content">
          <Link to="/" className="btn btn-ghost est-detail-back">
            <ArrowLeft size={18} />
            Voltar
          </Link>
          {establishment.isSponsored && (
            <span className="badge badge-sponsored">
              <Zap size={10} /> Patrocinado
            </span>
          )}
        </div>
      </div>

      <div className="container">
        {/* Header */}
        <div className="est-detail-header">
          {establishment.logo && (
            <img src={establishment.logo} alt="" className="est-detail-logo" />
          )}
          <div className="est-detail-header-info">
            <h1>{establishment.name}</h1>
            <span className="badge badge-category">
              {CATEGORY_LABELS[establishment.category] || establishment.category}
            </span>
            {establishment.description && (
              <p className="est-detail-desc">{establishment.description}</p>
            )}
          </div>
        </div>

        <div className="est-detail-body">
          {/* Left: info + map */}
          <aside className="est-detail-sidebar">
            {/* Info card */}
            <div className="card est-detail-info-card">
              <h3>Informações</h3>

              {establishment.address?.formatted && (
                <div className="est-info-row">
                  <MapPin size={16} className="est-info-icon" />
                  <span>{establishment.address.formatted}</span>
                </div>
              )}

              {establishment.phone && (
                <div className="est-info-row">
                  <Phone size={16} className="est-info-icon" />
                  <a href={`tel:${establishment.phone}`}>{establishment.phone}</a>
                </div>
              )}

              {establishment.businessHours?.length > 0 && (
                <div className="est-info-hours">
                  <button
                    className="est-info-hours-toggle"
                    onClick={() => setHoursOpen(v => !v)}
                  >
                    <div className="est-info-row" style={{ marginBottom: 0 }}>
                      <Clock size={16} className="est-info-icon" />
                      <span>Horários de funcionamento</span>
                    </div>
                    {hoursOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {hoursOpen && (
                    <div className="est-hours-list">
                      {establishment.businessHours.map(h => (
                        <div key={h.day} className="est-hours-row">
                          <span className="est-hours-day">{DAY_LABELS[h.day]}</span>
                          <span className="est-hours-time">
                            {h.closed ? 'Fechado' : `${h.open} - ${h.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mini map */}
            <div className="card est-detail-map-card">
              <MapContainer
                center={[lat, lng]}
                zoom={15}
                className="est-detail-map"
                dragging={false}
                zoomControl={false}
                scrollWheelZoom={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[lat, lng]}>
                  <Popup>{establishment.name}</Popup>
                </Marker>
              </MapContainer>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: 10 }}
              >
                <MapPin size={16} />
                Como chegar
              </a>
            </div>
          </aside>

          {/* Right: products */}
          <main className="est-detail-products">
            <h2 className="est-products-title">
              Produtos ({products.length})
            </h2>

            {products.length === 0 ? (
              <div className="est-no-products">
                <p>Nenhum produto cadastrado ainda.</p>
              </div>
            ) : (
              Object.entries(grouped).map(([cat, prods]) => (
                <div key={cat} className="est-product-group">
                  <h3 className="est-product-group-title">{cat}</h3>
                  <div className="est-products-list">
                    {prods.map(p => <ProductCard key={p._id} product={p} />)}
                  </div>
                </div>
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
