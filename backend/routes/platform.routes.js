// backend/routes/platform.routes.js
// Public platform status (announcement banner, maintenance, paused features).
// Mounted at /api/platform.

const express = require('express');
const { getPlatformSettings } = require('../utils/platform');

const router = express.Router();

/** Express middleware: during maintenance, reject writes except auth + admin routes. */
async function maintenanceGuard(req, res, next) {
  try {
    if (req.method === 'GET' || req.method === 'OPTIONS' || req.method === 'HEAD') return next();
    if (/^\/api\/(auth|admin)(\/|$)/.test(req.path)) return next();
    const { settings } = await getPlatformSettings();
    if (settings.maintenance.enabled) {
      return res.status(503).json({ status: 'error', message: settings.maintenance.message, maintenance: true });
    }
    next();
  } catch {
    next(); // never block the platform because settings couldn't be read
  }
}

/** GET /api/platform/status */
router.get('/status', async (req, res) => {
  try {
    const { settings } = await getPlatformSettings();
    res.status(200).json({
      status: 'success',
      data: {
        maintenance: settings.maintenance,
        announcement: settings.announcement,
        ordersPaused: settings.ordersPaused,
        signupsPaused: settings.signupsPaused,
      },
    });
  } catch (error) {
    res.status(200).json({ status: 'success', data: null });
  }
});

// Real platform counts for the landing page. Cached briefly so the public
// page can't hammer the database.
const { supabaseAdmin } = require('../config/supabase');
let statsCache = { at: 0, data: null };
const STATS_TTL_MS = 5 * 60 * 1000;

async function countRows(table, filter = (q) => q) {
  const { count, error } = await filter(supabaseAdmin.from(table).select('id', { count: 'exact', head: true }));
  return error ? 0 : count || 0;
}

/** GET /api/platform/stats */
router.get('/stats', async (req, res) => {
  try {
    if (!statsCache.data || Date.now() - statsCache.at > STATS_TTL_MS) {
      const [users, stores, products, orders, completedOrders, couriers, deliveries, agencies, services] = await Promise.all([
        countRows('users', (q) => q.eq('is_active', true)),
        countRows('stores', (q) => q.eq('is_active', true)),
        countRows('products', (q) => q.eq('is_active', true)),
        countRows('orders', (q) => q.not('status', 'in', '(cancelled,refunded)')),
        countRows('orders', (q) => q.eq('status', 'completed')),
        countRows('users', (q) => q.eq('role', 'courier').eq('is_active', true)),
        countRows('deliveries', (q) => q.eq('status', 'delivered')),
        countRows('agencies', (q) => q.eq('is_active', true)),
        countRows('services', (q) => q.eq('is_active', true)),
      ]);
      statsCache = {
        at: Date.now(),
        data: { users, stores, products, orders, completedOrders, couriers, deliveries, agencies, services },
      };
    }
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).json({ status: 'success', data: statsCache.data });
  } catch (error) {
    res.status(200).json({ status: 'success', data: null });
  }
});

module.exports = router;
module.exports.maintenanceGuard = maintenanceGuard;
