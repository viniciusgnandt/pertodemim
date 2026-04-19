import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Trash2, X, Check, AlertCircle, Zap, Clock, ChevronRight } from 'lucide-react';
import './Integrations.css';

const INTEGRATIONS_CATALOG = [
  {
    key: 'bling',
    name: 'Bling',
    logo: '🟦',
    description: 'ERP brasileiro muito usado em e-commerces e pequenos negócios.',
    category: 'ERP',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Sua chave de API do Bling' },
    ],
    docsUrl: 'https://developer.bling.com.br',
  },
  {
    key: 'tiny',
    name: 'Tiny ERP',
    logo: '🟩',
    description: 'Sistema de gestão popular para lojas virtuais e físicas.',
    category: 'ERP',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Token de acesso do Tiny' },
    ],
    docsUrl: 'https://tiny.com.br/api-docs',
  },
  {
    key: 'omie',
    name: 'Omie',
    logo: '🟧',
    description: 'ERP em nuvem completo para gestão financeira e de estoque.',
    category: 'ERP',
    fields: [
      { key: 'appKey', label: 'App Key', type: 'text', placeholder: 'App Key do Omie' },
      { key: 'appSecret', label: 'App Secret', type: 'password', placeholder: 'App Secret do Omie' },
    ],
    docsUrl: 'https://developer.omie.com.br',
  },
  {
    key: 'woocommerce',
    name: 'WooCommerce',
    logo: '🟪',
    description: 'Importe produtos diretamente da sua loja WooCommerce.',
    category: 'E-commerce',
    fields: [
      { key: 'url', label: 'URL da loja', type: 'text', placeholder: 'https://minhaloja.com.br' },
      { key: 'consumerKey', label: 'Consumer Key', type: 'text', placeholder: 'ck_...' },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', placeholder: 'cs_...' },
    ],
    docsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs',
  },
  {
    key: 'shopify',
    name: 'Shopify',
    logo: '🟫',
    description: 'Sincronize o catálogo da sua loja Shopify.',
    category: 'E-commerce',
    fields: [
      { key: 'shopDomain', label: 'Domínio da loja', type: 'text', placeholder: 'minha-loja.myshopify.com' },
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'shpat_...' },
    ],
    docsUrl: 'https://shopify.dev/docs/api',
  },
  {
    key: 'mercadolivre',
    name: 'Mercado Livre',
    logo: '🟡',
    description: 'Importe seu catálogo de anúncios do Mercado Livre.',
    category: 'Marketplace',
    fields: [
      { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'APP_USR-...' },
      { key: 'sellerId', label: 'Seller ID', type: 'text', placeholder: 'Seu ID de vendedor' },
    ],
    docsUrl: 'https://developers.mercadolivre.com.br',
  },
  {
    key: 'airtable',
    name: 'Airtable',
    logo: '🔵',
    description: 'Banco de dados visual. Conecte uma base com seus produtos.',
    category: 'Planilha',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'pat...' },
      { key: 'baseId', label: 'Base ID', type: 'text', placeholder: 'app...' },
      { key: 'tableId', label: 'Table ID / Nome', type: 'text', placeholder: 'Produtos' },
    ],
    docsUrl: 'https://airtable.com/developers/web/api/introduction',
  },
  {
    key: 'feedurl',
    name: 'Feed URL',
    logo: '🌐',
    description: 'Importe produtos de qualquer URL pública que retorne JSON ou XML.',
    category: 'Genérico',
    fields: [
      { key: 'url', label: 'URL do feed', type: 'text', placeholder: 'https://...' },
      { key: 'format', label: 'Formato', type: 'select', options: ['json', 'xml'], placeholder: 'json' },
    ],
    docsUrl: null,
  },
];

const COMING_SOON = [
  { key: 'nuvemshop', name: 'Nuvemshop', logo: '☁️', category: 'E-commerce' },
  { key: 'vtex', name: 'VTEX', logo: '⚡', category: 'E-commerce' },
  { key: 'totvs', name: 'TOTVS', logo: '🔷', category: 'ERP' },
  { key: 'sap', name: 'SAP', logo: '🔹', category: 'ERP' },
];

// ---- Connect Modal ----
function ConnectModal({ integration, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const missing = integration.fields.filter(f => f.type !== 'select' && !form[f.key]);
    if (missing.length) return toast.error(`Preencha: ${missing.map(f => f.label).join(', ')}`);
    setSaving(true);
    try {
      await api.post('/integrations', { key: integration.key, credentials: form });
      toast.success(`${integration.name} conectado!`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar integração');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box integration-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>{integration.logo}</span>
            <div>
              <h3 className="modal-title">Conectar {integration.name}</h3>
              <p className="modal-subtitle">{integration.description}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="integration-modal-body">
          {integration.fields.map(field => (
            <div key={field.key} className="form-group">
              <label className="form-label">{field.label}</label>
              {field.type === 'select' ? (
                <select
                  className="form-input"
                  value={form[field.key] || field.options[0]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                >
                  {field.options.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                </select>
              ) : (
                <input
                  className="form-input"
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.key] || ''}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  autoComplete="off"
                />
              )}
            </div>
          ))}

          {integration.docsUrl && (
            <p className="integration-docs-hint">
              <AlertCircle size={13} /> Precisa de ajuda?{' '}
              <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer">
                Ver documentação da API →
              </a>
            </p>
          )}
        </div>

        <div className="integration-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><div className="spinner" /> Salvando...</> : <><Check size={15} /> Conectar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Sync Modal ----
function SyncModal({ integration, connected, establishments, onClose }) {
  const [selectedEst, setSelectedEst] = useState(establishments[0]?._id || '');
  const [mode, setMode] = useState('both');
  const [syncing, setSyncing] = useState(false);
  const [preview, setPreview] = useState(null);

  const fetchPreview = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post(`/integrations/${connected._id}/preview`);
      setPreview(data.products || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao buscar produtos');
    } finally {
      setSyncing(false);
    }
  };

  const handleSync = async () => {
    if (!selectedEst || !preview?.length) return;
    setSyncing(true);
    let added = 0, updated = 0, fail = 0;
    const existing = await api.get(`/establishments/${selectedEst}/products`).then(r => r.data.products).catch(() => []);
    const existingMap = {};
    existing.forEach(p => { existingMap[p.name.trim().toLowerCase()] = p._id; });

    for (const row of preview) {
      const existingId = existingMap[row.name?.trim().toLowerCase()];
      try {
        if (existingId) {
          if (mode === 'add') { continue; }
          await api.put(`/establishments/${selectedEst}/products/${existingId}`, row);
          updated++;
        } else {
          if (mode === 'update') { continue; }
          await api.post(`/establishments/${selectedEst}/products`, row);
          added++;
        }
      } catch { fail++; }
    }
    setSyncing(false);
    const parts = [];
    if (added) parts.push(`${added} adicionado${added !== 1 ? 's' : ''}`);
    if (updated) parts.push(`${updated} atualizado${updated !== 1 ? 's' : ''}`);
    if (fail) parts.push(`${fail} erro${fail !== 1 ? 's' : ''}`);
    toast.success(parts.join(' · ') || 'Nenhuma alteração');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box integration-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32 }}>{integration.logo}</span>
            <div>
              <h3 className="modal-title">Sincronizar {integration.name}</h3>
              <p className="modal-subtitle">Busque e importe produtos desta integração.</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="integration-modal-body">
          <div className="form-group">
            <label className="form-label">Estabelecimento destino</label>
            <select className="form-input" value={selectedEst} onChange={e => setSelectedEst(e.target.value)}>
              {establishments.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Modo de importação</label>
            <div className="import-mode-selector" style={{ width: 'fit-content' }}>
              {[
                { value: 'add', label: 'Só adicionar' },
                { value: 'update', label: 'Só atualizar' },
                { value: 'both', label: 'Ambos' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`import-mode-btn${mode === opt.value ? ' active' : ''}`}
                  onClick={() => setMode(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {!preview ? (
            <button className="btn btn-secondary" onClick={fetchPreview} disabled={syncing}>
              {syncing ? <><div className="spinner" /> Buscando...</> : <><RefreshCw size={14} /> Buscar produtos</>}
            </button>
          ) : (
            <div className="sync-preview">
              <p className="sync-preview-title"><Zap size={14} /> {preview.length} produto{preview.length !== 1 ? 's' : ''} encontrado{preview.length !== 1 ? 's' : ''}</p>
              <div className="csv-table-wrap" style={{ maxHeight: 220 }}>
                <table className="csv-table">
                  <thead><tr><th>Nome</th><th>Preço</th><th>Categoria</th></tr></thead>
                  <tbody>
                    {preview.slice(0, 50).map((p, i) => (
                      <tr key={i}>
                        <td>{p.name}</td>
                        <td>{p.price != null ? `R$ ${Number(p.price).toFixed(2)}` : '—'}</td>
                        <td>{p.category || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 50 && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Mostrando 50 de {preview.length}</p>}
            </div>
          )}
        </div>

        <div className="integration-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
          {preview && (
            <button className="btn btn-primary" onClick={handleSync} disabled={syncing || !preview.length || !selectedEst}>
              {syncing ? <><div className="spinner" /> Importando...</> : <><Check size={15} /> Confirmar importação</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function Integrations() {
  const { user } = useAuth();
  const [connected, setConnected] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingTo, setConnectingTo] = useState(null);
  const [syncingWith, setSyncingWith] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [intRes, estRes] = await Promise.all([
        api.get('/integrations'),
        api.get('/establishments', { params: { limit: 50 } }),
      ]);
      setConnected(intRes.data.integrations || []);
      setEstablishments(estRes.data.establishments.filter(e => (e.ownerId?._id || e.ownerId) === user._id));
    } catch {
      toast.error('Erro ao carregar integrações');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (id, name) => {
    if (!confirm(`Desconectar ${name}?`)) return;
    try {
      await api.delete(`/integrations/${id}`);
      toast.success('Integração removida');
      loadData();
    } catch {
      toast.error('Erro ao remover integração');
    }
  };

  const connectedKeys = new Set(connected.map(c => c.key));
  const available = INTEGRATIONS_CATALOG.filter(i => !connectedKeys.has(i.key));
  const categories = [...new Set(available.map(i => i.category))];

  return (
    <div className="integrations-page page-enter">
      <div className="dashboard-header">
        <div className="container dashboard-header-inner">
          <div>
            <h1>Integrações</h1>
            <p>Conecte sistemas externos para sincronizar produtos automaticamente</p>
          </div>
        </div>
      </div>

      <div className="container integrations-body">
        {loading ? (
          <div className="dash-loading"><div className="spinner spinner-dark" /></div>
        ) : (
          <>
            {/* Conectadas */}
            {connected.length > 0 && (
              <section className="int-section">
                <h2 className="int-section-title">Conectadas</h2>
                <div className="int-connected-list">
                  {connected.map(conn => {
                    const catalog = INTEGRATIONS_CATALOG.find(i => i.key === conn.key);
                    if (!catalog) return null;
                    return (
                      <div key={conn._id} className="int-connected-item">
                        <span className="int-connected-logo">{catalog.logo}</span>
                        <div className="int-connected-info">
                          <span className="int-connected-name">{catalog.name}</span>
                          <span className="int-connected-status">
                            <span className="int-status-dot" /> Conectado
                            {conn.lastSync && <> · Último sync: {new Date(conn.lastSync).toLocaleDateString('pt-BR')}</>}
                          </span>
                        </div>
                        <div className="int-connected-actions">
                          <button className="btn btn-secondary btn-sm" onClick={() => setSyncingWith({ integration: catalog, connected: conn })}>
                            <RefreshCw size={13} /> Sincronizar
                          </button>
                          <button className="btn btn-ghost btn-sm est-delete-btn" onClick={() => handleDisconnect(conn._id, catalog.name)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Disponíveis por categoria */}
            {categories.map(cat => (
              <section key={cat} className="int-section">
                <h2 className="int-section-title">{cat}</h2>
                <div className="int-cards-grid">
                  {available.filter(i => i.category === cat).map(intg => (
                    <div key={intg.key} className="int-card">
                      <div className="int-card-logo">{intg.logo}</div>
                      <div className="int-card-info">
                        <span className="int-card-name">{intg.name}</span>
                        <span className="int-card-desc">{intg.description}</span>
                      </div>
                      <button className="btn btn-primary btn-sm int-card-btn" onClick={() => setConnectingTo(intg)}>
                        <Plus size={13} /> Conectar
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Em breve */}
            <section className="int-section">
              <h2 className="int-section-title">Em breve</h2>
              <div className="int-cards-grid">
                {COMING_SOON.map(intg => (
                  <div key={intg.key} className="int-card int-card--soon">
                    <div className="int-card-logo">{intg.logo}</div>
                    <div className="int-card-info">
                      <span className="int-card-name">{intg.name}</span>
                      <span className="int-card-cat">{intg.category}</span>
                    </div>
                    <span className="int-soon-badge"><Clock size={11} /> Em breve</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {connectingTo && (
        <ConnectModal
          integration={connectingTo}
          onClose={() => setConnectingTo(null)}
          onSaved={loadData}
        />
      )}
      {syncingWith && (
        <SyncModal
          integration={syncingWith.integration}
          connected={syncingWith.connected}
          establishments={establishments}
          onClose={() => setSyncingWith(null)}
        />
      )}
    </div>
  );
}
