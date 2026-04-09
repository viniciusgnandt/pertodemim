const router = require('express').Router();
const mongoose = require('mongoose');
const Boost = require('../models/Boost');
const Establishment = require('../models/Establishment');
const { protect, requireOwner } = require('../middleware/auth');

const BOOST_PACKAGES = [
  { id: '7days', label: '7 dias', durationDays: 7, amount: 2990, amountBRL: 'R$ 29,90' },
  { id: '15days', label: '15 dias', durationDays: 15, amount: 4990, amountBRL: 'R$ 49,90' },
  { id: '30days', label: '30 dias', durationDays: 30, amount: 8990, amountBRL: 'R$ 89,90' },
];

// GET /api/boosts/packages
router.get('/packages', (req, res) => {
  res.json({ packages: BOOST_PACKAGES });
});

// POST /api/boosts/create-checkout
router.post('/create-checkout', protect, requireOwner, async (req, res) => {
  try {
    const { establishmentId, packageId } = req.body;

    const pkg = BOOST_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return res.status(400).json({ error: 'Invalid package' });

    const establishment = await Establishment.findOne({
      _id: establishmentId,
      ownerId: req.user._id,
    });
    if (!establishment) return res.status(404).json({ error: 'Establishment not found' });

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey === 'sk_test_placeholder') {
      // Dev mode: simulate successful payment
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const startDate = new Date();
          const endDate = new Date(startDate.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);

          const boost = await Boost.create([{
            establishmentId,
            amount: pkg.amount,
            durationDays: pkg.durationDays,
            status: 'active',
            startDate,
            endDate,
          }], { session });

          await Establishment.findByIdAndUpdate(
            establishmentId,
            {
              isSponsored: true,
              sponsoredUntil: endDate,
              sponsoredBoostId: boost[0]._id,
            },
            { session }
          );
        });
      } finally {
        await session.endSession();
      }

      return res.json({
        devMode: true,
        message: 'Dev mode: boost activated immediately',
        redirectUrl: `${process.env.STRIPE_SUCCESS_URL || 'http://localhost:5173/dashboard?boost=success'}`,
      });
    }

    const stripe = require('stripe')(stripeKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: `Destaque ${pkg.label} - ${establishment.name}`,
            description: `Seu estabelecimento aparece primeiro nas buscas por ${pkg.durationDays} dias`,
          },
          unit_amount: pkg.amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      metadata: {
        establishmentId: establishmentId.toString(),
        packageId,
        durationDays: pkg.durationDays.toString(),
      },
    });

    // Create pending boost
    await Boost.create({
      establishmentId,
      stripeSessionId: session.id,
      amount: pkg.amount,
      durationDays: pkg.durationDays,
      status: 'pending',
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/boosts/webhook - Stripe webhook
router.post('/webhook', async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey === 'sk_test_placeholder') {
    return res.json({ received: true });
  }

  const stripe = require('stripe')(stripeKey);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { establishmentId, durationDays } = session.metadata;

    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        const boost = await Boost.findOneAndUpdate(
          { stripeSessionId: session.id },
          {
            stripePaymentIntentId: session.payment_intent,
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + parseInt(durationDays) * 24 * 60 * 60 * 1000),
          },
          { new: true, session: mongoSession }
        );

        if (boost) {
          await Establishment.findByIdAndUpdate(
            establishmentId,
            {
              isSponsored: true,
              sponsoredUntil: boost.endDate,
              sponsoredBoostId: boost._id,
            },
            { session: mongoSession }
          );
        }
      });
    } finally {
      await mongoSession.endSession();
    }
  }

  res.json({ received: true });
});

// GET /api/boosts/my - owner's boosts
router.get('/my', protect, requireOwner, async (req, res) => {
  try {
    const establishments = await Establishment.find({ ownerId: req.user._id }).select('_id name');
    const estIds = establishments.map(e => e._id);
    const boosts = await Boost.find({ establishmentId: { $in: estIds } })
      .populate('establishmentId', 'name')
      .sort({ createdAt: -1 });
    res.json({ boosts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
