// backend/routes/wallet.routes.js
// Earnings wallet for stores, couriers (and anyone else credited by the ledger).
// Mounted at /api/wallet. Login required.

const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { getWallet } = require('../utils/wallet');
const { getPlatformSettings } = require('../utils/platform');

const router = express.Router();
router.use(protect);

/** GET /api/wallet → { available, balance, totalEarned, totalPaidOut, commissionRate, transactions[] } */
router.get('/', async (req, res) => {
  try {
    const wallet = await getWallet(req.user.id);
    let commissionRate = 5;
    try {
      commissionRate = Number((await getPlatformSettings()).settings.commissionRate) || 0;
    } catch { /* default */ }
    res.status(200).json({ status: 'success', data: { ...wallet, commissionRate, payoutsEnabled: false } });
  } catch (error) {
    console.error('Failed to load wallet', error);
    res.status(500).json({ status: 'error', message: error?.message || 'Failed to load wallet' });
  }
});

module.exports = router;
