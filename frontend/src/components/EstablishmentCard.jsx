import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Star, Zap } from 'lucide-react';
import './EstablishmentCard.css';

const CATEGORY_LABELS = {
  supermarket: 'Supermercado',
  pharmacy: 'Farmácia',
  bakery: 'Padaria',
  butcher: 'Açougue',
  restaurant: 'Restaurante',
  convenience: 'Conveniência',
  petshop: 'Pet Shop',
  electronics: 'Eletrônicos',
  clothing: 'Vestuário',
  other: 'Outros',
};

const CATEGORY_ICONS = {
  supermarket: '🛒',
  pharmacy: '💊',
  bakery: '🥖',
  butcher: '🥩',
  restaurant: '🍽️',
  convenience: '🏪',
  petshop: '🐾',
  electronics: '📱',
  clothing: '👔',
  other: '🏬',
};

function formatDistance(meters) {
  if (!meters && meters !== 0) return null;
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function isOpenNow(businessHours) {
  if (!businessHours || businessHours.length === 0) return null;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const dayName = days[now.getDay()];
  const dayHours = businessHours.find(h => h.day === dayName);
  if (!dayHours || dayHours.closed) return false;

  const [openH, openM] = dayHours.open.split(':').map(Number);
  const [closeH, closeM] = dayHours.close.split(':').map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export default function EstablishmentCard({ establishment }) {
  const open = isOpenNow(establishment.businessHours);
  const dist = formatDistance(establishment.distance);

  return (
    <Link to={`/establishment/${establishment._id}`} className="est-card">
      {/* Cover image */}
      <div className="est-card-cover">
        {establishment.coverImage
          ? <img src={establishment.coverImage} alt={establishment.name} loading="lazy" />
          : <div className="est-card-cover-placeholder">{CATEGORY_ICONS[establishment.category] || '🏬'}</div>
        }
        {establishment.isSponsored && (
          <div className="est-card-sponsored">
            <Zap size={10} />
            Patrocinado
          </div>
        )}
      </div>

      {/* Content */}
      <div className="est-card-body">
        <div className="est-card-header">
          {establishment.logo && (
            <img src={establishment.logo} alt="" className="est-card-logo" />
          )}
          <div className="est-card-info">
            <h3 className="est-card-name">{establishment.name}</h3>
            <span className="badge badge-category">
              {CATEGORY_ICONS[establishment.category]} {CATEGORY_LABELS[establishment.category] || establishment.category}
            </span>
          </div>
        </div>

        {establishment.description && (
          <p className="est-card-desc">{establishment.description}</p>
        )}

        <div className="est-card-footer">
          {dist && (
            <span className="est-card-meta">
              <MapPin size={12} />
              {dist}
            </span>
          )}
          {open !== null && (
            <span className={`est-card-meta est-card-open ${open ? 'open' : 'closed'}`}>
              <Clock size={12} />
              {open ? 'Aberto agora' : 'Fechado'}
            </span>
          )}
          {establishment.address?.neighborhood && (
            <span className="est-card-meta">
              <MapPin size={12} />
              {establishment.address.neighborhood}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
