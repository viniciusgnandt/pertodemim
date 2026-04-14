const router = require('express').Router();
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');

// GET /api/reviews/:establishmentId - listar avaliações de um estabelecimento
router.get('/:establishmentId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const reviews = await Review.find({ establishmentId: req.params.establishmentId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const total = await Review.countDocuments({ establishmentId: req.params.establishmentId });
    const avgRating = total > 0
      ? await Review.aggregate([
          { $match: { establishmentId: require('mongoose').Types.ObjectId.createFromHexString(req.params.establishmentId) } },
          { $group: { _id: null, avg: { $avg: '$rating' } } },
        ]).then(r => r[0]?.avg || 0)
      : 0;

    res.json({ reviews, total, avgRating: Math.round(avgRating * 10) / 10, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews/:establishmentId - criar ou atualizar avaliação
router.post('/:establishmentId', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating deve ser entre 1 e 5' });
    }

    const review = await Review.findOneAndUpdate(
      { establishmentId: req.params.establishmentId, userId: req.user._id },
      { rating, comment },
      { upsert: true, new: true, runValidators: true }
    ).populate('userId', 'name avatar');

    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reviews/:establishmentId - remover avaliação do usuário
router.delete('/:establishmentId', protect, async (req, res) => {
  try {
    await Review.findOneAndDelete({ establishmentId: req.params.establishmentId, userId: req.user._id });
    res.json({ message: 'Avaliação removida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
