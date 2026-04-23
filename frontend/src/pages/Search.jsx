import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import EstablishmentCard from '../components/EstablishmentCard';
import { Search as SearchIcon, MapPin, Store, Package, Wrench, Zap } from 'lucide-react';
import './Search.css';

const CATEGORY_ICON = {
  supermarket: '🛒', pharmacy: '💊', bakery: '🥖', butcher: '🥩',
  restaurant: '🍽️', convenience: '🏪', petshop: '🐾', electronics: '📱',
  clothing: '👔', other: '🏬',
};

const HINTS = ['arroz', 'padaria', 'farmácia', 'corte de cabelo', 'pizza', 'remédio', 'mercado', 'pet'];

function formatPrice(svc) {
  if (svc.priceType === 'free') return 'Grátis';
  if (svc.priceType === 'on_request') return 'Sob consulta';
  if (svc.price == null) return '—';
  const v = svc.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return svc.priceType === 'from' ? `A partir de ${v}` : v;
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);
  const [results, setResults] = useState({ establishments: [], products: [], services: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [tab, setTab] = useState('all');
  const [featured, setFeatured] = useState([]);
  const [hintIdx, setHintIdx] = useState(0);

  useEffect(() => {
    if (query) return;
    const id = setInterval(() => setHintIdx(i => (i + 1) % HINTS.length), 2200);
    return () => clearInterval(id);
  }, [query]);

  useEffect(() => {
    if (query) return;
    const loadFeatured = async () => {
      try {
        const { data } = await api.get('/establishments', { params: { limit: 8 } });
        setFeatured(data.establishments || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadFeatured();
  }, [query]);

  useEffect(() => {
    if (!query) return;
    const doSearch = async () => {
      setLoading(true);
      setSearched(true);
      try {
        const { data } = await api.get('/search', { params: { q: query } });
        setResults({
          establishments: data.establishments || [],
          products: data.products || [],
          services: data.services || [],
        });
      } catch (err) {
        console.error(err);
        setResults({ establishments: [], products: [], services: [] });
      } finally {
        setLoading(false);
      }
    };
    doSearch();
  }, [query]);

  const handleSubmit = e => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    }
  };

  const total = results.establishments.length + results.products.length + results.services.length;
  const showEst = tab === 'all' || tab === 'establishments';
  const showProd = tab === 'all' || tab === 'products';
  const showSvc = tab === 'all' || tab === 'services';

  return (
    <div className="search-page page-enter">
      <div className="search-hero">
        <div className="container">
          <h1 className="search-hero-title">Buscar</h1>
          <p className="search-hero-subtitle">Produtos, estabelecimentos e serviços</p>
          <form onSubmit={handleSubmit} className="search-form">
            <SearchIcon size={20} className="search-form-icon" />
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder={`Ex: ${HINTS[hintIdx]}`}
              className="search-form-input"
            />
            <button type="submit" className="btn btn-primary">Buscar</button>
          </form>
        </div>
      </div>

      <div className="container search-results">
        {loading && (
          <div className="search-loading">
            <div className="spinner spinner-dark" />
            <span>Buscando...</span>
          </div>
        )}

        {!loading && searched && total === 0 && (
          <div className="search-empty">
            <SearchIcon size={48} />
            <h3>Nada encontrado para "{query}"</h3>
            <p>Tente outros termos de busca.</p>
          </div>
        )}

        {!loading && total > 0 && (
          <>
            <p className="search-count">
              {total} resultado{total !== 1 ? 's' : ''} para "{query}"
            </p>

            <div className="search-tabs">
              <button className={`search-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
                Tudo <span className="search-tab-count">{total}</span>
              </button>
              <button className={`search-tab ${tab === 'establishments' ? 'active' : ''}`} onClick={() => setTab('establishments')}>
                <Store size={15} /> Estabelecimentos <span className="search-tab-count">{results.establishments.length}</span>
              </button>
              <button className={`search-tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>
                <Package size={15} /> Produtos <span className="search-tab-count">{results.products.length}</span>
              </button>
              <button className={`search-tab ${tab === 'services' ? 'active' : ''}`} onClick={() => setTab('services')}>
                <Wrench size={15} /> Serviços <span className="search-tab-count">{results.services.length}</span>
              </button>
            </div>

            {showEst && results.establishments.length > 0 && (
              <section className="search-section">
                <h2 className="search-section-title"><Store size={18} /> Estabelecimentos</h2>
                <div className="establishments-grid">
                  {results.establishments.map(est => (
                    <EstablishmentCard key={est._id} establishment={est} />
                  ))}
                </div>
              </section>
            )}

            {showProd && results.products.length > 0 && (
              <section className="search-section">
                <h2 className="search-section-title"><Package size={18} /> Produtos</h2>
                {Object.entries(
                  results.products.reduce((acc, p) => {
                    const est = p.establishmentId;
                    if (!est) return acc;
                    const key = typeof est === 'object' ? (est.slug || est._id) : est;
                    const name = typeof est === 'object' ? est.name : 'Estabelecimento';
                    if (!acc[key]) acc[key] = { name, est, products: [] };
                    acc[key].products.push(p);
                    return acc;
                  }, {})
                ).map(([estId, group]) => (
                  <div key={estId} className="search-group">
                    <div className="search-group-header">
                      <Link to={`/establishment/${estId}`} className="search-group-name">
                        <MapPin size={16} />
                        {group.name}
                        {group.est?.isSponsored && <span className="badge badge-sponsored" style={{ marginLeft: 8, fontSize: 10 }}>⚡ Patrocinado</span>}
                      </Link>
                      {group.est?.address?.neighborhood && (
                        <span className="search-group-location">{group.est.address.neighborhood}</span>
                      )}
                    </div>
                    <div className="search-products-list">
                      {group.products.map(p => <ProductCard key={p._id} product={p} />)}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {showSvc && results.services.length > 0 && (
              <section className="search-section">
                <h2 className="search-section-title"><Wrench size={18} /> Serviços</h2>
                <div className="search-services-list">
                  {results.services.map(svc => {
                    const est = svc.establishmentId;
                    const estKey = est?.slug || est?._id;
                    return (
                      <Link key={svc._id} to={`/establishment/${estKey}`} className="search-service-card">
                        <div className="search-service-body">
                          <div className="search-service-name">{svc.name}</div>
                          {svc.description && <div className="search-service-desc">{svc.description}</div>}
                          <div className="search-service-meta">
                            {est && (
                              <span className="search-service-est">
                                {CATEGORY_ICON[est.category] || '🏬'} {est.name}
                              </span>
                            )}
                            {svc.duration && <span className="search-service-duration">⏱ {svc.duration}</span>}
                          </div>
                        </div>
                        <div className="search-service-price">{formatPrice(svc)}</div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {!loading && !searched && (
          <>
            {featured.length > 0 && (
              <section className="search-featured">
                <div className="search-featured-header">
                  <h2><Zap size={20} /> Estabelecimentos em Destaque</h2>
                  <span className="search-featured-badge">Patrocinado</span>
                </div>
                <div className="establishments-grid">
                  {featured.map(est => (
                    <EstablishmentCard key={est._id} establishment={est} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
