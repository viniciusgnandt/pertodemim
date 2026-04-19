import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Zap } from 'lucide-react';
import './EstablishmentCard.css';

const CATEGORY_LABELS = {
  supermarket: 'Supermercado', pharmacy: 'Farmácia', bakery: 'Padaria',
  butcher: 'Açougue', restaurant: 'Restaurante', convenience: 'Conveniência',
  petshop: 'Pet Shop', electronics: 'Eletrônicos', clothing: 'Vestuário', other: 'Outros',
};

const CATEGORY_ICONS = {
  supermarket: '🛒', pharmacy: '💊', bakery: '🥖', butcher: '🥩',
  restaurant: '🍽️', convenience: '🏪', petshop: '🐾', electronics: '📱',
  clothing: '👔', other: '🏬',
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
  const dayHours = businessHours.find(h => h.day === days[now.getDay()]);
  if (!dayHours || dayHours.closed) return false;
  const [openH, openM] = dayHours.open.split(':').map(Number);
  const [closeH, closeM] = dayHours.close.split(':').map(Number);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= openH * 60 + openM && cur < closeH * 60 + closeM;
}

export default function EstablishmentCard({ establishment, listView = false }) {
  const open = isOpenNow(establishment.businessHours);
  const dist = formatDistance(establishment.distance);

  return (
    <Link to={`/establishment/${establishment.slug || establishment._id}`} className={`est-card${listView ? ' est-card--list' : ''}`}>
      <div className="est-card-cover">
        {establishment.coverImage
          ? <img src={establishment.coverImage} alt={establishment.name} loading="lazy" />
          : <div className="est-card-cover-placeholder">{CATEGORY_ICONS[establishment.category] || '🏬'}</div>
        }
        {establishment.isSponsored && (
          <div className="est-card-sponsored"><Zap size={10} /> Patrocinado</div>
        )}
        {open !== null && (
          <div className={`est-card-status ${open ? 'open' : 'closed'}`}>
            {open ? '● Aberto' : '● Fechado'}
          </div>
        )}
      </div>

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
            <span className="est-card-meta"><MapPin size={12} />{dist}</span>
          )}
          {establishment.address?.neighborhood && (
            <span className="est-card-meta"><MapPin size={12} />{establishment.address.neighborhood}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
