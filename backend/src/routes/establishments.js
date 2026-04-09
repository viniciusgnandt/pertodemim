const router = require('express').Router();
const mongoose = require('mongoose');
const Establishment = require('../models/Establishment');
const Product = require('../models/Product');
const { protect, requireOwner } = require('../middleware/auth');

// GET /api/establishments - search nearby
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = 10000, search, category, page = 1, limit = 20 } = req.query;

    let query = {};
    let sortOptions = { isSponsored: -1 };

    if (category) query.category = category;

    if (search) {
      query.$text = { $search: search };
    }

    let establishments;

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      // Use aggregation for geospatial + sorting sponsored first
      const pipeline = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [longitude, latitude] },
            distanceField: 'distance',
            maxDistance: parseInt(radius),
            spherical: true,
            query: { isActive: true, ...query },
          },
        },
        {
          $addFields: {
            sponsoredSort: { $cond: [{ $eq: ['$isSponsored', true] }, 0, 1] },
          },
        },
        { $sort: { sponsoredSort: 1, distance: 1 } },
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) },
      ];

      establishments = await Establishment.aggregate(pipeline);
    } else {
      establishments = await Establishment.find({ isActive: true, ...query })
        .sort({ isSponsored: -1, createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .lean();
    }

    res.json({ establishments, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/establishments/:id
router.get('/:id', async (req, res) => {
  try {
    const establishment = await Establishment.findById(req.params.id)
      .populate('ownerId', 'name email');
    if (!establishment) return res.status(404).json({ error: 'Establishment not found' });
    res.json({ establishment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/establishments - create
router.post('/', protect, requireOwner, async (req, res) => {
  try {
    const { name, description, category, address, location, phone, businessHours } = req.body;

    const establishment = await Establishment.create({
      name,
      description,
      category,
      address,
      location,
      phone,
      businessHours,
      ownerId: req.user._id,
    });

    res.status(201).json({ establishment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/establishments/:id
router.put('/:id', protect, requireOwner, async (req, res) => {
  try {
    const establishment = await Establishment.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });
    if (!establishment) return res.status(404).json({ error: 'Establishment not found' });

    const allowed = ['name', 'description', 'category', 'address', 'location', 'phone', 'logo', 'coverImage', 'businessHours', 'isActive'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) establishment[field] = req.body[field];
    });

    await establishment.save();
    res.json({ establishment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/establishments/:id
router.delete('/:id', protect, requireOwner, async (req, res) => {
  try {
    const establishment = await Establishment.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user._id,
    });
    if (!establishment) return res.status(404).json({ error: 'Establishment not found' });
    await Product.deleteMany({ establishmentId: req.params.id });
    res.json({ message: 'Establishment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/establishments/:id/products
router.get('/:id/products', async (req, res) => {
  try {
    const products = await Product.find({
      establishmentId: req.params.id,
      isActive: true,
    }).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/establishments/:id/products
router.post('/:id/products', protect, requireOwner, async (req, res) => {
  try {
    const establishment = await Establishment.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });
    if (!establishment) return res.status(404).json({ error: 'Establishment not found' });

    const { name, description, price, images, category } = req.body;
    const product = await Product.create({
      name,
      description,
      price,
      images: images || [],
      category,
      establishmentId: req.params.id,
    });

    res.status(201).json({ product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/establishments/:id/products/:productId
router.put('/:id/products/:productId', protect, requireOwner, async (req, res) => {
  try {
    const establishment = await Establishment.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });
    if (!establishment) return res.status(404).json({ error: 'Establishment not found' });

    const product = await Product.findOneAndUpdate(
      { _id: req.params.productId, establishmentId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json({ product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/establishments/:id/products/:productId
router.delete('/:id/products/:productId', protect, requireOwner, async (req, res) => {
  try {
    const establishment = await Establishment.findOne({
      _id: req.params.id,
      ownerId: req.user._id,
    });
    if (!establishment) return res.status(404).json({ error: 'Establishment not found' });

    await Product.findOneAndDelete({
      _id: req.params.productId,
      establishmentId: req.params.id,
    });

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
