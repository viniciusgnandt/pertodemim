import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  Store, Package, Plus, Edit2, Trash2, X, Upload, Check, Wrench, Clock,
  Download, FileText, AlertCircle, ChevronLeft, Plug, RefreshCw
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
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEstForm, setShowEstForm] = useState(false);
  const [editingEst, setEditingEst] = useState(null);
  // null = list view; an est object = detail view
  const [openEst, setOpenEst] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/establishments', { params: { limit: 50 } });
      const myEsts = data.establishments.filter(e => (e.ownerId?._id || e.ownerId) === user._id);
      setEstablishments(myEsts);
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEst = (est) => { setOpenEst(est); };
  const handleBack = () => { setOpenEst(null); };

  return (
    <div className="dashboard page-enter">
      <div className="dashboard-header">
        <div className="container dashboard-header-inner">
          <div>
            <h1>{openEst ? openEst.name : 'Dashboard'}</h1>
            <p>{openEst ? (CATEGORY_LABELS[openEst.category] || openEst.category) : 'Gerencie seus estabelecimentos'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {openEst && (
              <button className="dash-back-btn" onClick={handleBack}>
                <ChevronLeft size={14} /> Voltar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container dashboard-body">
        {loading ? (
          <div className="dash-loading"><div className="spinner spinner-dark" /></div>
        ) : openEst ? (
          <EstablishmentDetail
            est={openEst}
            onBack={handleBack}
            onRefresh={loadData}
            onEditEst={(est) => { setEditingEst(est); setShowEstForm(true); }}
          />
        ) : (
          <EstablishmentList
            establishments={establishments}
            onOpen={handleOpenEst}
            onRefresh={loadData}
            showForm={showEstForm}
            setShowForm={setShowEstForm}
            editingEst={editingEst}
            setEditingEst={setEditingEst}
          />
        )}
      </div>
    </div>
  );
}

// ---- Establishment Detail (tabs inside) ----
function EstablishmentDetail({ est, onBack, onRefresh, onEditEst }) {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    loadProducts();
    loadServices();
  }, [est._id]);

  const loadProducts = async () => {
    try { const { data } = await api.get(`/establishments/${est._id}/products`); setProducts(data.products); } catch {}
  };
  const loadServices = async () => {
    try { const { data } = await api.get(`/establishments/${est._id}/services`); setServices(data.services); } catch {}
  };

  return (
    <div className="dash-section">
      <div className="dashboard-tabs">
        <button className={`dash-tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
          <Package size={18} /> Produtos
        </button>
        <button className={`dash-tab ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>
          <Wrench size={18} /> Serviços
        </button>
        <button className={`dash-tab ${activeTab === 'hours' ? 'active' : ''}`} onClick={() => setActiveTab('hours')}>
          <Clock size={18} /> Horários
        </button>
        <button className={`dash-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          <Store size={18} /> Informações
        </button>
      </div>

      {activeTab === 'products' && (
        <ProductsTab
          establishments={[est]}
          selectedEst={est}
          setSelectedEst={() => {}}
          products={products}
          onRefresh={loadProducts}
          showForm={showProductForm}
          setShowForm={setShowProductForm}
          editingProduct={editingProduct}
          setEditingProduct={setEditingProduct}
        />
      )}
      {activeTab === 'services' && (
        <ServicesTab
          establishments={[est]}
          selectedEst={est}
          setSelectedEst={() => {}}
          services={services}
          onRefresh={loadServices}
          showForm={showServiceForm}
          setShowForm={setShowServiceForm}
          editingService={editingService}
          setEditingService={setEditingService}
        />
      )}
      {activeTab === 'hours' && (
        <HoursTab
          establishments={[est]}
          selectedEst={est}
          setSelectedEst={() => {}}
          onRefresh={onRefresh}
        />
      )}
      {activeTab === 'info' && (
        <EstablishmentInfoTab est={est} onEdit={onEditEst} onRefresh={onRefresh} />
      )}
    </div>
  );
}

function EstablishmentInfoTab({ est, onEdit, onRefresh }) {
  const handleDelete = async () => {
    if (!confirm('Deletar este estabelecimento? Todos os produtos serão removidos.')) return;
    try {
      await api.delete(`/establishments/${est._id}`);
      toast.success('Estabelecimento removido');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao deletar');
    }
  };

  return (
    <div className="est-info-tab">
      <div className="est-info-cover">
        {est.coverImage
          ? <img src={est.coverImage} alt="Capa" className="est-info-cover-img" />
          : <div className="est-info-cover-empty">📷</div>}
        {est.logo && <img src={est.logo} alt="Logo" className="est-info-logo" />}
      </div>
      <div className="est-info-body">
        <div className="est-info-row"><span>Nome</span><strong>{est.name}</strong></div>
        {est.description && <div className="est-info-row"><span>Descrição</span><strong>{est.description}</strong></div>}
        <div className="est-info-row"><span>Categoria</span><strong>{CATEGORY_LABELS[est.category] || est.category}</strong></div>
        {est.address?.street && <div className="est-info-row"><span>Endereço</span><strong>{est.address.street}{est.address.number ? `, ${est.address.number}` : ''} — {est.address.city}</strong></div>}
        {est.phone && <div className="est-info-row"><span>Telefone</span><strong>{est.phone}</strong></div>}
        {est.website && <div className="est-info-row"><span>Site</span><strong>{est.website}</strong></div>}
      </div>
      <div className="est-info-actions">
        <button className="btn btn-secondary" onClick={() => onEdit(est)}><Edit2 size={15} /> Editar</button>
        <button className="btn btn-ghost est-delete-btn" onClick={handleDelete}><Trash2 size={15} /> Excluir</button>
      </div>
    </div>
  );
}

// ---- Establishment List ----
function EstablishmentList({ establishments, onOpen, onRefresh, showForm, setShowForm, editingEst, setEditingEst }) {
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
        <div className="est-cards-grid">
          {establishments.map(est => (
            <div key={est._id} className="est-card-dash" onClick={() => onOpen(est)}>
              <div className="est-card-dash-cover">
                {est.coverImage
                  ? <img src={est.coverImage} alt="Capa" />
                  : <div className="est-card-dash-cover-empty">🏪</div>}
                {est.logo && <img src={est.logo} alt="Logo" className="est-card-dash-logo" />}
              </div>
              <div className="est-card-dash-body">
                <p className="est-card-dash-name">{est.name}</p>
                <p className="est-card-dash-cat">{CATEGORY_LABELS[est.category] || est.category}</p>
                {est.address?.city && <p className="est-card-dash-city">{est.address.city}</p>}
              </div>
              <div className="est-card-dash-actions" onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm" title="Editar" onClick={() => { setEditingEst(est); setShowForm(true); }}>
                  <Edit2 size={14} />
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

function downloadXLSXTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['nome', 'preco', 'categoria', 'descricao'],
    ['Arroz Camil 5kg', 28.90, 'Mercearia', 'Arroz tipo 1 grãos longos'],
    ['Feijão Carioca 1kg', 9.49, 'Mercearia', 'Feijão carioca selecionado'],
    ['Leite Integral 1L', 4.89, 'Laticínios', ''],
    ['Refrigerante 2L', 9.99, 'Bebidas', ''],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
  XLSX.writeFile(wb, 'modelo-produtos.xlsx');
}

const JSON_TEMPLATE = JSON.stringify([
  { nome: 'Arroz Camil 5kg', preco: 28.90, categoria: 'Mercearia', descricao: 'Arroz tipo 1 grãos longos' },
  { nome: 'Feijão Carioca 1kg', preco: 9.49, categoria: 'Mercearia', descricao: 'Feijão carioca selecionado' },
  { nome: 'Leite Integral 1L', preco: 4.89, categoria: 'Laticínios', descricao: '' },
  { nome: 'Refrigerante 2L', preco: 9.99, categoria: 'Bebidas', descricao: '' },
], null, 2);

function downloadJSONTemplate() {
  const blob = new Blob([JSON_TEMPLATE], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'modelo-produtos.json'; a.click();
  URL.revokeObjectURL(url);
}

const XML_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<produtos>
  <produto>
    <nome>Arroz Camil 5kg</nome>
    <preco>28.90</preco>
    <categoria>Mercearia</categoria>
    <descricao>Arroz tipo 1 grãos longos</descricao>
  </produto>
  <produto>
    <nome>Feijão Carioca 1kg</nome>
    <preco>9.49</preco>
    <categoria>Mercearia</categoria>
    <descricao>Feijão carioca selecionado</descricao>
  </produto>
  <produto>
    <nome>Leite Integral 1L</nome>
    <preco>4.89</preco>
    <categoria>Laticínios</categoria>
    <descricao></descricao>
  </produto>
</produtos>`;

function downloadXMLTemplate() {
  const blob = new Blob([XML_TEMPLATE], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'modelo-produtos.xml'; a.click();
  URL.revokeObjectURL(url);
}

function parseXLSX(buffer) {
  try {
    const wb = XLSX.read(buffer, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (data.length < 2) return { rows: [], errors: ['Arquivo vazio ou sem dados.'] };
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const required = ['nome', 'preco'];
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length) return { rows: [], errors: [`Colunas obrigatórias faltando: ${missing.join(', ')}`] };
    const rows = [];
    const errors = [];
    for (let i = 1; i < data.length; i++) {
      const cols = data[i];
      const row = {};
      headers.forEach((h, idx) => row[h] = cols[idx] != null ? String(cols[idx]).trim() : '');
      if (!row.nome) { errors.push(`Linha ${i + 1}: nome vazio`); continue; }
      const price = parseFloat(String(row.preco).replace(',', '.'));
      if (isNaN(price) || price < 0) { errors.push(`Linha ${i + 1}: preço inválido ("${row.preco}")`); continue; }
      rows.push({ name: row.nome, price, category: row.categoria || '', description: row.descricao || '' });
    }
    return { rows, errors };
  } catch (e) {
    return { rows: [], errors: ['Erro ao ler o arquivo Excel.'] };
  }
}

function parseJSON(text) {
  try {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : data.produtos || data.products || [];
    if (!arr.length) return { rows: [], errors: ['Nenhum produto encontrado no arquivo.'] };
    const rows = [];
    const errors = [];
    arr.forEach((item, i) => {
      const nome = item.nome || item.name || '';
      const preco = item.preco ?? item.price ?? item.preço;
      if (!nome) { errors.push(`Item ${i + 1}: campo "nome" vazio`); return; }
      const price = parseFloat(String(preco).replace(',', '.'));
      if (isNaN(price) || price < 0) { errors.push(`Item ${i + 1}: preço inválido ("${preco}")`); return; }
      rows.push({ name: nome, price, category: item.categoria || item.category || '', description: item.descricao || item.description || '' });
    });
    return { rows, errors };
  } catch {
    return { rows: [], errors: ['JSON inválido. Verifique a estrutura do arquivo.'] };
  }
}

function parseXML(text) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    const parseErr = doc.querySelector('parsererror');
    if (parseErr) return { rows: [], errors: ['XML inválido. Verifique a estrutura do arquivo.'] };
    const items = Array.from(doc.querySelectorAll('produto, product, item'));
    if (!items.length) return { rows: [], errors: ['Nenhum elemento <produto> encontrado no XML.'] };
    const rows = [];
    const errors = [];
    const txt = (el, ...tags) => { for (const t of tags) { const n = el.querySelector(t); if (n) return n.textContent.trim(); } return ''; };
    items.forEach((el, i) => {
      const nome = txt(el, 'nome', 'name');
      const precoRaw = txt(el, 'preco', 'price', 'preço');
      if (!nome) { errors.push(`Item ${i + 1}: campo <nome> vazio`); return; }
      const price = parseFloat(precoRaw.replace(',', '.'));
      if (isNaN(price) || price < 0) { errors.push(`Item ${i + 1}: preço inválido ("${precoRaw}")`); return; }
      rows.push({ name: nome, price, category: txt(el, 'categoria', 'category'), description: txt(el, 'descricao', 'description') });
    });
    return { rows, errors };
  } catch {
    return { rows: [], errors: ['Erro ao processar o arquivo XML.'] };
  }
}

function parseNFe(text) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    const parseErr = doc.querySelector('parsererror');
    if (parseErr) return { rows: [], errors: ['XML inválido. Verifique se é uma NFe válida.'] };
    // NFe products are inside <det> elements, each with <prod>
    const dets = Array.from(doc.querySelectorAll('det'));
    if (!dets.length) return { rows: [], errors: ['Nenhum item encontrado. Verifique se o arquivo é uma NFe.'] };
    const rows = [];
    const errors = [];
    dets.forEach((det, i) => {
      const prod = det.querySelector('prod');
      if (!prod) { errors.push(`Item ${i + 1}: elemento <prod> não encontrado`); return; }
      const txt = (tag) => prod.querySelector(tag)?.textContent.trim() || '';
      const nome = txt('xProd');
      // vUnCom = unit price, vProd = total value
      const precoRaw = txt('vUnCom') || txt('vProd');
      if (!nome) { errors.push(`Item ${i + 1}: nome do produto vazio`); return; }
      const price = parseFloat(precoRaw.replace(',', '.'));
      if (isNaN(price) || price < 0) { errors.push(`Item ${i + 1}: preço inválido ("${precoRaw}")`); return; }
      // NCM can hint at category; use xProd as description fallback
      rows.push({ name: nome, price, category: '', description: '' });
    });
    return { rows, errors };
  } catch {
    return { rows: [], errors: ['Erro ao processar a NFe.'] };
  }

}

async function fetchGoogleSheet(url) {
  try {
    // Extract spreadsheet ID and optionally gid
    const idMatch = url.match(/\/d\/([\w-]+)/);
    if (!idMatch) return { rows: [], errors: ['URL inválida. Use o link de compartilhamento da planilha.'] };
    const id = idMatch[1];
    const gidMatch = url.match(/[?&#]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    const res = await fetch(csvUrl);
    if (!res.ok) return { rows: [], errors: ['Não foi possível acessar a planilha. Verifique se ela está pública ("Qualquer pessoa com o link").'] };
    const text = await res.text();
    return parseCSV(text);
  } catch {
    return { rows: [], errors: ['Erro ao buscar a planilha. Verifique a URL e as permissões.'] };
  }
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

const IMPORT_FORMATS = [
  {
    key: 'xlsx',
    label: 'Excel',
    icon: '📊',
    description: 'Arquivo .xlsx do Microsoft Excel ou Google Sheets',
    accept: '.xlsx,.xls',
    template: downloadXLSXTemplate,
  },
  {
    key: 'nfe',
    label: 'NFe',
    icon: '🧾',
    description: 'XML de Nota Fiscal Eletrônica',
    accept: '.xml,application/xml,text/xml',
  },
  {
    key: 'csv',
    label: 'CSV',
    icon: '📄',
    description: 'Planilha de texto separada por vírgulas',
    accept: '.csv,text/csv',
    template: downloadCSVTemplate,
  },
  {
    key: 'json',
    label: 'JSON',
    icon: '🗂️',
    description: 'Array de objetos no formato JSON',
    accept: '.json,application/json',
    template: downloadJSONTemplate,
  },
  {
    key: 'xml',
    label: 'XML',
    icon: '🧩',
    description: 'Lista de <produto> em formato XML',
    accept: '.xml,application/xml,text/xml',
    template: downloadXMLTemplate,
  },
];

function ImportModal({ onClose, onParsed }) {
  const fileRefs = useRef({});
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetLoading, setSheetLoading] = useState(false);

  const handleFile = (fmt, e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    if (fmt === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (ev) => { onParsed(parseXLSX(new Uint8Array(ev.target.result))); onClose(); };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = fmt === 'csv' ? parseCSV(ev.target.result)
          : fmt === 'json' ? parseJSON(ev.target.result)
          : fmt === 'nfe' ? parseNFe(ev.target.result)
          : parseXML(ev.target.result);
        onParsed(result);
        onClose();
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const handleGSheets = async () => {
    if (!sheetUrl.trim()) return;
    setSheetLoading(true);
    const result = await fetchGoogleSheet(sheetUrl.trim());
    setSheetLoading(false);
    onParsed(result);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box import-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Importar Produtos</h3>
            <p className="modal-subtitle">Escolha o formato. Baixe o modelo para ver a estrutura esperada.</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="import-formats-grid">
          {IMPORT_FORMATS.map(fmt => (
            <div key={fmt.key} className="import-format-card">
              <div className="import-format-icon">{fmt.icon}</div>
              <div className="import-format-info">
                <span className="import-format-label">{fmt.label}</span>
                <span className="import-format-desc">{fmt.description}</span>
              </div>

              {fmt.urlInput ? (
                <div className="import-format-url">
                  <input
                    className="form-input"
                    style={{ fontSize: 12, padding: '6px 10px' }}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetUrl}
                    onChange={e => setSheetUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleGSheets()}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleGSheets} disabled={!sheetUrl.trim() || sheetLoading}>
                    {sheetLoading ? <><div className="spinner" /> Buscando...</> : <><Upload size={13} /> Importar</>}
                  </button>
                </div>
              ) : (
                <div className="import-format-actions">
                  {fmt.template && (
                    <button className="btn btn-ghost btn-sm" onClick={fmt.template} title={`Baixar modelo ${fmt.label}`}>
                      <Download size={13} /> Modelo
                    </button>
                  )}
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    if (!fileRefs.current[fmt.key]) return;
                    fileRefs.current[fmt.key].click();
                  }}>
                    <Upload size={13} /> Selecionar
                  </button>
                  <input
                    ref={el => fileRefs.current[fmt.key] = el}
                    type="file"
                    accept={fmt.accept}
                    style={{ display: 'none' }}
                    onChange={e => handleFile(fmt.key, e)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="import-modal-note">
          Campos obrigatórios: <strong>nome</strong> e <strong>preco</strong>. Opcionais: <em>categoria</em>, <em>descricao</em>.
        </p>
      </div>
    </div>
  );
}

function BulkActionsBar({ selected, products, onClearSelection, onRefresh, selectedEst }) {
  const [action, setAction] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [priceChange, setPriceChange] = useState('');
  const [priceMode, setPriceMode] = useState('percent'); // 'percent' | 'fixed'
  const [applying, setApplying] = useState(false);

  const selectedProducts = products.filter(p => selected.has(p._id));
  const count = selectedProducts.length;

  const apply = async () => {
    if (!action) return;
    setApplying(true);
    let ok = 0, fail = 0;
    for (const p of selectedProducts) {
      try {
        let update = {};
        if (action === 'delete') {
          await api.delete(`/establishments/${selectedEst._id}/products/${p._id}`);
          ok++; continue;
        }
        if (action === 'category') update = { ...p, category: newCategory };
        if (action === 'activate') update = { ...p, isActive: true };
        if (action === 'deactivate') update = { ...p, isActive: false };
        if (action === 'price') {
          const val = parseFloat(priceChange);
          if (isNaN(val)) { fail++; continue; }
          const newPrice = priceMode === 'percent'
            ? Math.max(0, p.price * (1 + val / 100))
            : Math.max(0, p.price + val);
          update = { ...p, price: Math.round(newPrice * 100) / 100 };
        }
        await api.put(`/establishments/${selectedEst._id}/products/${p._id}`, update);
        ok++;
      } catch { fail++; }
    }
    setApplying(false);
    onClearSelection();
    onRefresh();
    toast.success(`${ok} produto${ok !== 1 ? 's' : ''} atualizado${ok !== 1 ? 's' : ''}${fail ? ` · ${fail} erro(s)` : ''}`);
  };

  const needsConfirm = action === 'delete';

  return (
    <div className="bulk-bar">
      <span className="bulk-bar-count">{count} selecionado{count !== 1 ? 's' : ''}</span>
      <div className="bulk-bar-actions">
        <select className="form-input bulk-action-select" value={action} onChange={e => setAction(e.target.value)}>
          <option value="">Escolher ação...</option>
          <option value="activate">✅ Ativar</option>
          <option value="deactivate">🚫 Desativar</option>
          <option value="category">🏷️ Alterar categoria</option>
          <option value="price">💰 Alterar preço</option>
          <option value="delete">🗑️ Excluir</option>
        </select>

        {action === 'category' && (
          <CategoryInput value={newCategory} onChange={setNewCategory} placeholder="Nova categoria..." />
        )}

        {action === 'price' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select className="form-input" style={{ width: 'auto', fontSize: 13 }} value={priceMode} onChange={e => setPriceMode(e.target.value)}>
              <option value="percent">% percentual</option>
              <option value="fixed">R$ valor fixo</option>
            </select>
            <input
              className="form-input"
              style={{ width: 90 }}
              placeholder={priceMode === 'percent' ? 'ex: 10 ou -5' : 'ex: 2.00'}
              value={priceChange}
              onChange={e => setPriceChange(e.target.value)}
            />
          </div>
        )}

        {action && (
          <button
            className={`btn btn-sm ${needsConfirm ? 'btn-danger' : 'btn-primary'}`}
            onClick={needsConfirm ? () => { if (confirm(`Excluir ${count} produto(s)?`)) apply(); } : apply}
            disabled={applying || !action || (action === 'category' && !newCategory) || (action === 'price' && !priceChange)}
          >
            {applying ? <><div className="spinner" /> Aplicando...</> : 'Aplicar'}
          </button>
        )}
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onClearSelection}>
        <X size={14} /> Cancelar
      </button>
    </div>
  );
}

// ---- Integrations Modal ----
const INTEGRATIONS_CATALOG = [
  { key: 'bling', name: 'Bling', logo: '🟦', description: 'ERP brasileiro para e-commerces', category: 'ERP', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Sua chave de API do Bling' }] },
  { key: 'tiny', name: 'Tiny ERP', logo: '🟩', description: 'Gestão para lojas virtuais e físicas', category: 'ERP', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Token de acesso do Tiny' }] },
  { key: 'omie', name: 'Omie', logo: '🟧', description: 'ERP em nuvem completo', category: 'ERP', fields: [{ key: 'appKey', label: 'App Key', type: 'text', placeholder: 'App Key' }, { key: 'appSecret', label: 'App Secret', type: 'password', placeholder: 'App Secret' }] },
  { key: 'woocommerce', name: 'WooCommerce', logo: '🟪', description: 'Importe produtos da sua loja WooCommerce', category: 'E-commerce', fields: [{ key: 'url', label: 'URL da loja', type: 'text', placeholder: 'https://minhaloja.com.br' }, { key: 'consumerKey', label: 'Consumer Key', type: 'text', placeholder: 'ck_...' }, { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', placeholder: 'cs_...' }] },
  { key: 'shopify', name: 'Shopify', logo: '🟫', description: 'Sincronize o catálogo da sua loja Shopify', category: 'E-commerce', fields: [{ key: 'shopDomain', label: 'Domínio', type: 'text', placeholder: 'loja.myshopify.com' }, { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'shpat_...' }] },
  { key: 'mercadolivre', name: 'Mercado Livre', logo: '🟡', description: 'Importe anúncios do Mercado Livre', category: 'Marketplace', fields: [{ key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'APP_USR-...' }, { key: 'sellerId', label: 'Seller ID', type: 'text', placeholder: 'Seu ID de vendedor' }] },
  { key: 'airtable', name: 'Airtable', logo: '🔵', description: 'Banco de dados visual com seus produtos', category: 'Planilha', fields: [{ key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'pat...' }, { key: 'baseId', label: 'Base ID', type: 'text', placeholder: 'app...' }, { key: 'tableId', label: 'Tabela', type: 'text', placeholder: 'Produtos' }] },
  { key: 'feedurl', name: 'Feed URL', logo: '🌐', description: 'URL pública que retorna JSON ou XML', category: 'Genérico', fields: [{ key: 'url', label: 'URL', type: 'text', placeholder: 'https://...' }, { key: 'format', label: 'Formato', type: 'select', options: ['json', 'xml'] }] },
];
const COMING_SOON_INT = [
  { key: 'nuvemshop', name: 'Nuvemshop', logo: '☁️' },
  { key: 'vtex', name: 'VTEX', logo: '⚡' },
  { key: 'totvs', name: 'TOTVS', logo: '🔷' },
];

function IntegrationsModal({ est, onClose, onImported }) {
  const [connected, setConnected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingTo, setConnectingTo] = useState(null);
  const [syncingWith, setSyncingWith] = useState(null);
  const [connectForm, setConnectForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [syncMode, setSyncMode] = useState('both');

  useEffect(() => { loadConnected(); }, []);

  const loadConnected = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/integrations');
      setConnected(data.integrations || []);
    } catch {} finally { setLoading(false); }
  };

  const handleConnect = async () => {
    const missing = connectingTo.fields.filter(f => f.type !== 'select' && !connectForm[f.key]);
    if (missing.length) return toast.error(`Preencha: ${missing.map(f => f.label).join(', ')}`);
    setSaving(true);
    try {
      await api.post('/integrations', { key: connectingTo.key, credentials: connectForm });
      toast.success(`${connectingTo.name} conectado!`);
      setConnectingTo(null); setConnectForm({});
      loadConnected();
    } catch (err) { toast.error(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDisconnect = async (id, name) => {
    if (!confirm(`Desconectar ${name}?`)) return;
    try { await api.delete(`/integrations/${id}`); toast.success('Removido'); loadConnected(); }
    catch { toast.error('Erro ao remover'); }
  };

  const fetchPreview = async () => {
    setSyncing(true); setPreview(null);
    try {
      const { data } = await api.post(`/integrations/${syncingWith._id}/preview`);
      setPreview(data.products || []);
    } catch (err) { toast.error(err.response?.data?.error || 'Erro ao buscar produtos'); }
    finally { setSyncing(false); }
  };

  const handleSync = async () => {
    if (!est || !preview?.length) return;
    setSyncing(true);
    const existing = await api.get(`/establishments/${est._id}/products`).then(r => r.data.products).catch(() => []);
    const map = {}; existing.forEach(p => { map[p.name.trim().toLowerCase()] = p._id; });
    let added = 0, updated = 0, fail = 0;
    for (const row of preview) {
      const existingId = map[row.name?.trim().toLowerCase()];
      try {
        if (existingId) { if (syncMode === 'add') continue; await api.put(`/establishments/${est._id}/products/${existingId}`, row); updated++; }
        else { if (syncMode === 'update') continue; await api.post(`/establishments/${est._id}/products`, row); added++; }
      } catch { fail++; }
    }
    setSyncing(false);
    const parts = [];
    if (added) parts.push(`${added} adicionado${added !== 1 ? 's' : ''}`);
    if (updated) parts.push(`${updated} atualizado${updated !== 1 ? 's' : ''}`);
    if (fail) parts.push(`${fail} erro${fail !== 1 ? 's' : ''}`);
    toast.success(parts.join(' · ') || 'Nenhuma alteração');
    onImported(); onClose();
  };

  const connectedKeys = new Set(connected.map(c => c.key));
  const available = INTEGRATIONS_CATALOG.filter(i => !connectedKeys.has(i.key));
  const categories = [...new Set(available.map(i => i.category))];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box integrations-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Sincronizar Produtos</h3>
            <p className="modal-subtitle">Conecte sistemas externos para sincronizar produtos</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {loading ? <div className="dash-loading"><div className="spinner spinner-dark" /></div> : (

          /* ── Connect form ── */
          connectingTo ? (
            <div className="int-modal-body">
              <button className="int-back-btn" onClick={() => { setConnectingTo(null); setConnectForm({}); }}>
                <ChevronLeft size={14} /> Voltar
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>{connectingTo.logo}</span>
                <strong style={{ fontSize: 16 }}>{connectingTo.name}</strong>
              </div>
              {connectingTo.fields.map(field => (
                <div key={field.key} className="form-group">
                  <label className="form-label">{field.label}</label>
                  {field.type === 'select' ? (
                    <select className="form-input" value={connectForm[field.key] || field.options[0]} onChange={e => setConnectForm(f => ({ ...f, [field.key]: e.target.value }))}>
                      {field.options.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                    </select>
                  ) : (
                    <input className="form-input" type={field.type} placeholder={field.placeholder} value={connectForm[field.key] || ''} onChange={e => setConnectForm(f => ({ ...f, [field.key]: e.target.value }))} autoComplete="off" />
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button className="btn btn-secondary" onClick={() => { setConnectingTo(null); setConnectForm({}); }}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleConnect} disabled={saving}>
                  {saving ? <><div className="spinner" /> Salvando...</> : <><Check size={14} /> Conectar</>}
                </button>
              </div>
            </div>

          /* ── Sync view ── */
          ) : syncingWith ? (
            <div className="int-modal-body">
              <button className="int-back-btn" onClick={() => { setSyncingWith(null); setPreview(null); }}>
                <ChevronLeft size={14} /> Voltar
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>{INTEGRATIONS_CATALOG.find(i => i.key === syncingWith.key)?.logo}</span>
                <strong style={{ fontSize: 16 }}>Sincronizar {INTEGRATIONS_CATALOG.find(i => i.key === syncingWith.key)?.name}</strong>
              </div>
              <div className="form-group">
                <label className="form-label">Modo</label>
                <div className="import-mode-selector" style={{ width: 'fit-content' }}>
                  {[{ value: 'add', label: 'Só adicionar' }, { value: 'update', label: 'Só atualizar' }, { value: 'both', label: 'Ambos' }].map(opt => (
                    <button key={opt.value} className={`import-mode-btn${syncMode === opt.value ? ' active' : ''}`} onClick={() => setSyncMode(opt.value)}>{opt.label}</button>
                  ))}
                </div>
              </div>
              {!preview ? (
                <button className="btn btn-secondary" onClick={fetchPreview} disabled={syncing}>
                  {syncing ? <><div className="spinner" /> Buscando...</> : <><RefreshCw size={14} /> Buscar produtos</>}
                </button>
              ) : (
                <>
                  <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>⚡ {preview.length} produto{preview.length !== 1 ? 's' : ''} encontrado{preview.length !== 1 ? 's' : ''}</p>
                  <div className="csv-table-wrap" style={{ maxHeight: 200 }}>
                    <table className="csv-table">
                      <thead><tr><th>Nome</th><th>Preço</th><th>Categoria</th></tr></thead>
                      <tbody>{preview.slice(0, 50).map((p, i) => <tr key={i}><td>{p.name}</td><td>{p.price != null ? `R$ ${Number(p.price).toFixed(2)}` : '—'}</td><td>{p.category || '—'}</td></tr>)}</tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    <button className="btn btn-secondary" onClick={() => { setSyncingWith(null); setPreview(null); }}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleSync} disabled={syncing || !est}>
                      {syncing ? <><div className="spinner" /> Importando...</> : <><Check size={14} /> Confirmar</>}
                    </button>
                  </div>
                </>
              )}
            </div>

          /* ── Main list ── */
          ) : (
            <div className="int-modal-body">
              {connected.length > 0 && (
                <div className="int-modal-section">
                  <p className="int-modal-section-title">Conectadas</p>
                  {connected.map(conn => {
                    const cat = INTEGRATIONS_CATALOG.find(i => i.key === conn.key);
                    if (!cat) return null;
                    return (
                      <div key={conn._id} className="int-modal-row int-modal-row--connected">
                        <span className="int-modal-logo">{cat.logo}</span>
                        <div className="int-modal-info">
                          <span className="int-modal-name">{cat.name}</span>
                          <span className="int-modal-status"><span className="int-status-dot" /> Conectado</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setSyncingWith(conn); setPreview(null); }}>
                            <RefreshCw size={12} /> Sincronizar
                          </button>
                          <button className="btn btn-ghost btn-sm est-delete-btn" onClick={() => handleDisconnect(conn._id, cat.name)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {categories.map(cat => (
                <div key={cat} className="int-modal-section">
                  <p className="int-modal-section-title">{cat}</p>
                  {available.filter(i => i.category === cat).map(intg => (
                    <div key={intg.key} className="int-modal-row">
                      <span className="int-modal-logo">{intg.logo}</span>
                      <div className="int-modal-info">
                        <span className="int-modal-name">{intg.name}</span>
                        <span className="int-modal-desc">{intg.description}</span>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => { setConnectingTo(intg); setConnectForm({}); }}>
                        <Plus size={12} /> Conectar
                      </button>
                    </div>
                  ))}
                </div>
              ))}

            </div>
          )
        )}
      </div>
    </div>
  );
}

function ProductsTab({ establishments, selectedEst, setSelectedEst, products, onRefresh, showForm, setShowForm, editingProduct, setEditingProduct }) {
  const [csvPreview, setCsvPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState('add');
  const [selected, setSelected] = useState(new Set());
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);

  const allSelected = products.length > 0 && selected.size === products.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(products.map(p => p._id)));
  const toggleOne = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

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

  const handleImport = async () => {
    if (!csvPreview?.rows?.length || !selectedEst) return;
    setImporting(true);
    // build a name→id map from existing products for update matching
    const existingMap = {};
    products.forEach(p => { existingMap[p.name.trim().toLowerCase()] = p._id; });

    let added = 0, updated = 0, skipped = 0, fail = 0;
    for (const row of csvPreview.rows) {
      const existingId = existingMap[row.name.trim().toLowerCase()];
      try {
        if (existingId) {
          if (importMode === 'add') { skipped++; continue; }
          await api.put(`/establishments/${selectedEst._id}/products/${existingId}`, row);
          updated++;
        } else {
          if (importMode === 'update') { skipped++; continue; }
          await api.post(`/establishments/${selectedEst._id}/products`, row);
          added++;
        }
      } catch {
        fail++;
      }
    }
    setImporting(false);
    setCsvPreview(null);
    const parts = [];
    if (added) parts.push(`${added} adicionado${added !== 1 ? 's' : ''}`);
    if (updated) parts.push(`${updated} atualizado${updated !== 1 ? 's' : ''}`);
    if (skipped) parts.push(`${skipped} ignorado${skipped !== 1 ? 's' : ''}`);
    if (fail) parts.push(`${fail} erro${fail !== 1 ? 's' : ''}`);
    toast.success(parts.join(' · ') || 'Nenhuma alteração');
    onRefresh();
  };

  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2>Produtos</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowIntegrationsModal(true)}>
            <Plug size={15} /> Sincronizar
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowImportModal(true)} disabled={!selectedEst}>
            <Upload size={15} /> Importar
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setEditingProduct(null); setShowForm(true); }}
            disabled={!selectedEst}
          >
            <Plus size={16} /> Novo Produto
          </button>
        </div>
      </div>

      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} onParsed={setCsvPreview} />}
      {showIntegrationsModal && <IntegrationsModal est={selectedEst} onClose={() => setShowIntegrationsModal(false)} onImported={onRefresh} />}

      {/* Import Preview */}
      {csvPreview && (
        <div className="csv-preview">
          <div className="csv-preview-header">
            <div>
              <p className="csv-preview-title">
                <FileText size={16} /> Preview — {csvPreview.rows.length} produto{csvPreview.rows.length !== 1 ? 's' : ''}
              </p>
              {csvPreview.errors.length > 0 && (
                <div className="csv-errors">
                  {csvPreview.errors.map((e, i) => (
                    <p key={i} className="csv-error-line"><AlertCircle size={12} /> {e}</p>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div className="import-mode-selector">
                {[
                  { value: 'add', label: 'Só adicionar' },
                  { value: 'update', label: 'Só atualizar' },
                  { value: 'both', label: 'Adicionar e atualizar' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`import-mode-btn${importMode === opt.value ? ' active' : ''}`}
                    onClick={() => setImportMode(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setCsvPreview(null)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={handleImport} disabled={importing || !csvPreview.rows.length}>
                {importing ? <><div className="spinner" /> Importando...</> : <><Check size={15} /> Confirmar</>}
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
          <p>Adicione manualmente ou importe via CSV, Excel, JSON ou XML.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}><Upload size={16} /> Importar</button>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Adicionar Produto</button>
          </div>
        </div>
      ) : (
        <div className="products-list">
          <div className="products-list-header">
            <label className="bulk-checkbox-label">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              <span>{allSelected ? 'Desmarcar todos' : 'Selecionar todos'}</span>
            </label>
          </div>
          {selected.size > 0 && (
            <BulkActionsBar
              selected={selected}
              products={products}
              selectedEst={selectedEst}
              onClearSelection={() => setSelected(new Set())}
              onRefresh={onRefresh}
            />
          )}
          {products.map(p => (
            <div key={p._id} className={`product-list-item${selected.has(p._id) ? ' selected' : ''}`} onClick={() => toggleOne(p._id)}>
              <input
                type="checkbox"
                className="bulk-checkbox"
                checked={selected.has(p._id)}
                onChange={() => toggleOne(p._id)}
                onClick={e => e.stopPropagation()}
              />
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
              {p.isActive === false && <span className="product-inactive-badge">Inativo</span>}
              <div className="product-list-actions" onClick={e => e.stopPropagation()}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2>Horários de Funcionamento</h2>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2>Serviços</h2>
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

