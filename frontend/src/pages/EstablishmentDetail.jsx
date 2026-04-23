import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import {
  MapPin, Phone, Clock, ArrowLeft, Zap, Navigation, Bookmark, Share2,
  Globe, Star, ChevronRight,
} from 'lucide-react';
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

const brandIcon = L.divIcon({
  className: '',
  html: `<div style="width:40px;height:40px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#FF5A1F,#FF2D55);transform:rotate(-45deg);box-shadow:0 4px 16px rgba(255,90,31,0.5);border:3px solid white;"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(45deg);font-size:16px;">📍</div></div>`,
  iconSize: [40, 40], iconAnchor: [20, 40],
});

function Stars({ value }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  return (
    <span className="est-stars" aria-label={`${value} de 5`}>
      {[0,1,2,3,4].map(i => (
        <Star
          key={i}
          size={14}
          fill={i < full || (i === full && hasHalf) ? '#F5A623' : 'none'}
          color="#F5A623"
        />
      ))}
    </span>
  );
}

export default function EstablishmentDetail() {
  const { id } = useParams();
  const [establishment, setEstablishment] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [reviewsData, setReviewsData] = useState({ reviews: [], total: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const estRes = await api.get(`/establishments/${id}`);
        const est = estRes.data.establishment;
        setEstablishment(est);

        const [prodRes, svcRes, revRes] = await Promise.all([
          api.get(`/establishments/${est._id}/products`).catch(() => ({ data: { products: [] } })),
          api.get(`/establishments/${est._id}/services`).catch(() => ({ data: { services: [] } })),
          api.get(`/reviews/${est._id}`).catch(() => ({ data: { reviews: [], total: 0, avgRating: 0 } })),
        ]);
        setProducts(prodRes.data.products || []);
        setServices(svcRes.data.services || []);
        setReviewsData(revRes.data);
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

  const todayIdx = new Date().getDay();
  const todayKey = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][todayIdx];
  const todayHours = establishment.businessHours?.find(h => h.day === todayKey);
  const isOpen = (() => {
    if (!todayHours || todayHours.closed) return false;
    const [oh, om] = todayHours.open.split(':').map(Number);
    const [ch, cm] = todayHours.close.split(':').map(Number);
    const cur = new Date().getHours() * 60 + new Date().getMinutes();
    return cur >= oh * 60 + om && cur < ch * 60 + cm;
  })();

  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const wazeUrl = `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`;

  const onShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: establishment.name, url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copiado!');
      } catch {}
    }
  };

  const grouped = products.reduce((acc, p) => {
    const cat = p.category || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const formatPrice = (svc) => {
    if (svc.priceType === 'free') return 'Grátis';
    if (svc.priceType === 'on_request') return 'Sob consulta';
    if (svc.price == null) return '—';
    const v = svc.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return svc.priceType === 'from' ? `A partir de ${v}` : v;
  };

  return (
    <div className="est-gm page-enter">
      {/* Cover */}
      <div className="est-gm-cover">
        {establishment.coverImage
          ? <img src={establishment.coverImage} alt={establishment.name} />
          : <div className="est-gm-cover-placeholder">🏬</div>
        }
        <Link to="/" className="est-gm-back" aria-label="Voltar">
          <ArrowLeft size={20} />
        </Link>
      </div>

      <div className="est-gm-panel">
        {establishment.isSponsored && (
          <span className="est-gm-sponsored"><Zap size={11} /> Patrocinado</span>
        )}

        <h1 className="est-gm-name">{establishment.name}</h1>

        <div className="est-gm-meta-row">
          {reviewsData.total > 0 && (
            <>
              <span className="est-gm-rating-value">{reviewsData.avgRating.toFixed(1)}</span>
              <Stars value={reviewsData.avgRating} />
              <span className="est-gm-rating-count">({reviewsData.total})</span>
              <span className="est-gm-dot">·</span>
            </>
          )}
          <span className="est-gm-category">
            {CATEGORY_LABELS[establishment.category] || establishment.category}
          </span>
        </div>

        {todayHours && (
          <div className={`est-gm-status ${isOpen ? 'is-open' : 'is-closed'}`}>
            <span className="est-gm-status-dot" />
            {isOpen ? 'Aberto' : 'Fechado'}
            {todayHours && !todayHours.closed && (
              <span className="est-gm-status-sub">
                {isOpen ? ` · fecha às ${todayHours.close}` : ` · abre às ${todayHours.open}`}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="est-gm-actions">
          <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="est-gm-action">
            <span className="est-gm-action-icon est-gm-action-primary">
              <Navigation size={18} />
            </span>
            <span className="est-gm-action-label">Rotas</span>
          </a>
          <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="est-gm-action">
            <span className="est-gm-action-icon">
              <MapPin size={18} />
            </span>
            <span className="est-gm-action-label">Waze</span>
          </a>
          {establishment.phone && (
            <a href={`tel:${establishment.phone}`} className="est-gm-action">
              <span className="est-gm-action-icon">
                <Phone size={18} />
              </span>
              <span className="est-gm-action-label">Ligar</span>
            </a>
          )}
          <button type="button" className="est-gm-action" onClick={onShare}>
            <span className="est-gm-action-icon">
              <Share2 size={18} />
            </span>
            <span className="est-gm-action-label">Compartilhar</span>
          </button>
          <button type="button" className="est-gm-action">
            <span className="est-gm-action-icon">
              <Bookmark size={18} />
            </span>
            <span className="est-gm-action-label">Salvar</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="est-gm-tabs">
          <button className={`est-gm-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
            Visão geral
          </button>
          <button className={`est-gm-tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>
            Produtos {products.length > 0 && <span className="est-gm-tab-count">{products.length}</span>}
          </button>
          {services.length > 0 && (
            <button className={`est-gm-tab ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')}>
              Serviços <span className="est-gm-tab-count">{services.length}</span>
            </button>
          )}
          <button className={`est-gm-tab ${tab === 'reviews' ? 'active' : ''}`} onClick={() => setTab('reviews')}>
            Avaliações {reviewsData.total > 0 && <span className="est-gm-tab-count">{reviewsData.total}</span>}
          </button>
          <button className={`est-gm-tab ${tab === 'about' ? 'active' : ''}`} onClick={() => setTab('about')}>
            Sobre
          </button>
        </div>

        {/* Tab content */}
        <div className="est-gm-tab-content">
          {tab === 'overview' && (
            <>
              {establishment.description && (
                <p className="est-gm-desc">{establishment.description}</p>
              )}

              <div className="est-gm-map-card">
                <MapContainer
                  center={[lat, lng]}
                  zoom={16}
                  className="est-gm-map"
                  zoomControl={false}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                  />
                  <Marker position={[lat, lng]} icon={brandIcon} />
                </MapContainer>
                <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="est-gm-map-overlay">
                  Ver no mapa <ChevronRight size={16} />
                </a>
              </div>

              <ul className="est-gm-info">
                {establishment.address?.formatted && (
                  <li className="est-gm-info-item">
                    <MapPin size={18} />
                    <div>
                      <div className="est-gm-info-main">{establishment.address.formatted}</div>
                      {establishment.address.neighborhood && (
                        <div className="est-gm-info-sub">{establishment.address.neighborhood}</div>
                      )}
                    </div>
                  </li>
                )}

                {establishment.phone && (
                  <li className="est-gm-info-item">
                    <Phone size={18} />
                    <a href={`tel:${establishment.phone}`} className="est-gm-info-main">
                      {establishment.phone}
                    </a>
                  </li>
                )}

                {establishment.businessHours?.length > 0 && (
                  <li className="est-gm-info-item est-gm-info-hours">
                    <Clock size={18} />
                    <div style={{ flex: 1 }}>
                      <div className="est-gm-info-main">
                        {isOpen ? 'Aberto agora' : 'Fechado'}
                        {todayHours && !todayHours.closed && (
                          <span className="est-gm-info-sub">
                            {' '}· {isOpen ? `fecha às ${todayHours.close}` : `abre às ${todayHours.open}`}
                          </span>
                        )}
                      </div>
                      <details className="est-gm-hours-details">
                        <summary>Ver todos os horários</summary>
                        <div className="est-gm-hours-list">
                          {establishment.businessHours.map(h => (
                            <div key={h.day} className={`est-gm-hours-row ${h.day === todayKey ? 'today' : ''}`}>
                              <span>{DAY_LABELS[h.day]}{h.day === todayKey ? ' (hoje)' : ''}</span>
                              <span>{h.closed ? 'Fechado' : `${h.open} – ${h.close}`}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </li>
                )}
              </ul>
            </>
          )}

          {tab === 'products' && (
            <>
              {products.length === 0 ? (
                <div className="est-gm-empty">Nenhum produto cadastrado ainda.</div>
              ) : (
                Object.entries(grouped).map(([cat, prods]) => (
                  <div key={cat} className="est-gm-group">
                    <h3 className="est-gm-group-title">{cat}</h3>
                    <div className="est-gm-products">
                      {prods.map(p => <ProductCard key={p._id} product={p} />)}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'services' && (
            <div className="est-gm-services">
              {services.map(svc => (
                <div key={svc._id} className="est-gm-service">
                  <div className="est-gm-service-body">
                    <div className="est-gm-service-name">{svc.name}</div>
                    {svc.description && <div className="est-gm-service-desc">{svc.description}</div>}
                    {svc.duration && <div className="est-gm-service-duration">⏱ {svc.duration}</div>}
                  </div>
                  <div className="est-gm-service-price">{formatPrice(svc)}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'reviews' && (
            <>
              {reviewsData.total === 0 ? (
                <div className="est-gm-empty">Ainda não há avaliações.</div>
              ) : (
                <>
                  <div className="est-gm-reviews-summary">
                    <div className="est-gm-reviews-avg">{reviewsData.avgRating.toFixed(1)}</div>
                    <div>
                      <Stars value={reviewsData.avgRating} />
                      <div className="est-gm-reviews-total">{reviewsData.total} avaliações</div>
                    </div>
                  </div>
                  <div className="est-gm-reviews-list">
                    {reviewsData.reviews.map(r => (
                      <div key={r._id} className="est-gm-review">
                        <div className="est-gm-review-head">
                          <div className="est-gm-review-user">{r.userId?.name || 'Anônimo'}</div>
                          <Stars value={r.rating} />
                        </div>
                        {r.comment && <p className="est-gm-review-comment">{r.comment}</p>}
                        <div className="est-gm-review-date">
                          {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {tab === 'about' && (
            <div className="est-gm-about">
              {establishment.description ? (
                <p>{establishment.description}</p>
              ) : (
                <p className="est-gm-empty-inline">Este estabelecimento ainda não adicionou uma descrição.</p>
              )}
              <ul className="est-gm-about-list">
                <li><strong>Categoria:</strong> {CATEGORY_LABELS[establishment.category] || establishment.category}</li>
                {establishment.address?.city && (
                  <li><strong>Cidade:</strong> {establishment.address.city}{establishment.address.state ? ` - ${establishment.address.state}` : ''}</li>
                )}
                {establishment.address?.zipCode && (
                  <li><strong>CEP:</strong> {establishment.address.zipCode}</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
