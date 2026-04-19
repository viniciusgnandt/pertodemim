const router = require('express').Router();
const Integration = require('../models/Integration');
const { protect } = require('../middleware/auth');

// GET /api/integrations
router.get('/', protect, async (req, res) => {
  try {
    const integrations = await Integration.find({ ownerId: req.user._id }).select('-credentials');
    res.json({ integrations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/integrations
router.post('/', protect, async (req, res) => {
  try {
    const { key, credentials } = req.body;
    if (!key || !credentials) return res.status(400).json({ error: 'key e credentials são obrigatórios' });
    const integration = await Integration.findOneAndUpdate(
      { ownerId: req.user._id, key },
      { credentials, ownerId: req.user._id, key },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json({ integration: { ...integration.toObject(), credentials: undefined } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/integrations/:id/preview — fetch products from external system
router.post('/:id/preview', protect, async (req, res) => {
  try {
    const integration = await Integration.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!integration) return res.status(404).json({ error: 'Integração não encontrada' });

    const products = await fetchProducts(integration);
    await Integration.findByIdAndUpdate(integration._id, { lastSync: new Date() });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/integrations/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    await Integration.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
    res.json({ message: 'Integração removida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function fetchProducts(integration) {
  const { key, credentials } = integration;

  if (key === 'bling') {
    const res = await fetch('https://www.bling.com.br/Api/v3/produtos?pagina=1&limite=100', {
      headers: { Authorization: `Bearer ${credentials.apiKey}` },
    });
    if (!res.ok) throw new Error(`Bling retornou ${res.status}`);
    const data = await res.json();
    return (data.data || []).map(p => ({
      name: p.nome,
      price: parseFloat(p.preco) || 0,
      category: p.tipo || '',
      description: p.descricaoCurta || '',
    }));
  }

  if (key === 'tiny') {
    const res = await fetch(`https://api.tiny.com.br/api2/produtos.pesquisa.php?token=${credentials.apiKey}&formato=json`);
    if (!res.ok) throw new Error(`Tiny retornou ${res.status}`);
    const data = await res.json();
    const items = data.retorno?.produtos || [];
    return items.map(p => ({
      name: p.produto?.nome || '',
      price: parseFloat(p.produto?.preco) || 0,
      category: p.produto?.unidade || '',
      description: '',
    }));
  }

  if (key === 'woocommerce') {
    const auth = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
    const res = await fetch(`${credentials.url}/wp-json/wc/v3/products?per_page=100`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) throw new Error(`WooCommerce retornou ${res.status}`);
    const data = await res.json();
    return data.map(p => ({
      name: p.name,
      price: parseFloat(p.regular_price || p.price) || 0,
      category: p.categories?.[0]?.name || '',
      description: p.short_description?.replace(/<[^>]+>/g, '') || '',
    }));
  }

  if (key === 'shopify') {
    const res = await fetch(`https://${credentials.shopDomain}/admin/api/2024-01/products.json?limit=100`, {
      headers: { 'X-Shopify-Access-Token': credentials.accessToken },
    });
    if (!res.ok) throw new Error(`Shopify retornou ${res.status}`);
    const data = await res.json();
    return (data.products || []).map(p => ({
      name: p.title,
      price: parseFloat(p.variants?.[0]?.price) || 0,
      category: p.product_type || '',
      description: p.body_html?.replace(/<[^>]+>/g, '') || '',
    }));
  }

  if (key === 'mercadolivre') {
    const res = await fetch(`https://api.mercadolibre.com/users/${credentials.sellerId}/items/search?limit=100`, {
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
    });
    if (!res.ok) throw new Error(`Mercado Livre retornou ${res.status}`);
    const data = await res.json();
    const ids = (data.results || []).slice(0, 50).join(',');
    if (!ids) return [];
    const itemsRes = await fetch(`https://api.mercadolibre.com/items?ids=${ids}`, {
      headers: { Authorization: `Bearer ${credentials.accessToken}` },
    });
    const items = await itemsRes.json();
    return items.map(i => ({
      name: i.body?.title || '',
      price: i.body?.price || 0,
      category: i.body?.category_id || '',
      description: '',
    }));
  }

  if (key === 'airtable') {
    const res = await fetch(`https://api.airtable.com/v0/${credentials.baseId}/${encodeURIComponent(credentials.tableId)}?maxRecords=200`, {
      headers: { Authorization: `Bearer ${credentials.apiKey}` },
    });
    if (!res.ok) throw new Error(`Airtable retornou ${res.status}`);
    const data = await res.json();
    return (data.records || []).map(r => ({
      name: r.fields.nome || r.fields.name || r.fields.Nome || '',
      price: parseFloat(r.fields.preco || r.fields.price || r.fields.Preco || 0),
      category: r.fields.categoria || r.fields.category || '',
      description: r.fields.descricao || r.fields.description || '',
    })).filter(p => p.name);
  }

  if (key === 'feedurl') {
    const res = await fetch(credentials.url);
    if (!res.ok) throw new Error(`Feed retornou ${res.status}`);
    const text = await res.text();
    if (credentials.format === 'xml') {
      // basic XML parse on backend
      const matches = [...text.matchAll(/<produto>([\s\S]*?)<\/produto>/gi)];
      const txt = (block, tag) => block.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'))?.[1]?.trim() || '';
      return matches.map(m => ({
        name: txt(m[1], 'nome') || txt(m[1], 'name'),
        price: parseFloat(txt(m[1], 'preco') || txt(m[1], 'price')) || 0,
        category: txt(m[1], 'categoria') || txt(m[1], 'category'),
        description: txt(m[1], 'descricao') || txt(m[1], 'description'),
      })).filter(p => p.name);
    }
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : data.produtos || data.products || [];
    return arr.map(p => ({
      name: p.nome || p.name || '',
      price: parseFloat(p.preco ?? p.price ?? 0),
      category: p.categoria || p.category || '',
      description: p.descricao || p.description || '',
    })).filter(p => p.name);
  }

  throw new Error(`Integração "${key}" ainda não suportada para sincronização`);
}

module.exports = router;
