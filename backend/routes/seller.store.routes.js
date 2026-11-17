// backend/routes/seller.store.routes.js
// Real seller data: dashboard stats, orders, payment/shipping settings.
// Mounted on /api/seller (before the old testing stubs, which it replaces).

const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth.middleware');
const { openDeliveryJob, closeUnassignedJob, activeDeliveryFor } = require('../utils/deliveries');

const router = express.Router();
const guard = [protect, authorize('seller', 'admin')];

const ACTIVE_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'];
const OPEN_STATUSES = ['pending', 'confirmed', 'processing'];
const EARNED_STATUSES = ['delivered', 'completed'];

const isMissingColumn = (error) => error && (error.code === '42703' || error.code === 'PGRST204');

const fail = (res, error, fallback) => {
  console.error(fallback, error);
  res.status(500).json({ status: 'error', message: error?.message || fallback });
};

async function getStore(userId, fields = 'id') {
  const { data, error } = await supabaseAdmin
    .from('stores')
    .select(fields)
    .eq('seller_id', userId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

const sum = (rows, key = 'total') => rows.reduce((acc, r) => acc + Number(r[key] || 0), 0);
const pctChange = (current, previous) => {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const daysAgo = (n) => {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
};

// ============================================================
// DASHBOARD
// ============================================================

/** GET /api/seller/dashboard/stats */
router.get('/dashboard/stats', guard, async (req, res) => {
  try {
    const store = await getStore(req.user.id);
    const empty = {
      todaySales: 0, todaySalesChange: 0, totalProducts: 0, productsChange: 0,
      pendingOrders: 0, ordersChange: 0, totalRevenue: 0, revenueChange: 0,
      totalOrders: 0,
      salesChartData: buildChart([]),
    };
    if (!store) return res.status(200).json({ status: 'success', data: empty });

    const [ordersRes, productsRes] = await Promise.all([
      supabaseAdmin.from('orders').select('total, status, created_at').eq('store_id', store.id),
      supabaseAdmin.from('products').select('created_at').eq('store_id', store.id),
    ]);
    if (ordersRes.error) throw ordersRes.error;
    if (productsRes.error) throw productsRes.error;

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];
    const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    const inRange = (rows, from, to) =>
      rows.filter((r) => {
        const t = new Date(r.created_at);
        return t >= from && (!to || t < to);
      });

    const today = daysAgo(0);
    const yesterday = daysAgo(1);
    const weekAgo = daysAgo(7);
    const twoWeeksAgo = daysAgo(14);
    const monthAgo = daysAgo(30);
    const twoMonthsAgo = daysAgo(60);

    const earned = orders.filter((o) => EARNED_STATUSES.includes(o.status));
    const newProductsThisWeek = inRange(products, weekAgo).length;

    const data = {
      todaySales: sum(inRange(active, today)),
      todaySalesChange: pctChange(sum(inRange(active, today)), sum(inRange(active, yesterday, today))),
      totalProducts: products.length,
      productsChange: pctChange(products.length, products.length - newProductsThisWeek),
      pendingOrders: orders.filter((o) => OPEN_STATUSES.includes(o.status)).length,
      ordersChange: pctChange(inRange(orders, weekAgo).length, inRange(orders, twoWeeksAgo, weekAgo).length),
      totalRevenue: sum(earned),
      revenueChange: pctChange(sum(inRange(earned, monthAgo)), sum(inRange(earned, twoMonthsAgo, monthAgo))),
      totalOrders: orders.length,
      salesChartData: buildChart(active),
    };
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    fail(res, error, 'Failed to fetch dashboard statistics');
  }
});

/** Last 7 days of sales, oldest first. */
function buildChart(orders) {
  const labels = [];
  const values = [];
  for (let i = 6; i >= 0; i -= 1) {
    const from = daysAgo(i);
    const to = daysAgo(i - 1);
    labels.push(from.toLocaleDateString('en-US', { weekday: 'short' }));
    values.push(
      sum(orders.filter((o) => {
        const t = new Date(o.created_at);
        return t >= from && t < to;
      }))
    );
  }
  return { labels, datasets: [{ label: 'Sales', data: values }] };
}

// ============================================================
// ORDERS
// ============================================================

const ORDER_SELECT = `
  id, order_number, status, subtotal, shipping_fee, tax, total,
  shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state,
  shipping_zip, shipping_country, notes, tracking_number, created_at, updated_at,
  customer:users!orders_customer_id_fkey ( id, full_name, email, phone, avatar_url ),
  order_items ( id, product_id, quantity, price, total,
    products ( title, sku, product_images ( image_url, is_primary ) ) ),
  deliveries ( id, status, picked_up_at, delivered_at, couriers ( vehicle_type, users ( full_name, phone ) ) ),
  escrow_transactions ( status, amount, held_at, released_at, refunded_at )
`;

const PAYMENT_STATUS = { held: 'escrow', disputed: 'escrow', released: 'paid', refunded: 'refunded' };

function toClientOrder(o) {
  const escrow = (o.escrow_transactions || [])[0];
  return {
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    paymentStatus: escrow ? PAYMENT_STATUS[escrow.status] || 'pending' : 'pending',
    escrow: escrow
      ? { status: escrow.status, amount: Number(escrow.amount), heldAt: escrow.held_at, releasedAt: escrow.released_at, refundedAt: escrow.refunded_at }
      : null,
    customer: {
      id: o.customer?.id || null,
      name: o.customer?.full_name || o.shipping_name || 'Customer',
      email: o.customer?.email || null,
      phone: o.customer?.phone || o.shipping_phone || null,
      avatar: o.customer?.avatar_url || null,
    },
    items: (o.order_items || []).map((it) => {
      const images = it.products?.product_images || [];
      const primary = images.find((im) => im.is_primary) || images[0];
      return {
        id: it.id,
        productId: it.product_id,
        name: it.products?.title || 'Deleted product',
        sku: it.products?.sku || null,
        image: primary?.image_url || null,
        quantity: it.quantity,
        price: Number(it.price),
        total: Number(it.total),
      };
    }),
    subtotal: Number(o.subtotal || 0),
    shippingFee: Number(o.shipping_fee || 0),
    tax: Number(o.tax || 0),
    total: Number(o.total || 0),
    shipping: {
      name: o.shipping_name,
      phone: o.shipping_phone,
      address: o.shipping_address,
      city: o.shipping_city,
      state: o.shipping_state,
      zip: o.shipping_zip,
      country: o.shipping_country,
    },
    trackingNumber: o.tracking_number,
    notes: o.notes,
    delivery: (() => {
      const d = (o.deliveries || []).find((x) => x.status !== 'failed') || (o.deliveries || [])[0];
      if (!d) return null;
      return {
        id: d.id,
        status: d.status,
        pickedUpAt: d.picked_up_at,
        deliveredAt: d.delivered_at,
        courier: d.couriers
          ? { name: d.couriers.users?.full_name || 'Courier', phone: d.couriers.users?.phone || null, vehicle: d.couriers.vehicle_type || null }
          : null,
      };
    })(),
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

async function selectOrders(storeId, extra = (q) => q) {
  // Try with the named customer FK first; fall back to the generic embed if
  // the constraint has a different name in this database.
  let { data, error } = await extra(
    supabaseAdmin.from('orders').select(ORDER_SELECT).eq('store_id', storeId)
  );
  if (error && /relationship|customer/i.test(error.message)) {
    ({ data, error } = await extra(
      supabaseAdmin
        .from('orders')
        .select(ORDER_SELECT.replace('users!orders_customer_id_fkey', 'users'))
        .eq('store_id', storeId)
    ));
  }
  if (error) throw error;
  return data || [];
}

/** GET /api/seller/orders?status=&search=&from= */
router.get('/orders', guard, async (req, res) => {
  try {
    const store = await getStore(req.user.id);
    if (!store) {
      return res.status(200).json({
        status: 'success',
        data: { orders: [], stats: { total: 0, pending: 0, completed: 0, cancelled: 0 } },
      });
    }
    const rows = await selectOrders(store.id, (q) => q.order('created_at', { ascending: false }));
    const orders = rows.map(toClientOrder);
    const stats = {
      total: orders.length,
      pending: orders.filter((o) => OPEN_STATUSES.includes(o.status)).length,
      completed: orders.filter((o) => EARNED_STATUSES.includes(o.status)).length,
      cancelled: orders.filter((o) => ['cancelled', 'refunded'].includes(o.status)).length,
    };
    res.status(200).json({ status: 'success', data: { orders, stats } });
  } catch (error) {
    fail(res, error, 'Failed to fetch orders');
  }
});

/** GET /api/seller/orders/:id */
router.get('/orders/:id', guard, async (req, res) => {
  try {
    const store = await getStore(req.user.id);
    if (!store) return res.status(404).json({ status: 'error', message: 'Order not found' });
    const rows = await selectOrders(store.id, (q) => q.eq('id', req.params.id));
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Order not found' });
    res.status(200).json({ status: 'success', data: toClientOrder(rows[0]) });
  } catch (error) {
    fail(res, error, 'Failed to fetch order');
  }
});

// Which status changes a seller may make. Delivery is confirmed by the
// buyer/courier and money movement by escrow, so sellers stop at "shipped".
const SELLER_TRANSITIONS = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
};

/** PATCH /api/seller/orders/:id/status  { status, trackingNumber? } */
router.patch('/orders/:id/status', guard, async (req, res) => {
  try {
    const { status, trackingNumber } = req.body || {};
    const store = await getStore(req.user.id);
    if (!store) return res.status(404).json({ status: 'error', message: 'Order not found' });

    const { data: current, error } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', req.params.id)
      .eq('store_id', store.id)
      .maybeSingle();
    if (error) throw error;
    if (!current) return res.status(404).json({ status: 'error', message: 'Order not found' });

    const allowed = SELLER_TRANSITIONS[current.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Can't change an order from "${current.status}" to "${status}"`,
      });
    }
    if (status === 'shipped' && !String(trackingNumber || '').trim()) {
      return res.status(400).json({ status: 'error', message: 'A tracking number is required to mark as shipped' });
    }
    const delivery = await activeDeliveryFor(current.id);
    if (delivery?.courier_id && ['shipped', 'cancelled'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'An Escro courier has already accepted this delivery, so it will be updated automatically.',
      });
    }

    const updates = { status, updated_at: new Date().toISOString() };
    if (trackingNumber !== undefined) updates.tracking_number = String(trackingNumber).trim() || null;
    const { error: updateError } = await supabaseAdmin.from('orders').update(updates).eq('id', current.id);
    if (updateError) throw updateError;

    // Courier jobs: open one when the order is being prepared; drop it if the
    // seller ships it themselves or the order is cancelled before pickup.
    if (status === 'processing') await openDeliveryJob(current.id);
    if (status === 'shipped' || status === 'cancelled') await closeUnassignedJob(current.id);

    const rows = await selectOrders(store.id, (q) => q.eq('id', current.id));
    res.status(200).json({ status: 'success', data: toClientOrder(rows[0]) });
  } catch (error) {
    fail(res, error, 'Failed to update order');
  }
});

// ============================================================
// PAYMENT & SHIPPING SETTINGS
// ============================================================

const plainObject = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

/** GET /api/seller/settings */
router.get('/settings', guard, async (req, res) => {
  try {
    let store;
    let available = true;
    try {
      store = await getStore(req.user.id, 'id, currency, payment_settings, shipping_settings');
    } catch (error) {
      if (!isMissingColumn(error)) throw error;
      available = false;
      store = await getStore(req.user.id, 'id');
    }
    res.status(200).json({
      status: 'success',
      data: {
        available, // false until migration 002 has been run
        currency: store?.currency || 'ngn',
        payment: store?.payment_settings || {},
        shipping: store?.shipping_settings || {},
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to load settings');
  }
});

const saveSection = (column) => async (req, res) => {
  try {
    const body = plainObject(req.body);
    if (!body) return res.status(400).json({ status: 'error', message: 'Settings must be an object' });
    if (JSON.stringify(body).length > 50_000) {
      return res.status(400).json({ status: 'error', message: 'Settings are too large' });
    }
    const store = await getStore(req.user.id);
    if (!store) {
      return res.status(400).json({ status: 'error', message: 'Set up your store profile first' });
    }
    const { data, error } = await supabaseAdmin
      .from('stores')
      .update({ [column]: body, updated_at: new Date().toISOString() })
      .eq('id', store.id)
      .select(column)
      .single();
    if (error) {
      if (isMissingColumn(error)) {
        return res.status(409).json({
          status: 'error',
          message: 'Run backend/database/migrations/002_store_payment_shipping.sql in Supabase first',
        });
      }
      throw error;
    }
    res.status(200).json({ status: 'success', data: data[column] });
  } catch (error) {
    fail(res, error, 'Failed to save settings');
  }
};

/** PUT /api/seller/settings/payment  (JSON object) */
router.put('/settings/payment', guard, saveSection('payment_settings'));
/** PUT /api/seller/settings/shipping (JSON object) */
router.put('/settings/shipping', guard, saveSection('shipping_settings'));

module.exports = router;
