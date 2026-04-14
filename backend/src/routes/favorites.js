const router = require('express').Router();
const Favorite = require('../models/Favorite');
const Establishment = require('../models/Establishment');
const { protect } = require('../middleware/auth');

// GET /api/favorites - listar favoritos do usuário autenticado
router.get('/', protect, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate({
        path: 'establishmentId',
        select: 'name category address photos isActive rating',
      })
      .sort({ createdAt: -1 })
      .lean();

    const establishments = favorites
      .map(f => f.establishmentId)
      .filter(Boolean);

    res.json({ favorites: establishments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/favorites/:establishmentId - adicionar favorito
router.post('/:establishmentId', protect, async (req, res) => {
  try {
    await Favorite.findOneAndUpdate(
      { userId: req.user._id, establishmentId: req.params.establishmentId },
      {},
      { upsert: true }
    );
    res.status(201).json({ message: 'Adicionado aos favoritos' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/favorites/:establishmentId - remover favorito
router.delete('/:establishmentId', protect, async (req, res) => {
  try {
    await Favorite.findOneAndDelete({ userId: req.user._id, establishmentId: req.params.establishmentId });
    res.json({ message: 'Removido dos favoritos' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/favorites/check/:establishmentId - verificar se é favorito
router.get('/check/:establishmentId', protect, async (req, res) => {
  try {
    const fav = await Favorite.findOne({ userId: req.user._id, establishmentId: req.params.establishmentId });
    res.json({ isFavorite: !!fav });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
