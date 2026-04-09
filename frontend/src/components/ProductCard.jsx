import React from 'react';
import { ShoppingBag } from 'lucide-react';
import './ProductCard.css';

export default function ProductCard({ product, showEstablishment = false }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <div className="product-card">
      <div className="product-card-image">
        {product.images && product.images.length > 0
          ? <img src={product.images[0]} alt={product.name} loading="lazy" />
          : <div className="product-card-no-image"><ShoppingBag size={28} /></div>
        }
      </div>
      <div className="product-card-body">
        <h4 className="product-card-name">{product.name}</h4>
        {product.description && (
          <p className="product-card-desc">{product.description}</p>
        )}
        {showEstablishment && product.establishmentId && (
          <p className="product-card-est">
            @ {typeof product.establishmentId === 'object'
              ? product.establishmentId.name
              : product.establishmentId}
          </p>
        )}
        <div className="product-card-footer">
          <span className="product-card-price">{formatPrice(product.price)}</span>
          {product.category && (
            <span className="product-card-category">{product.category}</span>
          )}
        </div>
      </div>
    </div>
  );
}
