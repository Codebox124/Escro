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

module.exports = router;
module.exports.maintenanceGuard = maintenanceGuard;
