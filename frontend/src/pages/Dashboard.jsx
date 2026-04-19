import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Store, Package, Plus, Edit2, Trash2, X, Upload, Check, Wrench, Clock,
  Download, FileText, AlertCircle
} from 'lucide-react';
import './Dashboard.css';

const CATEGORIES = ['supermarket', 'pharmacy', 'bakery', 'butcher', 'restaurant', 'convenience', 'petshop', 'electronics', 'clothing', 'other'];
const CATEGORY_LABELS = { supermarket: 'Supermercado', pharmacy: 'Farmácia', bakery: 'Padaria', butcher: 'Açougue', restaurant: 'Restaurante', convenience: 'Conveniência', petshop: 'Pet Shop', electronics: 'Eletrônicos', clothing: 'Vestuário', other: 'Outros' };
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui', friday: 'Sex', saturday: 'Sáb', sunday: 'Dom' };

const DEFAULT_HOURS = DAYS.map(day => ({ day, open: '08:00', close: '18:00', closed: false }));

const PRODUCT_CATEGORY_SUGGESTIONS = [
  'Mercearia', 'Bebidas', 'Frutas e Verduras', 'Carnes', 'Laticínios',
  'Padaria', 'Congelados', 'Limpeza', 'Higiene', 'Medicamentos',
  'Suplementos', 'Cosméticos', 'Pet', 'Eletrônicos', 'Roupas',
  'Calçados', 'Acessórios', 'Ferramentas', 'Papelaria',
];

function CategoryInput({ value, onChange, placeholder = 'ex: Mercearia, Bebidas...' }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const filtered = query.trim()
    ? PRODUCT_CATEGORY_SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : [];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (val) => {
    setQuery(val);
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        className="form-input"
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => query.trim() && setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'white', border: '1.5px solid var(--border)', borderRadius: 10,
          boxShadow: 'var(--shadow)', marginTop: 4, maxHeight: 200, overflowY: 'auto',
        }}>
          {filtered.map(s => (
            <div
              key={s}
              onMouseDown={() => select(s)}
              style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--gradient-soft)'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatPrice(p) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('establishment');
  const [establishments, setEstablishments] = useState([]);
  const [selectedEst, setSelectedEst] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEstForm, setShowEstForm] = useState(false);
  const [editingEst, setEditingEst] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [services, setServices] = useState([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);

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
        loadServices(myEsts[0]._id);
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

  const loadServices = async (estId) => {
    try {
      const { data } = await api.get(`/establishments/${estId}/services`);
      setServices(data.services);
    } catch {}
  };

  const selectEst = (est) => {
    setSelectedEst(est);
    loadProducts(est._id);
    loadServices(est._id);
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
          <button className={`dash-tab ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>
            <Wrench size={18} /> Serviços
          </button>
          <button className={`dash-tab ${activeTab === 'hours' ? 'active' : ''}`} onClick={() => setActiveTab('hours')}>
            <Clock size={18} /> Horários
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
            {activeTab === 'services' && (
              <ServicesTab
                establishments={establishments}
                selectedEst={selectedEst}
                setSelectedEst={(e) => { setSelectedEst(e); loadServices(e._id); }}
                services={services}
                onRefresh={() => selectedEst && loadServices(selectedEst._id)}
                showForm={showServiceForm}
                setShowForm={setShowServiceForm}
                editingService={editingService}
                setEditingService={setEditingService}
              />
            )}
            {activeTab === 'hours' && (
              <HoursTab
                establishments={establishments}
                selectedEst={selectedEst}
                setSelectedEst={selectEst}
                onRefresh={loadData}
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
  const [geocoding, setGeocoding] = useState(false);
  const [geocoded, setGeocoded] = useState(!!initial?.location?.coordinates);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [estTab, setEstTab] = useState('info');
  const logoRef = useRef();
  const coverRef = useRef();

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleImageUpload = async (field, file, setUploading) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, [field]: data.url }));
      toast.success('Imagem enviada!');
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };
  const handleAddress = (field, value) => {
    setGeocoded(false);
    setForm(f => ({ ...f, address: { ...f.address, [field]: value } }));
  };
  const handleHours = (dayIdx, field, value) => {
    const hours = [...form.businessHours];
    hours[dayIdx] = { ...hours[dayIdx], [field]: value };
    setForm(f => ({ ...f, businessHours: hours }));
  };

  const geocodeAddress = async () => {
    const { street, number, neighborhood, city, state } = form.address;
    const q = [street, number, neighborhood, city, state, 'Brasil'].filter(Boolean).join(', ');
    setGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, {
        headers: { 'Accept-Language': 'pt-BR' },
      });
      const data = await res.json();
      if (!data.length) { toast.error('Endereço não encontrado. Verifique os dados.'); return false; }
      const { lon, lat } = data[0];
      setForm(f => ({ ...f, location: { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] } }));
      setGeocoded(true);
      toast.success('Localização encontrada!');
      return true;
    } catch {
      toast.error('Erro ao buscar localização');
      return false;
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!geocoded) {
      const ok = await geocodeAddress();
      if (!ok) return;
    }
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
        {true && (<>
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

          {/* Logo upload */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Logo</label>
              <div className="image-upload-inline">
                {form.logo && <img src={form.logo} alt="logo" className="image-preview-sm" />}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => logoRef.current.click()} disabled={uploadingLogo}>
                  {uploadingLogo ? <><div className="spinner spinner-dark" /> Enviando...</> : <><Upload size={14} /> {form.logo ? 'Trocar' : 'Enviar logo'}</>}
                </button>
                {form.logo && <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleChange('logo', '')}><X size={14} /></button>}
                <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload('logo', e.target.files[0], setUploadingLogo)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Foto de capa</label>
              <div className="image-upload-inline">
                {form.coverImage && <img src={form.coverImage} alt="capa" className="image-preview-sm" style={{ borderRadius: 6 }} />}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => coverRef.current.click()} disabled={uploadingCover}>
                  {uploadingCover ? <><div className="spinner spinner-dark" /> Enviando...</> : <><Upload size={14} /> {form.coverImage ? 'Trocar' : 'Enviar capa'}</>}
                </button>
                {form.coverImage && <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleChange('coverImage', '')}><X size={14} /></button>}
                <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload('coverImage', e.target.files[0], setUploadingCover)} />
              </div>
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
            <div className="form-group">
              <button type="button" className={`btn btn-sm ${geocoded ? 'btn-secondary' : 'btn-primary'}`} onClick={geocodeAddress} disabled={geocoding} style={{ marginTop: 4 }}>
                {geocoding ? <><div className="spinner" />Localizando...</> : geocoded ? '✓ Localização encontrada — clicar para atualizar' : '📍 Localizar endereço no mapa'}
              </button>
            </div>
          </fieldset>
        </>)}


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
const CSV_TEMPLATE = `nome,preco,categoria,descricao
Arroz Camil 5kg,28.90,Mercearia,Arroz tipo 1 grãos longos
Feijão Carioca 1kg,9.49,Mercearia,Feijão carioca selecionado
Leite Integral 1L,4.89,Laticínios,
Refrigerante 2L,9.99,Bebidas,
`;

function downloadCSVTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modelo-produtos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return { rows: [], errors: ['Arquivo vazio ou sem dados.'] };
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const required = ['nome', 'preco'];
  const missing = required.filter(r => !headers.includes(r));
  if (missing.length) return { rows: [], errors: [`Colunas obrigatórias faltando: ${missing.join(', ')}`] };

  const rows = [];
  const errors = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const row = {};
    headers.forEach((h, idx) => row[h] = cols[idx] || '');
    if (!row.nome) { errors.push(`Linha ${i + 1}: nome vazio`); continue; }
    const price = parseFloat(row.preco?.replace(',', '.'));
    if (isNaN(price) || price < 0) { errors.push(`Linha ${i + 1}: preço inválido ("${row.preco}")`); continue; }
    rows.push({ name: row.nome, price, category: row.categoria || '', description: row.descricao || '' });
  }
  return { rows, errors };
}

function ProductsTab({ establishments, selectedEst, setSelectedEst, products, onRefresh, showForm, setShowForm, editingProduct, setEditingProduct }) {
  const [csvPreview, setCsvPreview] = useState(null); // { rows, errors }
  const [importing, setImporting] = useState(false);
  const csvRef = useRef();

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

  const handleCSVFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = parseCSV(ev.target.result);
      setCsvPreview(result);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!csvPreview?.rows?.length || !selectedEst) return;
    setImporting(true);
    let ok = 0, fail = 0;
    for (const row of csvPreview.rows) {
      try {
        await api.post(`/establishments/${selectedEst._id}/products`, row);
        ok++;
      } catch {
        fail++;
      }
    }
    setImporting(false);
    setCsvPreview(null);
    toast.success(`${ok} produto${ok !== 1 ? 's' : ''} importado${ok !== 1 ? 's' : ''}${fail ? ` · ${fail} erro(s)` : ''}`);
    onRefresh();
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={downloadCSVTemplate} title="Baixar modelo CSV">
            <Download size={15} /> Modelo CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => csvRef.current.click()} disabled={!selectedEst} title="Importar CSV">
            <FileText size={15} /> Importar CSV
          </button>
          <input ref={csvRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleCSVFile} />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setEditingProduct(null); setShowForm(true); }}
            disabled={!selectedEst}
          >
            <Plus size={16} /> Novo Produto
          </button>
        </div>
      </div>

      {/* CSV Preview */}
      {csvPreview && (
        <div className="csv-preview">
          <div className="csv-preview-header">
            <div>
              <p className="csv-preview-title">
                <FileText size={16} /> Preview da importação — {csvPreview.rows.length} produto{csvPreview.rows.length !== 1 ? 's' : ''}
              </p>
              {csvPreview.errors.length > 0 && (
                <div className="csv-errors">
                  {csvPreview.errors.map((e, i) => (
                    <p key={i} className="csv-error-line"><AlertCircle size={12} /> {e}</p>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setCsvPreview(null)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={handleImport} disabled={importing || !csvPreview.rows.length}>
                {importing ? <><div className="spinner" /> Importando...</> : <><Check size={15} /> Confirmar importação</>}
              </button>
            </div>
          </div>
          <div className="csv-table-wrap">
            <table className="csv-table">
              <thead>
                <tr><th>Nome</th><th>Preço</th><th>Categoria</th><th>Descrição</th></tr>
              </thead>
              <tbody>
                {csvPreview.rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.name}</td>
                    <td>{formatPrice(r.price)}</td>
                    <td>{r.category || <span className="csv-empty">—</span>}</td>
                    <td>{r.description || <span className="csv-empty">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
      ) : products.length === 0 && !showForm && !csvPreview ? (
        <div className="dash-empty">
          <Package size={48} />
          <h3>Nenhum produto cadastrado</h3>
          <p>Adicione manualmente ou importe via CSV.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={downloadCSVTemplate}><Download size={16} /> Baixar modelo</button>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Adicionar Produto</button>
          </div>
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

// ---- Hours Tab ----
function HoursTab({ establishments, selectedEst, setSelectedEst, onRefresh }) {
  const [hours, setHours] = useState(selectedEst?.businessHours || DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);
  const [exceptions, setExceptions] = useState([]);
  const [newExc, setNewExc] = useState({ date: '', closed: true, open: '09:00', close: '18:00', reason: '' });
  const [savingExc, setSavingExc] = useState(false);

  useEffect(() => {
    setHours(selectedEst?.businessHours?.length ? selectedEst.businessHours : DEFAULT_HOURS);
    if (selectedEst) loadExceptions(selectedEst._id);
  }, [selectedEst]);

  const loadExceptions = async (estId) => {
    try {
      const { data } = await api.get(`/establishments/${estId}/hours-exceptions`);
      setExceptions(data.exceptions);
    } catch {}
  };

  const handleAddException = async () => {
    if (!newExc.date) return toast.error('Selecione uma data');
    setSavingExc(true);
    try {
      await api.post(`/establishments/${selectedEst._id}/hours-exceptions`, newExc);
      toast.success('Exceção salva!');
      setNewExc({ date: '', closed: true, open: '09:00', close: '18:00', reason: '' });
      loadExceptions(selectedEst._id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSavingExc(false);
    }
  };

  const handleDeleteException = async (id) => {
    try {
      await api.delete(`/establishments/${selectedEst._id}/hours-exceptions/${id}`);
      setExceptions(prev => prev.filter(e => e._id !== id));
      toast.success('Exceção removida');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const handleHours = (dayIdx, field, value) => {
    setHours(prev => {
      const next = [...prev];
      next[dayIdx] = { ...next[dayIdx], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedEst) return;
    setSaving(true);
    try {
      await api.put(`/establishments/${selectedEst._id}`, { businessHours: hours });
      toast.success('Horários salvos!');
      onRefresh();
    } catch {
      toast.error('Erro ao salvar horários');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2>Horários de Funcionamento</h2>
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
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !selectedEst}>
          {saving ? <><div className="spinner" />Salvando...</> : <><Check size={16} />Salvar horários</>}
        </button>
      </div>

      {!selectedEst ? (
        <div className="dash-empty">
          <Clock size={48} />
          <h3>Nenhum estabelecimento selecionado</h3>
        </div>
      ) : (<>
        {/* Horários semanais */}
        <div className="form-panel" style={{ boxShadow: 'none', marginBottom: 24 }}>
          <div className="hours-grid">
            {hours.map((h, i) => (
              <div key={h.day} className="hours-row">
                <span className="hours-day">{DAY_LABELS[h.day]}</span>
                <label className="hours-closed-label">
                  <input type="checkbox" checked={h.closed} onChange={e => handleHours(i, 'closed', e.target.checked)} />
                  Fechado
                </label>
                {!h.closed && (() => {
                  const is24 = h.open === '00:00' && h.close === '23:59';
                  return (
                    <div className="hours-time-range">
                      {!is24 && <>
                        <input type="time" className="form-input hours-input" value={h.open} onChange={e => handleHours(i, 'open', e.target.value)} />
                        <span>até</span>
                        <input type="time" className="form-input hours-input" value={h.close} onChange={e => handleHours(i, 'close', e.target.value)} />
                      </>}
                      {is24 && <span className="hours-row-24h">Aberto 24 horas</span>}
                      <button
                        type="button"
                        className={`btn btn-sm ${is24 ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: 11, padding: '4px 10px', marginLeft: 4 }}
                        onClick={() => {
                          if (is24) { handleHours(i, 'open', '09:00'); handleHours(i, 'close', '18:00'); }
                          else { handleHours(i, 'open', '00:00'); handleHours(i, 'close', '23:59'); }
                        }}
                      >
                        24h
                      </button>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>

        {/* Exceções */}
        <div className="exc-section">
          <h3 className="exc-title">Exceções de Horário</h3>
          <p className="exc-subtitle">Feriados, eventos ou qualquer dia com horário diferente do padrão.</p>

          {/* Formulário nova exceção */}
          <div className="exc-form">
            <div className="exc-form-row">
              <div className="form-group" style={{ flex: '0 0 160px' }}>
                <label className="form-label">Data</label>
                <input
                  type="date"
                  className="form-input"
                  value={newExc.date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setNewExc(v => ({ ...v, date: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ flex: '0 0 180px' }}>
                <label className="form-label">Motivo</label>
                <input
                  className="form-input"
                  placeholder="ex: Natal, Feriado..."
                  value={newExc.reason}
                  onChange={e => setNewExc(v => ({ ...v, reason: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ flex: '0 0 auto', justifyContent: 'flex-end' }}>
                <label className="form-label">&nbsp;</label>
                <label className="hours-closed-label" style={{ paddingTop: 8 }}>
                  <input
                    type="checkbox"
                    checked={newExc.closed}
                    onChange={e => setNewExc(v => ({ ...v, closed: e.target.checked }))}
                  />
                  Fechado
                </label>
              </div>
              {!newExc.closed && (() => {
                const is24 = newExc.open === '00:00' && newExc.close === '23:59';
                return (
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Horário</label>
                    <div className="hours-time-range">
                      {!is24 && <>
                        <input type="time" className="form-input hours-input" value={newExc.open} onChange={e => setNewExc(v => ({ ...v, open: e.target.value }))} />
                        <span>até</span>
                        <input type="time" className="form-input hours-input" value={newExc.close} onChange={e => setNewExc(v => ({ ...v, close: e.target.value }))} />
                      </>}
                      {is24 && <span className="hours-row-24h">Aberto 24 horas</span>}
                      <button
                        type="button"
                        className={`btn btn-sm ${is24 ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={() => is24
                          ? setNewExc(v => ({ ...v, open: '09:00', close: '18:00' }))
                          : setNewExc(v => ({ ...v, open: '00:00', close: '23:59' }))
                        }
                      >
                        24h
                      </button>
                    </div>
                  </div>
                );
              })()}
              <div className="form-group" style={{ flex: '0 0 auto', justifyContent: 'flex-end' }}>
                <label className="form-label">&nbsp;</label>
                <button className="btn btn-primary btn-sm" onClick={handleAddException} disabled={savingExc}>
                  {savingExc ? <div className="spinner" /> : <Plus size={15} />}
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de exceções */}
          {exceptions.length === 0 ? (
            <p className="exc-empty">Nenhuma exceção cadastrada.</p>
          ) : (
            <div className="exc-list">
              {exceptions.map(exc => (
                <div key={exc._id} className={`exc-item ${exc.closed ? 'exc-item--closed' : ''}`}>
                  <div className="exc-item-date">
                    {new Date(exc.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="exc-item-info">
                    {exc.reason && <span className="exc-item-reason">{exc.reason}</span>}
                    {exc.closed
                      ? <span className="exc-item-closed">Fechado</span>
                      : <span className="exc-item-hours">{exc.open} – {exc.close}</span>
                    }
                  </div>
                  <button className="btn btn-ghost btn-sm est-delete-btn" onClick={() => handleDeleteException(exc._id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </>)}
    </div>
  );
}

// ---- Services Tab ----
function ServicesTab({ establishments, selectedEst, setSelectedEst, services, onRefresh, showForm, setShowForm, editingService, setEditingService }) {
  const handleDelete = async (serviceId) => {
    if (!confirm('Remover este serviço?')) return;
    try {
      await api.delete(`/establishments/${selectedEst._id}/services/${serviceId}`);
      toast.success('Serviço removido');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao deletar');
    }
  };

  const PRICE_TYPE_LABELS = { fixed: 'Valor fixo', from: 'A partir de', free: 'Gratuito', on_request: 'Sob consulta' };

  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2>Serviços</h2>
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
          onClick={() => { setEditingService(null); setShowForm(true); }}
          disabled={!selectedEst}
        >
          <Plus size={16} /> Novo Serviço
        </button>
      </div>

      {showForm && selectedEst && (
        <ServiceForm
          initial={editingService}
          establishmentId={selectedEst._id}
          onClose={() => { setShowForm(false); setEditingService(null); }}
          onSave={() => { setShowForm(false); setEditingService(null); onRefresh(); }}
        />
      )}

      {!selectedEst ? (
        <div className="dash-empty">
          <Wrench size={48} />
          <h3>Nenhum estabelecimento selecionado</h3>
          <p>Crie um estabelecimento primeiro.</p>
        </div>
      ) : services.length === 0 && !showForm ? (
        <div className="dash-empty">
          <Wrench size={48} />
          <h3>Nenhum serviço cadastrado</h3>
          <p>Adicione os serviços que seu estabelecimento oferece.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Adicionar Serviço
          </button>
        </div>
      ) : (
        <div className="products-list">
          {services.map(s => (
            <div key={s._id} className="product-list-item">
              <div className="product-list-image">
                {s.images?.[0]
                  ? <img src={s.images[0]} alt={s.name} />
                  : <div className="product-list-no-img">🔧</div>
                }
              </div>
              <div className="product-list-info">
                <p className="product-list-name">{s.name}</p>
                {s.duration && <p className="product-list-cat">⏱ {s.duration}</p>}
                <p className="product-list-desc">{s.description}</p>
              </div>
              <div className="product-list-price">
                {s.priceType === 'free' && 'Gratuito'}
                {s.priceType === 'on_request' && 'Sob consulta'}
                {s.priceType === 'fixed' && s.price != null && formatPrice(s.price)}
                {s.priceType === 'from' && s.price != null && `A partir de ${formatPrice(s.price)}`}
              </div>
              <div className="product-list-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingService(s); setShowForm(true); }}>
                  <Edit2 size={14} />
                </button>
                <button className="btn btn-ghost btn-sm est-delete-btn" onClick={() => handleDelete(s._id)}>
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

// ---- Service Form ----
function ServiceForm({ initial, establishmentId, onClose, onSave }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    price: initial?.price ?? '',
    priceType: initial?.priceType || 'fixed',
    duration: initial?.duration || '',
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
      const { data } = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, images: [...f.images, data.url] }));
      toast.success('Imagem enviada!');
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.priceType === 'free' || form.priceType === 'on_request' ? undefined : parseFloat(form.price),
      };
      if (initial) {
        await api.put(`/establishments/${establishmentId}/services/${initial._id}`, payload);
        toast.success('Serviço atualizado!');
      } else {
        await api.post(`/establishments/${establishmentId}/services`, payload);
        toast.success('Serviço adicionado!');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const showPrice = form.priceType === 'fixed' || form.priceType === 'from';

  return (
    <div className="form-panel">
      <div className="form-panel-header">
        <h3>{initial ? 'Editar Serviço' : 'Novo Serviço'}</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} className="est-form">
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Nome do Serviço *</label>
            <input className="form-input" value={form.name} onChange={e => handleChange('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Duração</label>
            <input className="form-input" value={form.duration} onChange={e => handleChange('duration', e.target.value)} placeholder="ex: 30 min, 1h30" />
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Tipo de preço</label>
            <select className="form-input" value={form.priceType} onChange={e => handleChange('priceType', e.target.value)}>
              <option value="fixed">Valor fixo</option>
              <option value="from">A partir de</option>
              <option value="free">Gratuito</option>
              <option value="on_request">Sob consulta</option>
            </select>
          </div>
          {showPrice && (
            <div className="form-group">
              <label className="form-label">Preço (R$) *</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.price} onChange={e => handleChange('price', e.target.value)} required={showPrice} />
            </div>
          )}
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
            <button type="button" className="image-upload-btn" onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? <div className="spinner spinner-dark" /> : <Upload size={20} />}
              <span>{uploading ? 'Enviando...' : 'Adicionar foto'}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          </div>
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
          <CategoryInput value={form.category} onChange={v => handleChange('category', v)} />
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

