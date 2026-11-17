// backend/routes/admin.routes.js
// Platform admin. Mounted at /api/admin. Admin login required.
//   GET   /overview                      platform stats, charts, recent activity
//   GET   /users?search=&role=&status=   all users
//   PATCH /users/:id                     { isActive?, isVerified?, role? }
//   GET   /disputes?status=              buyer disputes with order + escrow
//   PATCH /disputes/:id                  { action: refund | release | reject, resolution }
//   GET   /finance?days=                 escrow money flow + transactions
//   GET   /orders?status=&search=        all orders

const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth.middleware');
const { getPlatformSettings, updatePlatformSettings, logAudit } = require('../utils/platform');
const { settleOrder, getPlatformRevenue } = require('../utils/wallet');

const router = express.Router();
router.use(protect, authorize('admin'));

const ROLES = ['customer', 'seller', 'courier', 'agency', 'admin'];
const bad = (res, message, code = 400) => res.status(code).json({ status: 'error', message });
const fail = (res, error, fallback) => {
  console.error(fallback, error);
  res.status(500).json({ status: 'error', message: error?.message || fallback });
};
const num = (v) => Number(v || 0);
const sum = (rows, key) => rows.reduce((n, r) => n + num(r[key]), 0);
const daysAgo = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};
/** Run a query; if the table doesn't exist yet (optional migration), return []. */
async function rowsOrEmpty(q) {
  const { data, error } = await q;
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return [];
    throw error;
  }
  return data || [];
}

// ============================================================
// OVERVIEW
// ============================================================

router.get('/overview', async (req, res) => {
  try {
    const [users, stores, products, orders, escrow, disputes, couriers, recentOrders] = await Promise.all([
      rowsOrEmpty(supabaseAdmin.from('users').select('id, full_name, email, role, is_active, is_verified, created_at').order('created_at', { ascending: false })),
      rowsOrEmpty(supabaseAdmin.from('stores').select('id, is_active, is_verified')),
      rowsOrEmpty(supabaseAdmin.from('products').select('id, is_active')),
      rowsOrEmpty(supabaseAdmin.from('orders').select('id, status, total, created_at')),
      rowsOrEmpty(supabaseAdmin.from('escrow_transactions').select('status, amount')),
      rowsOrEmpty(supabaseAdmin.from('order_disputes').select('id, status')),
      rowsOrEmpty(supabaseAdmin.from('couriers').select('id, is_available')),
      rowsOrEmpty(
        supabaseAdmin
          .from('orders')
          .select('id, order_number, status, total, created_at, stores ( store_name )')
          .order('created_at', { ascending: false })
          .limit(6)
      ),
    ]);

    const byRole = Object.fromEntries(ROLES.map((r) => [r, users.filter((u) => u.role === r).length]));
    const weekAgo = daysAgo(7);
    const twoWeeksAgo = daysAgo(14);
    const inRange = (rows, from, to) => rows.filter((r) => new Date(r.created_at) >= from && (!to || new Date(r.created_at) < to));
    const pct = (a, b) => (!b ? (a ? 100 : 0) : Math.round(((a - b) / b) * 1000) / 10);

    const completed = orders.filter((o) => ['delivered', 'completed'].includes(o.status));
    const live = orders.filter((o) => !['cancelled', 'refunded'].includes(o.status));

    // Monthly GMV for the last 6 months
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      start.setMonth(start.getMonth() - i);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const rows = live.filter((o) => new Date(o.created_at) >= start && new Date(o.created_at) < end);
      months.push({ label: start.toLocaleDateString('en-US', { month: 'short' }), gmv: sum(rows, 'total'), orders: rows.length });
    }

    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: users.length,
          byRole,
          newThisWeek: inRange(users, weekAgo).length,
          change: pct(inRange(users, weekAgo).length, inRange(users, twoWeeksAgo, weekAgo).length),
          inactive: users.filter((u) => !u.is_active).length,
        },
        stores: { total: stores.length, verified: stores.filter((s) => s.is_verified).length },
        products: { total: products.length, active: products.filter((p) => p.is_active).length },
        orders: {
          total: orders.length,
          thisWeek: inRange(orders, weekAgo).length,
          change: pct(inRange(orders, weekAgo).length, inRange(orders, twoWeeksAgo, weekAgo).length),
          byStatus: orders.reduce((m, o) => ({ ...m, [o.status]: (m[o.status] || 0) + 1 }), {}),
        },
        money: {
          gmv: sum(live, 'total'),
          completedValue: sum(completed, 'total'),
          escrowHeld: sum(escrow.filter((e) => e.status === 'held'), 'amount'),
          escrowDisputed: sum(escrow.filter((e) => e.status === 'disputed'), 'amount'),
          released: sum(escrow.filter((e) => e.status === 'released'), 'amount'),
          refunded: sum(escrow.filter((e) => e.status === 'refunded'), 'amount'),
        },
        disputes: { open: disputes.filter((d) => d.status === 'open').length, total: disputes.length },
        couriers: { total: couriers.length, online: couriers.filter((c) => c.is_available).length },
        chart: months,
        recentUsers: users.slice(0, 6).map((u) => ({
          id: u.id, name: u.full_name, email: u.email, role: u.role, createdAt: u.created_at,
        })),
        recentOrders: recentOrders.map((o) => ({
          id: o.id, orderNumber: o.order_number, status: o.status, total: num(o.total),
          store: o.stores?.store_name || null, createdAt: o.created_at,
        })),
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to load overview');
  }
});

// ============================================================
// USERS
// ============================================================

router.get('/users', async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let q = supabaseAdmin
      .from('users')
      .select('id, full_name, email, phone, role, avatar_url, is_active, is_verified, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (role && ROLES.includes(role)) q = q.eq('role', role);
    if (status === 'active') q = q.eq('is_active', true);
    if (status === 'inactive') q = q.eq('is_active', false);
    if (status === 'verified') q = q.eq('is_verified', true);
    if (status === 'unverified') q = q.eq('is_verified', false);
    if (search) {
      const s = String(search).replace(/[%,()]/g, ' ').trim();
      if (s) q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`);
    }
    const users = await rowsOrEmpty(q);

    // Per-user activity counts
    const ids = users.map((u) => u.id);
    const [orders, stores] = ids.length
      ? await Promise.all([
          rowsOrEmpty(supabaseAdmin.from('orders').select('customer_id, total').in('customer_id', ids)),
          rowsOrEmpty(supabaseAdmin.from('stores').select('seller_id, store_name').in('seller_id', ids)),
        ])
      : [[], []];

    res.status(200).json({
      status: 'success',
      data: {
        users: users.map((u) => {
          const mine = orders.filter((o) => o.customer_id === u.id);
          return {
            id: u.id,
            name: u.full_name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            avatar: u.avatar_url,
            isActive: u.is_active,
            isVerified: u.is_verified,
            orders: mine.length,
            spent: sum(mine, 'total'),
            store: stores.find((s) => s.seller_id === u.id)?.store_name || null,
            createdAt: u.created_at,
            updatedAt: u.updated_at,
          };
        }),
        counts: Object.fromEntries(ROLES.map((r) => [r, users.filter((u) => u.role === r).length])),
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to load users');
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { isActive, isVerified, role } = req.body || {};
    if (req.params.id === req.user.id && (isActive === false || (role && role !== 'admin'))) {
      return bad(res, "You can't deactivate or demote your own admin account");
    }
    const updates = {};
    if (isActive !== undefined) updates.is_active = !!isActive;
    if (isVerified !== undefined) updates.is_verified = !!isVerified;
    if (role !== undefined) {
      if (!ROLES.includes(role)) return bad(res, `role must be one of: ${ROLES.join(', ')}`);
      updates.role = role;
    }
    if (!Object.keys(updates).length) return bad(res, 'Nothing to update');
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, full_name, email, phone, role, avatar_url, is_active, is_verified, created_at, updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return bad(res, 'User not found', 404);
    await logAudit(req.user.id, 'user.update', 'user', data.id, { email: data.email, changes: req.body });
    res.status(200).json({
      status: 'success',
      data: {
        id: data.id, name: data.full_name, email: data.email, phone: data.phone, role: data.role,
        avatar: data.avatar_url, isActive: data.is_active, isVerified: data.is_verified,
        createdAt: data.created_at, updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to update user');
  }
});

// ============================================================
// DISPUTES
// ============================================================

const DISPUTE_SELECT = `
  id, order_id, customer_id, reason, details, status, resolution, created_at, resolved_at,
  orders ( id, order_number, status, total, created_at,
    stores ( id, store_name, seller_id ),
    customer:users!orders_customer_id_fkey ( id, full_name, email, phone ),
    escrow_transactions ( status, amount ) )
`;

function toDispute(d) {
  const o = d.orders || {};
  const escrow = (o.escrow_transactions || [])[0] || null;
  return {
    id: d.id,
    reason: d.reason,
    details: d.details,
    status: d.status,
    resolution: d.resolution,
    createdAt: d.created_at,
    resolvedAt: d.resolved_at,
    order: {
      id: o.id, orderNumber: o.order_number, status: o.status, total: num(o.total), createdAt: o.created_at,
    },
    store: o.stores ? { id: o.stores.id, name: o.stores.store_name } : null,
    customer: o.customer ? { id: o.customer.id, name: o.customer.full_name, email: o.customer.email, phone: o.customer.phone } : null,
    escrow: escrow ? { status: escrow.status, amount: num(escrow.amount) } : null,
  };
}

async function selectDisputes(build) {
  let { data, error } = await build(supabaseAdmin.from('order_disputes').select(DISPUTE_SELECT));
  if (error && /relationship|customer/i.test(error.message || '')) {
    ({ data, error } = await build(
      supabaseAdmin.from('order_disputes').select(DISPUTE_SELECT.replace('users!orders_customer_id_fkey', 'users'))
    ));
  }
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return [];
    throw error;
  }
  return (data || []).map(toDispute);
}

router.get('/disputes', async (req, res) => {
  try {
    const { status } = req.query;
    const disputes = await selectDisputes((q) => {
      let x = q.order('created_at', { ascending: false });
      if (['open', 'resolved', 'rejected'].includes(status)) x = x.eq('status', status);
      return x;
    });
    res.status(200).json({ status: 'success', data: { disputes } });
  } catch (error) {
    fail(res, error, 'Failed to load disputes');
  }
});

/**
 * PATCH /api/admin/disputes/:id  { action, resolution }
 *   refund  — buyer wins: order refunded, escrow refunded
 *   release — seller wins: order completed, escrow released to the seller
 *   reject  — dispute dismissed: escrow goes back to "held" so the buyer can still confirm
 */
router.patch('/disputes/:id', async (req, res) => {
  try {
    const { action, resolution } = req.body || {};
    if (!['refund', 'release', 'reject'].includes(action)) return bad(res, 'action must be refund, release or reject');
    if (String(resolution || '').trim().length < 5) return bad(res, 'Add a short resolution note for the record');

    const [dispute] = await selectDisputes((q) => q.eq('id', req.params.id));
    if (!dispute) return bad(res, 'Dispute not found', 404);
    if (dispute.status !== 'open') return bad(res, 'This dispute is already closed');

    const now = new Date().toISOString();
    const orderId = dispute.order.id;
    if (action === 'refund') {
      await supabaseAdmin.from('orders').update({ status: 'refunded', updated_at: now }).eq('id', orderId);
      await supabaseAdmin.from('escrow_transactions').update({ status: 'refunded', refunded_at: now, updated_at: now }).eq('order_id', orderId);
    } else if (action === 'release') {
      await supabaseAdmin.from('orders').update({ status: 'completed', updated_at: now }).eq('id', orderId);
      await supabaseAdmin.from('escrow_transactions').update({ status: 'released', released_at: now, updated_at: now }).eq('order_id', orderId);
      try {
        await settleOrder(orderId);
      } catch (e) {
        console.error('wallet settlement failed for order', orderId, e);
      }
    } else {
      await supabaseAdmin.from('escrow_transactions').update({ status: 'held', updated_at: now }).eq('order_id', orderId);
    }

    const { error } = await supabaseAdmin
      .from('order_disputes')
      .update({ status: action === 'reject' ? 'rejected' : 'resolved', resolution: String(resolution).trim(), resolved_at: now })
      .eq('id', dispute.id);
    if (error) throw error;

    const [updated] = await selectDisputes((q) => q.eq('id', dispute.id));
    await logAudit(req.user.id, 'dispute.resolve', 'dispute', dispute.id, {
      action, orderNumber: dispute.order.orderNumber, amount: dispute.order.total, resolution: String(resolution).trim(),
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    fail(res, error, 'Failed to resolve dispute');
  }
});

// ============================================================
// FINANCE
// ============================================================

router.get('/finance', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
    const from = daysAgo(days - 1);
    let { data, error } = await supabaseAdmin
      .from('escrow_transactions')
      .select(`id, status, amount, held_at, released_at, refunded_at, created_at,
        orders ( id, order_number, status, stores ( store_name ), customer:users!orders_customer_id_fkey ( full_name, email ) )`)
      .order('created_at', { ascending: false });
    if (error && /relationship|customer/i.test(error.message || '')) {
      ({ data, error } = await supabaseAdmin
        .from('escrow_transactions')
        .select(`id, status, amount, held_at, released_at, refunded_at, created_at,
          orders ( id, order_number, status, stores ( store_name ), customer:users ( full_name, email ) )`)
        .order('created_at', { ascending: false }));
    }
    if (error) throw error;
    const all = data || [];
    const inRange = all.filter((t) => new Date(t.created_at) >= from);

    const daily = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const start = daysAgo(i);
      const end = daysAgo(i - 1);
      const rows = all.filter((t) => new Date(t.created_at) >= start && new Date(t.created_at) < end);
      daily.push({ date: start.toISOString(), label: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), volume: sum(rows, 'amount') });
    }

    const { data: couriers } = await supabaseAdmin.from('couriers').select('earnings_total');
    const [commissionPeriod, commissionAllTime] = await Promise.all([
      getPlatformRevenue(from.toISOString()),
      getPlatformRevenue(),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        days,
        totals: {
          volume: sum(inRange, 'amount'),
          held: sum(all.filter((t) => t.status === 'held'), 'amount'),
          disputed: sum(all.filter((t) => t.status === 'disputed'), 'amount'),
          released: sum(all.filter((t) => t.status === 'released'), 'amount'),
          refunded: sum(all.filter((t) => t.status === 'refunded'), 'amount'),
          courierEarnings: sum(couriers || [], 'earnings_total'),
          // Escro's 5%-style commission, credited when orders are released
          commission: commissionPeriod.total,
          commissionAllTime: commissionAllTime.total,
          walletsAvailable: commissionAllTime.available,
          transactions: inRange.length,
        },
        chart: daily,
        transactions: inRange.slice(0, 200).map((t) => ({
          id: t.id,
          status: t.status,
          amount: num(t.amount),
          orderId: t.orders?.id || null,
          orderNumber: t.orders?.order_number || null,
          orderStatus: t.orders?.status || null,
          store: t.orders?.stores?.store_name || null,
          customer: t.orders?.customer ? { name: t.orders.customer.full_name, email: t.orders.customer.email } : null,
          createdAt: t.created_at,
          heldAt: t.held_at,
          releasedAt: t.released_at,
          refundedAt: t.refunded_at,
        })),
        testMode: true,
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to load finance');
  }
});

// ============================================================
// ORDERS
// ============================================================

router.get('/orders', async (req, res) => {
  try {
    const { status, search } = req.query;
    let q = supabaseAdmin
      .from('orders')
      .select('id, order_number, status, total, created_at, stores ( store_name ), escrow_transactions ( status )')
      .order('created_at', { ascending: false })
      .limit(200);
    if (status) q = q.eq('status', status);
    if (search) q = q.ilike('order_number', `%${String(search).trim()}%`);
    const rows = await rowsOrEmpty(q);
    res.status(200).json({
      status: 'success',
      data: {
        orders: rows.map((o) => ({
          id: o.id, orderNumber: o.order_number, status: o.status, total: num(o.total),
          store: o.stores?.store_name || null, escrow: o.escrow_transactions?.[0]?.status || null, createdAt: o.created_at,
        })),
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to load orders');
  }
});

// ============================================================
// SETTINGS, HEALTH, AUDIT
// ============================================================

/** GET /api/admin/settings → { settings, available } */
router.get('/settings', async (req, res) => {
  try {
    const { settings, available } = await getPlatformSettings({ fresh: true });
    res.status(200).json({ status: 'success', data: { settings, available } });
  } catch (error) {
    fail(res, error, 'Failed to load settings');
  }
});

/** PUT /api/admin/settings  (partial) */
router.put('/settings', async (req, res) => {
  try {
    const { settings, changed } = await updatePlatformSettings(req.body || {}, req.user.id);
    await logAudit(req.user.id, 'settings.update', 'platform', 'settings', changed);
    res.status(200).json({ status: 'success', data: { settings, available: true } });
  } catch (error) {
    if (error.status) return bad(res, error.message, error.status);
    fail(res, error, 'Failed to save settings');
  }
});

/** GET /api/admin/health — live checks computed from real data */
router.get('/health', async (req, res) => {
  try {
    const started = Date.now();
    const ping = await supabaseAdmin.from('users').select('id', { count: 'exact', head: true });
    const dbLatencyMs = Date.now() - started;

    const iso = (d) => new Date(Date.now() - d * 24 * 3600 * 1000).toISOString();
    const count = async (q) => {
      const { count: c, error } = await q;
      if (error) return null; // table may not exist yet
      return c || 0;
    };
    const [openDisputes, staleEscrow, failedDeliveries, unassignedJobs, inactiveUsers, pendingRequests] = await Promise.all([
      count(supabaseAdmin.from('order_disputes').select('id', { count: 'exact', head: true }).eq('status', 'open')),
      count(supabaseAdmin.from('escrow_transactions').select('id', { count: 'exact', head: true }).eq('status', 'held').lt('held_at', iso(14))),
      count(supabaseAdmin.from('deliveries').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('updated_at', iso(7))),
      count(supabaseAdmin.from('deliveries').select('id', { count: 'exact', head: true }).eq('status', 'pending').is('courier_id', null).lt('created_at', new Date(Date.now() - 2 * 3600 * 1000).toISOString())),
      count(supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('is_active', false)),
      count(supabaseAdmin.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending').lt('created_at', iso(2))),
    ]);

    const check = (key, label, value, warnAt, hint) => ({
      key, label, value, hint,
      status: value === null ? 'unknown' : value >= warnAt ? 'warning' : 'ok',
    });
    const { settings, available } = await getPlatformSettings();
    res.status(200).json({
      status: 'success',
      data: {
        database: { ok: !ping.error, latencyMs: dbLatencyMs, error: ping.error?.message || null },
        api: { uptimeSeconds: Math.round(process.uptime()), node: process.version, environment: process.env.NODE_ENV || 'development' },
        payments: { mode: 'test', stripeConfigured: !!process.env.STRIPE_SECRET_KEY && !/your_/i.test(process.env.STRIPE_SECRET_KEY) },
        settingsAvailable: available,
        flags: { maintenance: settings.maintenance.enabled, ordersPaused: settings.ordersPaused, signupsPaused: settings.signupsPaused },
        checks: [
          check('openDisputes', 'Open disputes', openDisputes, 1, 'Buyers waiting on a decision'),
          check('staleEscrow', 'Escrow held > 14 days', staleEscrow, 1, 'Orders whose money has been held a long time'),
          check('unassignedJobs', 'Delivery jobs waiting > 2h', unassignedJobs, 1, 'No courier has accepted them yet'),
          check('failedDeliveries', 'Failed deliveries (7 days)', failedDeliveries, 1, 'Reported by couriers'),
          check('pendingRequests', 'Service requests unanswered > 48h', pendingRequests, 1, 'Providers haven’t responded'),
          check('inactiveUsers', 'Deactivated accounts', inactiveUsers, 9999, 'Accounts you have switched off'),
        ],
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to run health checks');
  }
});

/** GET /api/admin/audit?limit=50 */
router.get('/audit', async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const { data, error } = await supabaseAdmin
      .from('admin_audit_log')
      .select('id, action, target_type, target_id, details, created_at, admin:users ( full_name, email )')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return res.status(200).json({ status: 'success', data: { entries: [], available: false } });
      }
      throw error;
    }
    res.status(200).json({
      status: 'success',
      data: {
        available: true,
        entries: (data || []).map((e) => ({
          id: e.id,
          action: e.action,
          targetType: e.target_type,
          targetId: e.target_id,
          details: e.details,
          admin: e.admin ? { name: e.admin.full_name, email: e.admin.email } : null,
          createdAt: e.created_at,
        })),
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to load audit log');
  }
});

module.exports = router;
