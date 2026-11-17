// backend/utils/platform.js
// Platform-wide settings (admin → Settings) with a short in-memory cache,
// plus the admin audit log helper.

const { supabaseAdmin } = require('../config/supabase');

const DEFAULTS = {
  maintenance: { enabled: false, message: 'Escro is undergoing scheduled maintenance. Please check back shortly.' },
  announcement: { enabled: false, text: '', tone: 'info' }, // tone: info | success | warning
  ordersPaused: false,
  signupsPaused: false,
  defaultDeliveryFee: 1500, // NGN, used when an order has no shipping fee
  courierMaxActiveJobs: 5,
  commissionRate: 5, // % of the items subtotal Escro keeps when an order is released
};

const CACHE_MS = 15 * 1000;
let cache = { at: 0, value: null, available: true };

const isMissing = (e) => e && (e.code === 'PGRST205' || e.code === '42P01');

function merge(base, patch) {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch || {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object'
      ? { ...base[k], ...v }
      : v;
  }
  return out;
}

/** Current settings merged over defaults. `available` is false until migration 006 is run. */
async function getPlatformSettings({ fresh = false } = {}) {
  if (!fresh && cache.value && Date.now() - cache.at < CACHE_MS) return { settings: cache.value, available: cache.available };
  const { data, error } = await supabaseAdmin.from('platform_settings').select('data, updated_at, updated_by').eq('id', 1).maybeSingle();
  if (error && !isMissing(error)) throw error;
  const available = !error;
  const settings = merge(DEFAULTS, data?.data || {});
  settings.updatedAt = data?.updated_at || null;
  cache = { at: Date.now(), value: settings, available };
  return { settings, available };
}

/** Validate + merge a partial update, persist it, and return the new settings. */
async function updatePlatformSettings(patch, adminId) {
  const { settings: current, available } = await getPlatformSettings({ fresh: true });
  if (!available) {
    const err = new Error('Run backend/database/migrations/006_platform_settings.sql in Supabase first');
    err.status = 409;
    throw err;
  }
  const clean = {};
  if (patch.maintenance !== undefined) {
    clean.maintenance = {
      enabled: !!patch.maintenance.enabled,
      message: String(patch.maintenance.message ?? current.maintenance.message).trim().slice(0, 300) || DEFAULTS.maintenance.message,
    };
  }
  if (patch.announcement !== undefined) {
    const tone = ['info', 'success', 'warning'].includes(patch.announcement.tone) ? patch.announcement.tone : 'info';
    const text = String(patch.announcement.text ?? current.announcement.text).trim().slice(0, 280);
    clean.announcement = { enabled: !!patch.announcement.enabled && !!text, text, tone };
  }
  if (patch.ordersPaused !== undefined) clean.ordersPaused = !!patch.ordersPaused;
  if (patch.signupsPaused !== undefined) clean.signupsPaused = !!patch.signupsPaused;
  if (patch.defaultDeliveryFee !== undefined) {
    const fee = Number(patch.defaultDeliveryFee);
    if (!Number.isFinite(fee) || fee < 0 || fee > 1_000_000) {
      const err = new Error('Default delivery fee must be between 0 and 1,000,000');
      err.status = 400;
      throw err;
    }
    clean.defaultDeliveryFee = Math.round(fee * 100) / 100;
  }
  if (patch.courierMaxActiveJobs !== undefined) {
    const n = parseInt(patch.courierMaxActiveJobs, 10);
    if (!Number.isInteger(n) || n < 1 || n > 50) {
      const err = new Error('Max active jobs per courier must be between 1 and 50');
      err.status = 400;
      throw err;
    }
    clean.courierMaxActiveJobs = n;
  }

  if (patch.commissionRate !== undefined) {
    const rate = Number(patch.commissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 50) {
      const err = new Error('Commission must be between 0% and 50%');
      err.status = 400;
      throw err;
    }
    clean.commissionRate = Math.round(rate * 100) / 100;
  }

  const { updatedAt, ...stored } = merge(current, clean);
  const { error } = await supabaseAdmin
    .from('platform_settings')
    .upsert({ id: 1, data: stored, updated_by: adminId || null, updated_at: new Date().toISOString() });
  if (error) throw error;
  cache = { at: 0, value: null, available: true };
  const result = await getPlatformSettings({ fresh: true });
  return { settings: result.settings, changed: clean };
}

/** Record an admin action. Never throws (logging must not break the action). */
async function logAudit(adminId, action, targetType, targetId, details) {
  try {
    const { error } = await supabaseAdmin.from('admin_audit_log').insert([
      { admin_id: adminId || null, action, target_type: targetType || null, target_id: targetId ? String(targetId) : null, details: details || null },
    ]);
    if (error && !isMissing(error)) console.error('audit log failed', error);
  } catch (e) {
    console.error('audit log failed', e);
  }
}

module.exports = { DEFAULTS, getPlatformSettings, updatePlatformSettings, logAudit };
