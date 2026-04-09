const router = require('express').Router();
const Product = require('../models/Product');
const Establishment = require('../models/Establishment');

// GET /api/products/search?q=&lat=&lng=
router.get('/search', async (req, res) => {
  try {
    const { q, lat, lng, page = 1, limit = 20 } = req.query;

    if (!q) return res.status(400).json({ error: 'Search query required' });

    // Find matching products
    const productQuery = {
      isActive: true,
      $text: { $search: q },
    };

    const products = await Product.find(productQuery)
      .populate({
        path: 'establishmentId',
        match: { isActive: true },
        select: 'name category address location logo isSponsored',
      })
      .sort({ score: { $meta: 'textScore' } })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    // Filter out products whose establishment is inactive or far away
    let results = products.filter(p => p.establishmentId != null);

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      // Add distance calculation
      results = results.map(p => {
        const est = p.establishmentId;
        if (est && est.location) {
          const [estLng, estLat] = est.location.coordinates;
          const distKm = getDistanceKm(latitude, longitude, estLat, estLng);
          return { ...p, distance: Math.round(distKm * 1000) };
        }
        return p;
      });
      results.sort((a, b) => (a.distance || 99999) - (b.distance || 99999));
    }

    res.json({ products: results, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/featured
router.get('/featured', async (req, res) => {
  try {
    // Get products from sponsored establishments
    const sponsoredEstablishments = await Establishment.find({
      isActive: true,
      isSponsored: true,
      sponsoredUntil: { $gte: new Date() },
    }).select('_id').lean();

    const estIds = sponsoredEstablishments.map(e => e._id);

    const products = await Product.find({
      isActive: true,
      establishmentId: { $in: estIds },
    })
      .populate('establishmentId', 'name category address logo isSponsored')
      .limit(20)
      .lean();

    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = router;
