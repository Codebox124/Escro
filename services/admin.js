// services/admin.js
// Platform admin API (/api/admin). Admin login required. Errors throw { message }.
import api from './api';

const unwrap = async (promise) => {
  try {
    const response = await promise;
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const adminApi = {
  /**
   * → {
   *   users:   { total, byRole:{customer,seller,courier,agency,admin}, newThisWeek, change(%), inactive },
   *   stores:  { total, verified }, products: { total, active },
   *   orders:  { total, thisWeek, change(%), byStatus:{pending:n, ...} },
   *   money:   { gmv, completedValue, escrowHeld, escrowDisputed, released, refunded },   // NGN
   *   disputes:{ open, total }, couriers: { total, online },
   *   chart:   [{ label:'Jun', gmv, orders }]  (last 6 months),
   *   recentUsers:  [{ id, name, email, role, createdAt }],
   *   recentOrders: [{ id, orderNumber, status, total, store, createdAt }] }
   */
  overview: () => unwrap(api.get('/admin/overview')),

  /** params: { search, role, status: active|inactive|verified|unverified }
   *  → { users: [{ id, name, email, phone, role, avatar, isActive, isVerified, orders, spent, store, createdAt, updatedAt }],
   *      counts: { customer, seller, courier, agency, admin } } */
  users: (params = {}) => unwrap(api.get('/admin/users', { params })),
  /** { isActive?, isVerified?, role? } → user. Admins can't deactivate/demote themselves. */
  updateUser: (id, data) => unwrap(api.patch(`/admin/users/${id}`, data)),

  /** status: open | resolved | rejected
   *  → { disputes: [{ id, reason, details, status, resolution, createdAt, resolvedAt,
   *       order:{ id, orderNumber, status, total, createdAt }, store:{ id, name }|null,
   *       customer:{ id, name, email, phone }|null, escrow:{ status, amount }|null }] }
   *  reason: not_received | not_as_described | damaged | wrong_item | other */
  disputes: (params = {}) => unwrap(api.get('/admin/disputes', { params })),
  /** action: refund (buyer wins) | release (seller wins) | reject (dismiss; escrow back to held).
   *  resolution: note, min 5 chars → dispute */
  resolveDispute: (id, action, resolution) => unwrap(api.patch(`/admin/disputes/${id}`, { action, resolution })),

  /** days (1–365, default 30)
   *  → { days, totals:{ volume, held, disputed, released, refunded, courierEarnings, transactions },
   *      chart:[{ date, label, volume }], transactions:[{ id, status:'held'|'released'|'refunded'|'disputed', amount,
   *      orderId, orderNumber, orderStatus, store, customer:{name,email}|null, createdAt, heldAt, releasedAt, refundedAt }],
   *      testMode:true } */
  finance: (days = 30) => unwrap(api.get('/admin/finance', { params: { days } })),

  /** → { orders: [{ id, orderNumber, status, total, store, escrow, createdAt }] } */
  orders: (params = {}) => unwrap(api.get('/admin/orders', { params })),
};

/**
 * Platform settings (admin → Settings).
 * Settings: { maintenance:{enabled,message}, announcement:{enabled,text,tone:'info'|'success'|'warning'},
 *   ordersPaused, signupsPaused, defaultDeliveryFee (NGN), courierMaxActiveJobs, updatedAt }
 * Enforced by the backend: maintenance blocks all non-admin writes (503); ordersPaused blocks checkout;
 * signupsPaused blocks registration; defaultDeliveryFee is used for courier jobs on orders without a
 * shipping fee; courierMaxActiveJobs caps how many jobs a courier can hold.
 * `available` is false until backend/database/migrations/006_platform_settings.sql is run.
 */
export const adminSettingsApi = {
  /** → { settings, available } */
  get: () => unwrap(api.get('/admin/settings')),
  /** partial update → { settings, available } */
  update: (patch) => unwrap(api.put('/admin/settings', patch)),
  /** → { database:{ok,latencyMs,error}, api:{uptimeSeconds,node,environment}, payments:{mode,stripeConfigured},
   *      settingsAvailable, flags:{maintenance,ordersPaused,signupsPaused},
   *      checks:[{ key, label, value|null, status:'ok'|'warning'|'unknown', hint }], checkedAt } */
  health: () => unwrap(api.get('/admin/health')),
  /** → { available, entries:[{ id, action, targetType, targetId, details, admin:{name,email}|null, createdAt }] }
   *  action: user.update | dispute.resolve | settings.update */
  audit: (limit = 50) => unwrap(api.get('/admin/audit', { params: { limit } })),
};

/** Public: { maintenance:{enabled,message}, announcement:{enabled,text,tone}, ordersPaused, signupsPaused } | null */
export const platformApi = {
  status: () => unwrap(api.get('/platform/status')),
};
