const router = require('express').Router();
const Product = require('../models/Product');
const Establishment = require('../models/Establishment');
const Service = require('../models/Service');

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function withDistance(list, lat, lng, getCoords) {
  if (lat == null || lng == null) return list;
  return list.map(item => {
    const coords = getCoords(item);
    if (!coords) return item;
    const [cLng, cLat] = coords;
    return { ...item, distance: Math.round(getDistanceKm(lat, lng, cLat, cLng) * 1000) };
  }).sort((a, b) => (a.distance ?? 9e9) - (b.distance ?? 9e9));
}

// GET /api/search?q=&lat=&lng=&limit=
router.get('/', async (req, res) => {
  try {
    const { q, lat, lng, limit = 20 } = req.query;
    if (!q || !q.trim()) return res.status(400).json({ error: 'Search query required' });

    const perLimit = parseInt(limit);
    const latitude = lat != null ? parseFloat(lat) : null;
    const longitude = lng != null ? parseFloat(lng) : null;

    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [establishments, products, services] = await Promise.all([
      Establishment.find({
        isActive: true,
        $or: [{ name: regex }, { description: regex }, { category: regex }],
      })
        .select('name category address location logo coverImage isSponsored slug description')
        .limit(perLimit)
        .lean(),

      Product.find({
        isActive: true,
        $or: [{ name: regex }, { description: regex }],
      })
        .populate({
          path: 'establishmentId',
          match: { isActive: true },
          select: 'name category address location logo isSponsored slug',
        })
        .limit(perLimit)
        .lean(),

      Service.find({
        isActive: true,
        $or: [{ name: regex }, { description: regex }],
      })
        .populate({
          path: 'establishmentId',
          match: { isActive: true },
          select: 'name category address location logo isSponsored slug',
        })
        .limit(perLimit)
        .lean(),
    ]);

    const validProducts = products.filter(p => p.establishmentId);
    const validServices = services.filter(s => s.establishmentId);

    const sortedEst = withDistance(establishments, latitude, longitude, e => e.location?.coordinates);
    const sortedProd = withDistance(validProducts, latitude, longitude, p => p.establishmentId?.location?.coordinates);
    const sortedSvc = withDistance(validServices, latitude, longitude, s => s.establishmentId?.location?.coordinates);

    res.json({
      establishments: sortedEst,
      products: sortedProd,
      services: sortedSvc,
      total: sortedEst.length + sortedProd.length + sortedSvc.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
