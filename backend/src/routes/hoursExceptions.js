const router = require('express').Router({ mergeParams: true });
const HoursException = require('../models/HoursException');
const Establishment = require('../models/Establishment');
const { protect, requireOwner } = require('../middleware/auth');

// GET /api/establishments/:id/hours-exceptions
router.get('/', async (req, res) => {
  try {
    const exceptions = await HoursException.find({ establishmentId: req.params.id })
      .sort({ date: 1 });
    res.json({ exceptions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/establishments/:id/hours-exceptions
router.post('/', protect, requireOwner, async (req, res) => {
  try {
    const establishment = await Establishment.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!establishment) return res.status(404).json({ error: 'Establishment not found' });

    const { date, closed, open, close, reason } = req.body;
    const exception = await HoursException.findOneAndUpdate(
      { establishmentId: req.params.id, date },
      { closed, open, close, reason, establishmentId: req.params.id, date },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json({ exception });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/establishments/:id/hours-exceptions/:exceptionId
router.delete('/:exceptionId', protect, requireOwner, async (req, res) => {
  try {
    const establishment = await Establishment.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!establishment) return res.status(404).json({ error: 'Establishment not found' });

    await HoursException.findOneAndDelete({ _id: req.params.exceptionId, establishmentId: req.params.id });
    res.json({ message: 'Exception deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
