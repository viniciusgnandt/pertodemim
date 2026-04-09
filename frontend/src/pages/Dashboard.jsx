import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Store, Package, Zap, Plus, Edit2, Trash2, X, Upload,
  Check, Clock, AlertCircle, Star
} from 'lucide-react';
import './Dashboard.css';

const CATEGORIES = ['supermarket', 'pharmacy', 'bakery', 'butcher', 'restaurant', 'convenience', 'petshop', 'electronics', 'clothing', 'other'];
const CATEGORY_LABELS = { supermarket: 'Supermercado', pharmacy: 'Farmácia', bakery: 'Padaria', butcher: 'Açougue', restaurant: 'Restaurante', convenience: 'Conveniência', petshop: 'Pet Shop', electronics: 'Eletrônicos', clothing: 'Vestuário', other: 'Outros' };
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui', friday: 'Sex', saturday: 'Sáb', sunday: 'Dom' };

const DEFAULT_HOURS = DAYS.map(day => ({ day, open: '08:00', close: '18:00', closed: false }));

const BOOST_PACKAGES = [
  { id: '7days', label: '7 dias', durationDays: 7, amountBRL: 'R$ 29,90', description: 'Ideal para testar' },
  { id: '15days', label: '15 dias', durationDays: 15, amountBRL: 'R$ 49,90', description: 'Mais popular', popular: true },
  { id: '30days', label: '30 dias', durationDays: 30, amountBRL: 'R$ 89,90', description: 'Melhor custo-benefício' },
];

function formatPrice(p) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('establishment');
  const [establishments, setEstablishments] = useState([]);
  const [selectedEst, setSelectedEst] = useState(null);
  const [products, setProducts] = useState([]);
  const [boosts, setBoosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEstForm, setShowEstForm] = useState(false);
  const [editingEst, setEditingEst] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Check boost success
  useEffect(() => {
    if (searchParams.get('boost') === 'success') toast.success('Destaque ativado com sucesso! ⚡');
    if (searchParams.get('boost') === 'cancelled') toast.error('Pagamento cancelado');
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [estRes] = await Promise.all([
        api.get('/establishments', { params: { limit: 50 } }),
      ]);
      // Filter establishments owned by current user
      const myEsts = estRes.data.establishments.filter(
        e => (e.ownerId?._id || e.ownerId) === user._id
      );
      setEstablishments(myEsts);
      if (myEsts.length > 0 && !selectedEst) {
        setSelectedEst(myEsts[0]);
        loadProducts(myEsts[0]._id);
      }
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (estId) => {
    try {
      const { data } = await api.get(`/establishments/${estId}/products`);
      setProducts(data.products);
    } catch {}
  };

  const loadBoosts = async () => {
    try {
      const { data } = await api.get('/boosts/my');
      setBoosts(data.boosts);
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'boosts') loadBoosts();
  }, [activeTab]);

  const selectEst = (est) => {
    setSelectedEst(est);
    loadProducts(est._id);
  };

  return (
    <div className="dashboard page-enter">
      <div className="dashboard-header">
        <div className="container">
          <h1>Dashboard</h1>
          <p>Gerencie seu estabelecimento, produtos e destaques</p>
        </div>
      </div>

      <div className="container dashboard-body">
        {/* Tabs */}
        <div className="dashboard-tabs">
          <button className={`dash-tab ${activeTab === 'establishment' ? 'active' : ''}`} onClick={() => setActiveTab('establishment')}>
            <Store size={18} /> Estabelecimento
          </button>
          <button className={`dash-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            <Package size={18} /> Produtos
          </button>
          <button className={`dash-tab ${activeTab === 'boosts' ? 'active' : ''}`} onClick={() => setActiveTab('boosts')}>
            <Zap size={18} /> Destaques
          </button>
        </div>

        {loading ? (
          <div className="dash-loading"><div className="spinner spinner-dark" /></div>
        ) : (
          <>
            {activeTab === 'establishment' && (
              <EstablishmentTab
                establishments={establishments}
                selectedEst={selectedEst}
                onSelect={selectEst}
                onRefresh={loadData}
                showForm={showEstForm}
                setShowForm={setShowEstForm}
                editingEst={editingEst}
                setEditingEst={setEditingEst}
              />
            )}
            {activeTab === 'products' && (
              <ProductsTab
                establishments={establishments}
                selectedEst={selectedEst}
                setSelectedEst={(e) => { setSelectedEst(e); loadProducts(e._id); }}
                products={products}
                onRefresh={() => selectedEst && loadProducts(selectedEst._id)}
                showForm={showProductForm}
                setShowForm={setShowProductForm}
                editingProduct={editingProduct}
                setEditingProduct={setEditingProduct}
              />
            )}
            {activeTab === 'boosts' && (
              <BoostsTab
                establishments={establishments}
                boosts={boosts}
                onRefresh={loadBoosts}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---- Establishment Tab ----
function EstablishmentTab({ establishments, selectedEst, onSelect, onRefresh, showForm, setShowForm, editingEst, setEditingEst }) {
  const handleDelete = async (id) => {
    if (!confirm('Deletar este estabelecimento? Todos os produtos serão removidos.')) return;
    try {
      await api.delete(`/establishments/${id}`);
      toast.success('Estabelecimento removido');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao deletar');
    }
  };

  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <h2>Meus Estabelecimentos ({establishments.length})</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditingEst(null); setShowForm(true); }}>
          <Plus size={16} /> Novo Estabelecimento
        </button>
      </div>

      {showForm && (
        <EstablishmentForm
          initial={editingEst}
          onClose={() => { setShowForm(false); setEditingEst(null); }}
          onSave={() => { setShowForm(false); setEditingEst(null); onRefresh(); }}
        />
      )}

      {establishments.length === 0 && !showForm ? (
        <div className="dash-empty">
          <Store size={48} />
          <h3>Nenhum estabelecimento cadastrado</h3>
          <p>Crie seu primeiro estabelecimento para começar a vender.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Criar Estabelecimento
          </button>
        </div>
      ) : (
        <div className="est-list">
          {establishments.map(est => (
            <div key={est._id} className={`est-list-item ${selectedEst?._id === est._id ? 'selected' : ''}`}>
              <div className="est-list-item-info" onClick={() => onSelect(est)}>
                {est.logo && <img src={est.logo} alt="" className="est-list-logo" />}
                <div>
                  <p className="est-list-name">{est.name}</p>
                  <p className="est-list-cat">{CATEGORY_LABELS[est.category] || est.category}</p>
                  {est.isSponsored && (
                    <span className="badge badge-sponsored" style={{ fontSize: 10, marginTop: 4 }}>
                      <Zap size={8} /> Patrocinado
                    </span>
                  )}
                </div>
              </div>
              <div className="est-list-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingEst(est); setShowForm(true); }}>
                  <Edit2 size={14} />
                </button>
                <button className="btn btn-ghost btn-sm est-delete-btn" onClick={() => handleDelete(est._id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Establishment Form ----
function EstablishmentForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    category: initial?.category || 'supermarket',
    phone: initial?.phone || '',
    logo: initial?.logo || '',
    coverImage: initial?.coverImage || '',
    address: {
      street: initial?.address?.street || '',
      number: initial?.address?.number || '',
      neighborhood: initial?.address?.neighborhood || '',
      city: initial?.address?.city || 'Mogi das Cruzes',
      state: initial?.address?.state || 'SP',
      zipCode: initial?.address?.zipCode || '',
    },
    location: {
      type: 'Point',
      coordinates: initial?.location?.coordinates || [-46.1897, -23.5234],
    },
    businessHours: initial?.businessHours || DEFAULT_HOURS,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const handleAddress = (field, value) => setForm(f => ({ ...f, address: { ...f.address, [field]: value } }));
  const handleCoords = (idx, value) => {
    const coords = [...form.location.coordinates];
    coords[idx] = parseFloat(value) || 0;
    setForm(f => ({ ...f, location: { ...f.location, coordinates: coords } }));
  };
  const handleHours = (dayIdx, field, value) => {
    const hours = [...form.businessHours];
    hours[dayIdx] = { ...hours[dayIdx], [field]: value };
    setForm(f => ({ ...f, businessHours: hours }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        address: {
          ...form.address,
          formatted: `${form.address.street}, ${form.address.number} - ${form.address.neighborhood}, ${form.address.city} - ${form.address.state}`,
        },
      };
      if (initial) {
        await api.put(`/establishments/${initial._id}`, payload);
        toast.success('Estabelecimento atualizado!');
      } else {
        await api.post('/establishments', payload);
        toast.success('Estabelecimento criado!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-panel">
      <div className="form-panel-header">
        <h3>{initial ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} className="est-form">
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" value={form.name} onChange={e => handleChange('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Categoria *</label>
            <select className="form-input" value={form.category} onChange={e => handleChange('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Descrição</label>
          <textarea className="form-input" rows={3} value={form.description} onChange={e => handleChange('description', e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Telefone</label>
          <input className="form-input" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="(11) 9999-9999" />
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">URL do Logo</label>
            <input className="form-input" value={form.logo} onChange={e => handleChange('logo', e.target.value)} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label className="form-label">URL da Capa</label>
            <input className="form-input" value={form.coverImage} onChange={e => handleChange('coverImage', e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <fieldset className="form-fieldset">
          <legend>Endereço</legend>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Rua</label>
              <input className="form-input" value={form.address.street} onChange={e => handleAddress('street', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Número</label>
              <input className="form-input" value={form.address.number} onChange={e => handleAddress('number', e.target.value)} />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Bairro</label>
              <input className="form-input" value={form.address.neighborhood} onChange={e => handleAddress('neighborhood', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">CEP</label>
              <input className="form-input" value={form.address.zipCode} onChange={e => handleAddress('zipCode', e.target.value)} />
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Longitude (ex: -46.1897)</label>
              <input className="form-input" type="number" step="0.0001" value={form.location.coordinates[0]} onChange={e => handleCoords(0, e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Latitude (ex: -23.5234)</label>
              <input className="form-input" type="number" step="0.0001" value={form.location.coordinates[1]} onChange={e => handleCoords(1, e.target.value)} />
            </div>
          </div>
        </fieldset>

        <fieldset className="form-fieldset">
          <legend>Horários de Funcionamento</legend>
          <div className="hours-grid">
            {form.businessHours.map((h, i) => (
              <div key={h.day} className="hours-row">
                <span className="hours-day">{DAY_LABELS[h.day]}</span>
                <label className="hours-closed-label">
                  <input type="checkbox" checked={h.closed} onChange={e => handleHours(i, 'closed', e.target.checked)} />
                  Fechado
                </label>
                {!h.closed && (
                  <>
                    <input type="time" className="form-input hours-input" value={h.open} onChange={e => handleHours(i, 'open', e.target.value)} />
                    <span>até</span>
                    <input type="time" className="form-input hours-input" value={h.close} onChange={e => handleHours(i, 'close', e.target.value)} />
                  </>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        <div className="form-panel-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><div className="spinner" />Salvando...</> : <><Check size={16} />Salvar</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---- Products Tab ----
function ProductsTab({ establishments, selectedEst, setSelectedEst, products, onRefresh, showForm, setShowForm, editingProduct, setEditingProduct }) {
  const handleDelete = async (productId) => {
    if (!confirm('Remover este produto?')) return;
    try {
      await api.delete(`/establishments/${selectedEst._id}/products/${productId}`);
      toast.success('Produto removido');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao deletar');
    }
  };

  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2>Produtos</h2>
          {establishments.length > 1 && (
            <select
              className="form-input"
              style={{ width: 'auto', fontSize: 13 }}
              value={selectedEst?._id || ''}
              onChange={e => setSelectedEst(establishments.find(est => est._id === e.target.value))}
            >
              {establishments.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          )}
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
          disabled={!selectedEst}
        >
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      {showForm && selectedEst && (
        <ProductForm
          initial={editingProduct}
          establishmentId={selectedEst._id}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSave={() => { setShowForm(false); setEditingProduct(null); onRefresh(); }}
        />
      )}

      {!selectedEst ? (
        <div className="dash-empty">
          <Package size={48} />
          <h3>Nenhum estabelecimento selecionado</h3>
          <p>Crie um estabelecimento primeiro.</p>
        </div>
      ) : products.length === 0 && !showForm ? (
        <div className="dash-empty">
          <Package size={48} />
          <h3>Nenhum produto cadastrado</h3>
          <p>Adicione produtos com preços para seus clientes verem.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Adicionar Produto
          </button>
        </div>
      ) : (
        <div className="products-list">
          {products.map(p => (
            <div key={p._id} className="product-list-item">
              <div className="product-list-image">
                {p.images?.[0]
                  ? <img src={p.images[0]} alt={p.name} />
                  : <div className="product-list-no-img">📦</div>
                }
              </div>
              <div className="product-list-info">
                <p className="product-list-name">{p.name}</p>
                <p className="product-list-cat">{p.category}</p>
                <p className="product-list-desc">{p.description}</p>
              </div>
              <div className="product-list-price">{formatPrice(p.price)}</div>
              <div className="product-list-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingProduct(p); setShowForm(true); }}>
                  <Edit2 size={14} />
                </button>
                <button className="btn btn-ghost btn-sm est-delete-btn" onClick={() => handleDelete(p._id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Product Form ----
function ProductForm({ initial, establishmentId, onClose, onSave }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    price: initial?.price || '',
    category: initial?.category || '',
    images: initial?.images || [],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleChange = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(f => ({ ...f, images: [...f.images, data.url] }));
      toast.success('Imagem enviada!');
    } catch (err) {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (initial) {
        await api.put(`/establishments/${establishmentId}/products/${initial._id}`, payload);
        toast.success('Produto atualizado!');
      } else {
        await api.post(`/establishments/${establishmentId}/products`, payload);
        toast.success('Produto adicionado!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="form-panel">
      <div className="form-panel-header">
        <h3>{initial ? 'Editar Produto' : 'Novo Produto'}</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} className="est-form">
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Nome do Produto *</label>
            <input className="form-input" value={form.name} onChange={e => handleChange('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Preço (R$) *</label>
            <input className="form-input" type="number" min="0" step="0.01" value={form.price} onChange={e => handleChange('price', e.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Categoria</label>
          <input className="form-input" value={form.category} onChange={e => handleChange('category', e.target.value)} placeholder="ex: Mercearia, Bebidas, Frutas..." />
        </div>
        <div className="form-group">
          <label className="form-label">Descrição</label>
          <textarea className="form-input" rows={2} value={form.description} onChange={e => handleChange('description', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Imagens</label>
          <div className="image-upload-area">
            {form.images.map((img, i) => (
              <div key={i} className="image-thumb">
                <img src={img} alt="" />
                <button type="button" className="image-thumb-remove" onClick={() => removeImage(i)}><X size={12} /></button>
              </div>
            ))}
            <button
              type="button"
              className="image-upload-btn"
              onClick={() => fileRef.current.click()}
              disabled={uploading}
            >
              {uploading ? <div className="spinner spinner-dark" /> : <Upload size={20} />}
              <span>{uploading ? 'Enviando...' : 'Adicionar foto'}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Ou informe URLs diretamente:
          </p>
          <input
            className="form-input"
            placeholder="https://... (URL da imagem)"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (e.target.value) {
                  setForm(f => ({ ...f, images: [...f.images, e.target.value] }));
                  e.target.value = '';
                }
              }
            }}
          />
        </div>
        <div className="form-panel-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><div className="spinner" />Salvando...</> : <><Check size={16} />Salvar</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---- Boosts Tab ----
function BoostsTab({ establishments, boosts, onRefresh }) {
  const [selectedEst, setSelectedEst] = useState(establishments[0]?._id || '');
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState('15days');

  const handleBoost = async () => {
    if (!selectedEst) return toast.error('Selecione um estabelecimento');
    setPurchasing(true);
    try {
      const { data } = await api.post('/boosts/create-checkout', {
        establishmentId: selectedEst,
        packageId: selectedPkg,
      });
      if (data.devMode) {
        toast.success(data.message);
        onRefresh();
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar checkout');
    } finally {
      setPurchasing(false);
    }
  };

  const statusIcon = (status) => {
    if (status === 'active') return <Check size={14} className="boost-status-active" />;
    if (status === 'expired') return <Clock size={14} className="boost-status-expired" />;
    return <AlertCircle size={14} />;
  };

  return (
    <div className="dash-section">
      <h2>Destaques Patrocinados</h2>
      <p className="dash-subtitle">Faça seu estabelecimento aparecer primeiro nas buscas</p>

      {/* Purchase section */}
      <div className="boost-purchase-card">
        <div className="boost-purchase-header">
          <Zap size={24} className="boost-zap" />
          <div>
            <h3>Ativar Destaque</h3>
            <p>Seu estabelecimento aparece primeiro, com badge "Patrocinado"</p>
          </div>
        </div>

        {establishments.length > 1 && (
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Estabelecimento</label>
            <select className="form-input" value={selectedEst} onChange={e => setSelectedEst(e.target.value)}>
              {establishments.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          </div>
        )}

        <div className="boost-packages">
          {BOOST_PACKAGES.map(pkg => (
            <div
              key={pkg.id}
              className={`boost-pkg ${selectedPkg === pkg.id ? 'selected' : ''} ${pkg.popular ? 'popular' : ''}`}
              onClick={() => setSelectedPkg(pkg.id)}
            >
              {pkg.popular && <span className="boost-pkg-badge"><Star size={10} /> Popular</span>}
              <div className="boost-pkg-duration">{pkg.label}</div>
              <div className="boost-pkg-price">{pkg.amountBRL}</div>
              <div className="boost-pkg-desc">{pkg.description}</div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary btn-lg boost-activate-btn"
          onClick={handleBoost}
          disabled={purchasing || !selectedEst}
        >
          {purchasing
            ? <><div className="spinner" />Processando...</>
            : <><Zap size={18} />Ativar Destaque</>
          }
        </button>

        <p className="boost-note">
          Em modo de desenvolvimento, o destaque é ativado imediatamente sem cobrança.
          Configure o Stripe para habilitar pagamentos reais.
        </p>
      </div>

      {/* Boost history */}
      {boosts.length > 0 && (
        <div className="boost-history">
          <h3>Histórico de Destaques</h3>
          <div className="boost-list">
            {boosts.map(b => (
              <div key={b._id} className="boost-item">
                <div className="boost-item-est">
                  {typeof b.establishmentId === 'object' ? b.establishmentId.name : 'Estabelecimento'}
                </div>
                <div className="boost-item-duration">{b.durationDays} dias</div>
                <div className={`boost-item-status ${b.status}`}>
                  {statusIcon(b.status)}
                  {b.status === 'active' ? 'Ativo' : b.status === 'expired' ? 'Expirado' : b.status === 'pending' ? 'Pendente' : 'Cancelado'}
                </div>
                {b.endDate && (
                  <div className="boost-item-date">
                    até {new Date(b.endDate).toLocaleDateString('pt-BR')}
                  </div>
                )}
                <div className="boost-item-amount">
                  {formatPrice(b.amount / 100)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
