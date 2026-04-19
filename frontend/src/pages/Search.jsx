import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { Search as SearchIcon, MapPin } from 'lucide-react';
import './Search.css';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query) return;
    const doSearch = async () => {
      setLoading(true);
      setSearched(true);
      try {
        const params = { q: query };
        // Try to get user location
        const { data } = await api.get('/products/search', { params });
        setProducts(data.products);
      } catch (err) {
        console.error(err);
        setProducts([]);
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

  // Group by establishment
  const grouped = products.reduce((acc, p) => {
    const est = p.establishmentId;
    if (!est) return acc;
    const key = typeof est === 'object' ? (est.slug || est._id) : est;
    const name = typeof est === 'object' ? est.name : 'Estabelecimento';
    if (!acc[key]) acc[key] = { name, est, products: [] };
    acc[key].products.push(p);
    return acc;
  }, {});

  return (
    <div className="search-page page-enter">
      <div className="search-hero">
        <div className="container">
          <h1>Buscar Produtos</h1>
          <form onSubmit={handleSubmit} className="search-form">
            <SearchIcon size={20} className="search-form-icon" />
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Buscar produto... ex: arroz, café, dipirona"
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

        {!loading && searched && products.length === 0 && (
          <div className="search-empty">
            <SearchIcon size={48} />
            <h3>Nenhum produto encontrado para "{query}"</h3>
            <p>Tente outros termos de busca.</p>
          </div>
        )}

        {!loading && products.length > 0 && (
          <>
            <p className="search-count">
              {products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''} para "{query}"
            </p>

            {Object.entries(grouped).map(([estId, group]) => (
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
          </>
        )}

        {!loading && !searched && (
          <div className="search-hints">
            <h3>Sugestões de busca:</h3>
            <div className="search-hint-chips">
              {['arroz', 'feijão', 'carne', 'pão', 'remédio', 'ração', 'frango', 'café'].map(hint => (
                <button
                  key={hint}
                  className="filter-chip"
                  onClick={() => { setInputValue(hint); setSearchParams({ q: hint }); }}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
