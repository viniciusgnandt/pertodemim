const router = require('express').Router({ mergeParams: true });
const Service = require('../models/Service');
const Establishment = require('../models/Establishment');
const { protect, requireOwner } = require('../middleware/auth');

// GET /api/establishments/:id/services
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ establishmentId: req.params.id, isActive: true }).sort({ createdAt: -1 });
    res.json({ services });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/establishments/:id/services
router.post('/', protect, requireOwner, async (req, res) => {
  try {
    const establishment = await Establishment.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!establishment) return res.status(404).json({ error: 'Establishment not found' });

    const { name, description, price, priceType, duration, images } = req.body;
    const service = await Service.create({
      name, description, price, priceType, duration,
      images: images || [],
      establishmentId: req.params.id,
    });
    res.status(201).json({ service });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/establishments/:id/services/:serviceId
router.put('/:serviceId', protect, requireOwner, async (req, res) => {
  try {
    const establishment = await Establishment.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!establishment) return res.status(404).json({ error: 'Establishment not found' });

    const service = await Service.findOneAndUpdate(
      { _id: req.params.serviceId, establishmentId: req.params.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ service });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/establishments/:id/services/:serviceId
router.delete('/:serviceId', protect, requireOwner, async (req, res) => {
  try {
    const establishment = await Establishment.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!establishment) return res.status(404).json({ error: 'Establishment not found' });

    await Service.findOneAndDelete({ _id: req.params.serviceId, establishmentId: req.params.id });
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
