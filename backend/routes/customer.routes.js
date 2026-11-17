// backend/routes/customer.routes.js
// Buyer flow: cart, saved addresses, checkout (test-mode escrow), orders,
// confirm delivery, cancel, dispute. Mounted at /api/customer. Login required.

const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { protect } = require('../middleware/auth.middleware');
const { toProduct, queryProducts, isMissingColumn } = require('../utils/catalog');
const { closeUnassignedJob } = require('../utils/deliveries');
const { getPlatformSettings } = require('../utils/platform');

const router = express.Router();
router.use(protect);

const fail = (res, error, fallback) => {
  console.error(fallback, error);
  if (error && (error.code === '42P01' || /relation .* does not exist|Could not find the table/i.test(error.message || ''))) {
    return res.status(409).json({
      status: 'error',
      message: 'Run backend/database/migrations/003_customer_flow.sql in Supabase first',
    });
  }
  res.status(500).json({ status: 'error', message: error?.message || fallback });
};
const bad = (res, message, code = 400) => res.status(code).json({ status: 'error', message });

// ============================================================
// CART
// ============================================================

async function loadCart(customerId) {
  const { data: items, error } = await supabaseAdmin
    .from('cart_items')
    .select('id, product_id, quantity, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (!items?.length) return { items: [], count: 0 };

  const ids = items.map((i) => i.product_id);
  const { rows } = await queryProducts((fields) => supabaseAdmin.from('products').select(fields).in('id', ids));
  const byId = new Map(rows.map((r) => [r.id, toProduct(r)]));

  const result = items
    .filter((i) => byId.has(i.product_id))
    .map((i) => {
      const product = byId.get(i.product_id);
      return {
        id: i.id,
        productId: i.product_id,
        quantity: i.quantity,
        product,
        lineTotal: product.price * i.quantity,
        available: product.inStock && i.quantity <= product.stock,
      };
    });
  return { items: result, count: result.reduce((n, i) => n + i.quantity, 0) };
}

/** GET /api/customer/cart */
router.get('/cart', async (req, res) => {
  try {
    res.status(200).json({ status: 'success', data: await loadCart(req.user.id) });
  } catch (error) {
    fail(res, error, 'Failed to load cart');
  }
});

async function assertBuyable(productId, wantedQty) {
  const { data: product, error } = await supabaseAdmin
    .from('products')
    .select('id, quantity, is_active, stores ( seller_id, is_active )')
    .eq('id', productId)
    .maybeSingle();
  if (error) throw error;
  if (!product || !product.is_active || product.stores?.is_active === false) return 'This product is no longer available';
  if (wantedQty > (product.quantity ?? 0)) {
    return product.quantity > 0 ? `Only ${product.quantity} left in stock` : 'This product is out of stock';
  }
  return { product };
}

/** POST /api/customer/cart  { productId, quantity=1 }  — adds to existing quantity */
router.post('/cart', async (req, res) => {
  try {
    const { productId } = req.body || {};
    const qty = Math.max(1, parseInt(req.body?.quantity, 10) || 1);
    if (!productId) return bad(res, 'productId is required');

    const { data: existing, error } = await supabaseAdmin
      .from('cart_items')
      .select('id, quantity')
      .eq('customer_id', req.user.id)
      .eq('product_id', productId)
      .maybeSingle();
    if (error) throw error;

    const next = (existing?.quantity || 0) + qty;
    const check = await assertBuyable(productId, next);
    if (typeof check === 'string') return bad(res, check);
    if (check.product.stores?.seller_id === req.user.id) return bad(res, "You can't buy from your own store");

    if (existing) {
      const { error: e } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity: next, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (e) throw e;
    } else {
      const { error: e } = await supabaseAdmin
        .from('cart_items')
        .insert([{ customer_id: req.user.id, product_id: productId, quantity: qty }]);
      if (e) throw e;
    }
    res.status(200).json({ status: 'success', data: await loadCart(req.user.id) });
  } catch (error) {
    fail(res, error, 'Failed to add to cart');
  }
});

/** PATCH /api/customer/cart/:productId  { quantity } — sets quantity (0 removes) */
router.patch('/cart/:productId', async (req, res) => {
  try {
    const qty = parseInt(req.body?.quantity, 10);
    if (Number.isNaN(qty) || qty < 0) return bad(res, 'quantity must be 0 or more');
    if (qty === 0) {
      await supabaseAdmin.from('cart_items').delete().eq('customer_id', req.user.id).eq('product_id', req.params.productId);
    } else {
      const check = await assertBuyable(req.params.productId, qty);
      if (typeof check === 'string') return bad(res, check);
      const { error } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity: qty, updated_at: new Date().toISOString() })
        .eq('customer_id', req.user.id)
        .eq('product_id', req.params.productId);
      if (error) throw error;
    }
    res.status(200).json({ status: 'success', data: await loadCart(req.user.id) });
  } catch (error) {
    fail(res, error, 'Failed to update cart');
  }
});

/** DELETE /api/customer/cart/:productId */
router.delete('/cart/:productId', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('customer_id', req.user.id)
      .eq('product_id', req.params.productId);
    if (error) throw error;
    res.status(200).json({ status: 'success', data: await loadCart(req.user.id) });
  } catch (error) {
    fail(res, error, 'Failed to remove item');
  }
});

/** DELETE /api/customer/cart */
router.delete('/cart', async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('cart_items').delete().eq('customer_id', req.user.id);
    if (error) throw error;
    res.status(200).json({ status: 'success', data: { items: [], count: 0 } });
  } catch (error) {
    fail(res, error, 'Failed to clear cart');
  }
});

// ============================================================
// ADDRESSES
// ============================================================

const toAddress = (a) => ({
  id: a.id,
  label: a.label,
  fullName: a.full_name,
  phone: a.phone,
  address: a.address,
  city: a.city,
  state: a.state,
  zip: a.zip,
  country: a.country,
  isDefault: a.is_default,
});

function validateAddress(a) {
  if (!a || typeof a !== 'object') return 'Delivery address is required';
  for (const [key, label] of [['fullName', 'Full name'], ['phone', 'Phone'], ['address', 'Address'], ['city', 'City'], ['state', 'State']]) {
    if (!String(a[key] || '').trim()) return `${label} is required`;
  }
  return null;
}

/** GET /api/customer/addresses */
router.get('/addresses', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', req.user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json({ status: 'success', data: { addresses: (data || []).map(toAddress) } });
  } catch (error) {
    fail(res, error, 'Failed to load addresses');
  }
});

async function saveAddress(customerId, a, makeDefault) {
  if (makeDefault) {
    await supabaseAdmin.from('customer_addresses').update({ is_default: false }).eq('customer_id', customerId);
  }
  const { data, error } = await supabaseAdmin
    .from('customer_addresses')
    .insert([
      {
        customer_id: customerId,
        label: String(a.label || '').trim() || null,
        full_name: String(a.fullName).trim(),
        phone: String(a.phone).trim(),
        address: String(a.address).trim(),
        city: String(a.city).trim(),
        state: String(a.state).trim(),
        zip: String(a.zip || '').trim() || null,
        country: String(a.country || 'Nigeria').trim(),
        is_default: !!makeDefault,
      },
    ])
    .select('*')
    .single();
  if (error) throw error;
  return toAddress(data);
}

/** POST /api/customer/addresses  { fullName, phone, address, city, state, zip?, country?, label?, isDefault? } */
router.post('/addresses', async (req, res) => {
  try {
    const err = validateAddress(req.body);
    if (err) return bad(res, err);
    const { count } = await supabaseAdmin
      .from('customer_addresses')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', req.user.id);
    const address = await saveAddress(req.user.id, req.body, req.body.isDefault || !count);
    res.status(201).json({ status: 'success', data: address });
  } catch (error) {
    fail(res, error, 'Failed to save address');
  }
});

/** DELETE /api/customer/addresses/:id */
router.delete('/addresses/:id', async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('customer_addresses')
      .delete()
      .eq('id', req.params.id)
      .eq('customer_id', req.user.id);
    if (error) throw error;
    res.status(200).json({ status: 'success' });
  } catch (error) {
    fail(res, error, 'Failed to delete address');
  }
});

// ============================================================
// CHECKOUT
// ============================================================

async function loadStoreSettings(storeIds) {
  let { data, error } = await supabaseAdmin
    .from('stores')
    .select('id, seller_id, store_name, payment_settings, shipping_settings')
    .in('id', storeIds);
  if (error && isMissingColumn(error)) {
    ({ data, error } = await supabaseAdmin.from('stores').select('id, seller_id, store_name').in('id', storeIds));
  }
  if (error) throw error;
  return new Map((data || []).map((s) => [s.id, s]));
}

/** Shipping and tax for one store's part of the cart, from the seller's settings. */
function priceStorePortion(store, subtotal) {
  const shippingSettings = store?.shipping_settings || {};
  const paymentSettings = store?.payment_settings || {};
  const methods = (shippingSettings.methods || []).filter((m) => m && m.enabled !== false);
  let shipping = methods.length ? Math.min(...methods.map((m) => Number(m.rate) || 0)) : 0;
  if (shippingSettings.freeShippingEnabled && subtotal >= Number(shippingSettings.freeShippingThreshold || 0)) {
    shipping = 0;
  }
  let tax = 0;
  if (paymentSettings.taxMode === 'fixed' && !paymentSettings.pricesIncludeTax) {
    tax = Math.round(subtotal * (Number(paymentSettings.taxRate) || 0)) / 100;
  }
  const round = (n) => Math.round(n * 100) / 100;
  return { shipping: round(shipping), tax: round(tax), total: round(subtotal + shipping + tax) };
}

const orderNumber = () => {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `ESC-${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
};

/** GET /api/customer/checkout/summary — cart grouped by store with shipping/tax */
router.get('/checkout/summary', async (req, res) => {
  try {
    const cart = await loadCart(req.user.id);
    const groups = groupByStore(cart.items);
    const settings = await loadStoreSettings([...groups.keys()]);
    const stores = [...groups.entries()].map(([storeId, items]) => {
      const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
      return { store: items[0].product.store, items, subtotal, ...priceStorePortion(settings.get(storeId), subtotal) };
    });
    res.status(200).json({
      status: 'success',
      data: {
        stores,
        itemCount: cart.count,
        subtotal: stores.reduce((n, s) => n + s.subtotal, 0),
        shipping: stores.reduce((n, s) => n + s.shipping, 0),
        tax: stores.reduce((n, s) => n + s.tax, 0),
        total: stores.reduce((n, s) => n + s.total, 0),
        unavailable: cart.items.filter((i) => !i.available).map((i) => i.productId),
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to prepare checkout');
  }
});

function groupByStore(items) {
  const groups = new Map();
  for (const item of items) {
    const key = item.product.store.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

/**
 * POST /api/customer/checkout
 *   { addressId } or { address: {fullName, phone, address, city, state, zip?, country?}, saveAddress? }
 *   notes?
 * TEST MODE: no card is charged; each order's money is recorded as held in escrow.
 * Creates one order per store.
 */
router.post('/checkout', async (req, res) => {
  const created = [];
  try {
    const { settings: platform } = await getPlatformSettings();
    if (platform.ordersPaused) {
      return bad(res, 'New orders are temporarily paused on Escro. Your cart is saved — please try again later.', 503);
    }
    const { addressId, notes } = req.body || {};
    let address = req.body?.address;

    if (addressId) {
      const { data, error } = await supabaseAdmin
        .from('customer_addresses')
        .select('*')
        .eq('id', addressId)
        .eq('customer_id', req.user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return bad(res, 'Address not found');
      address = toAddress(data);
    } else {
      const err = validateAddress(address);
      if (err) return bad(res, err);
      if (req.body.saveAddress) await saveAddress(req.user.id, address, false);
    }

    const cart = await loadCart(req.user.id);
    if (!cart.items.length) return bad(res, 'Your cart is empty');
    const unavailable = cart.items.filter((i) => !i.available);
    if (unavailable.length) {
      return bad(res, `Some items are no longer available in that quantity: ${unavailable.map((i) => i.product.name).join(', ')}`);
    }

    const groups = groupByStore(cart.items);
    const settings = await loadStoreSettings([...groups.keys()]);
    for (const store of settings.values()) {
      if (store.seller_id === req.user.id) return bad(res, "You can't buy from your own store");
    }

    for (const [storeId, items] of groups) {
      const subtotal = Math.round(items.reduce((n, i) => n + i.lineTotal, 0) * 100) / 100;
      const pricing = priceStorePortion(settings.get(storeId), subtotal);

      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .insert([
          {
            order_number: orderNumber(),
            customer_id: req.user.id,
            store_id: storeId,
            status: 'pending',
            subtotal,
            shipping_fee: pricing.shipping,
            tax: pricing.tax,
            total: pricing.total,
            shipping_name: address.fullName,
            shipping_phone: address.phone,
            shipping_address: address.address,
            shipping_city: address.city,
            shipping_state: address.state,
            shipping_zip: address.zip || null,
            shipping_country: address.country || 'Nigeria',
            notes: String(notes || '').trim() || null,
          },
        ])
        .select('id')
        .single();
      if (error) throw error;
      created.push(order.id);

      const { error: itemsError } = await supabaseAdmin.from('order_items').insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.productId,
          quantity: i.quantity,
          price: i.product.price,
          total: Math.round(i.lineTotal * 100) / 100,
        }))
      );
      if (itemsError) throw itemsError;

      // TEST MODE escrow: record the funds as held (no real charge).
      const { error: escrowError } = await supabaseAdmin
        .from('escrow_transactions')
        .insert([{ order_id: order.id, amount: pricing.total, status: 'held' }]);
      if (escrowError) throw escrowError;
    }

    // Reserve stock and empty the cart.
    for (const item of cart.items) {
      await supabaseAdmin
        .from('products')
        .update({ quantity: Math.max(0, item.product.stock - item.quantity) })
        .eq('id', item.productId);
    }
    await supabaseAdmin.from('cart_items').delete().eq('customer_id', req.user.id);

    const orders = await fetchOrders(req.user.id, (q) => q.in('id', created));
    res.status(201).json({ status: 'success', data: { orders, testMode: true } });
  } catch (error) {
    // Roll back any orders created before the failure.
    if (created.length) await supabaseAdmin.from('orders').delete().in('id', created);
    fail(res, error, 'Checkout failed');
  }
});

// ============================================================
// ORDERS
// ============================================================

const ORDER_SELECT = `
  id, order_number, status, subtotal, shipping_fee, tax, total,
  shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state,
  shipping_zip, shipping_country, notes, tracking_number, created_at, updated_at,
  stores ( id, store_name, store_slug, logo_url ),
  order_items ( id, product_id, quantity, price, total,
    products ( title, product_images ( image_url, is_primary ) ) ),
  deliveries ( id, status, picked_up_at, delivered_at, couriers ( vehicle_type, users ( full_name, phone ) ) ),
  escrow_transactions ( status, amount, held_at, released_at, refunded_at )
`;

function toOrder(o, disputes = []) {
  const escrow = (o.escrow_transactions || [])[0] || null;
  const status = o.status;
  return {
    id: o.id,
    orderNumber: o.order_number,
    status,
    store: o.stores
      ? { id: o.stores.id, name: o.stores.store_name, slug: o.stores.store_slug, logo: o.stores.logo_url }
      : null,
    items: (o.order_items || []).map((it) => {
      const imgs = it.products?.product_images || [];
      return {
        id: it.id,
        productId: it.product_id,
        name: it.products?.title || 'Deleted product',
        image: (imgs.find((i) => i.is_primary) || imgs[0])?.image_url || null,
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
    escrow: escrow
      ? {
          status: escrow.status,
          amount: Number(escrow.amount),
          heldAt: escrow.held_at,
          releasedAt: escrow.released_at,
          refundedAt: escrow.refunded_at,
        }
      : null,
    dispute: disputes[0]
      ? {
          id: disputes[0].id,
          reason: disputes[0].reason,
          details: disputes[0].details,
          status: disputes[0].status,
          createdAt: disputes[0].created_at,
        }
      : null,
    can: {
      confirm: ['shipped', 'delivered'].includes(status) && escrow?.status === 'held',
      cancel: ['pending', 'confirmed'].includes(status),
      dispute: ['shipped', 'delivered'].includes(status) && escrow?.status === 'held',
    },
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

async function fetchOrders(customerId, extra = (q) => q) {
  const { data, error } = await extra(
    supabaseAdmin.from('orders').select(ORDER_SELECT).eq('customer_id', customerId).order('created_at', { ascending: false })
  );
  if (error) throw error;
  const rows = data || [];
  let disputes = [];
  if (rows.length) {
    const r = await supabaseAdmin
      .from('order_disputes')
      .select('*')
      .in('order_id', rows.map((o) => o.id))
      .order('created_at', { ascending: false });
    if (!r.error) disputes = r.data || [];
  }
  return rows.map((o) => toOrder(o, disputes.filter((d) => d.order_id === o.id)));
}

/** GET /api/customer/orders */
router.get('/orders', async (req, res) => {
  try {
    const orders = await fetchOrders(req.user.id);
    const stats = {
      total: orders.length,
      active: orders.filter((o) => ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].includes(o.status)).length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => ['cancelled', 'refunded'].includes(o.status)).length,
      inEscrow: orders.filter((o) => o.escrow?.status === 'held').reduce((n, o) => n + o.total, 0),
    };
    res.status(200).json({ status: 'success', data: { orders, stats } });
  } catch (error) {
    fail(res, error, 'Failed to load orders');
  }
});

/** GET /api/customer/orders/:id */
router.get('/orders/:id', async (req, res) => {
  try {
    const [order] = await fetchOrders(req.user.id, (q) => q.eq('id', req.params.id));
    if (!order) return bad(res, 'Order not found', 404);
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    fail(res, error, 'Failed to load order');
  }
});

async function getOwnedOrder(customerId, orderId) {
  const [order] = await fetchOrders(customerId, (q) => q.eq('id', orderId));
  return order || null;
}

/** POST /api/customer/orders/:id/confirm — item received: release escrow to the seller */
router.post('/orders/:id/confirm', async (req, res) => {
  try {
    const order = await getOwnedOrder(req.user.id, req.params.id);
    if (!order) return bad(res, 'Order not found', 404);
    if (!order.can.confirm) return bad(res, "This order can't be confirmed yet");

    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from('orders').update({ status: 'completed', updated_at: now }).eq('id', order.id);
    if (error) throw error;
    await supabaseAdmin
      .from('escrow_transactions')
      .update({ status: 'released', released_at: now, updated_at: now })
      .eq('order_id', order.id);

    // Sales counters (best effort)
    for (const item of order.items) {
      if (!item.productId) continue;
      const { data: p } = await supabaseAdmin.from('products').select('total_sales').eq('id', item.productId).maybeSingle();
      if (p) await supabaseAdmin.from('products').update({ total_sales: (p.total_sales || 0) + item.quantity }).eq('id', item.productId);
    }
    if (order.store?.id) {
      const { data: s } = await supabaseAdmin.from('stores').select('total_sales').eq('id', order.store.id).maybeSingle();
      if (s) await supabaseAdmin.from('stores').update({ total_sales: Number(s.total_sales || 0) + order.total }).eq('id', order.store.id);
    }

    res.status(200).json({ status: 'success', data: await getOwnedOrder(req.user.id, order.id) });
  } catch (error) {
    fail(res, error, 'Failed to confirm delivery');
  }
});

/** POST /api/customer/orders/:id/cancel — before the seller starts processing */
router.post('/orders/:id/cancel', async (req, res) => {
  try {
    const order = await getOwnedOrder(req.user.id, req.params.id);
    if (!order) return bad(res, 'Order not found', 404);
    if (!order.can.cancel) return bad(res, 'This order can no longer be cancelled');

    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from('orders').update({ status: 'cancelled', updated_at: now }).eq('id', order.id);
    if (error) throw error;
    await closeUnassignedJob(order.id);
    await supabaseAdmin
      .from('escrow_transactions')
      .update({ status: 'refunded', refunded_at: now, updated_at: now })
      .eq('order_id', order.id);

    // Return stock
    for (const item of order.items) {
      if (!item.productId) continue;
      const { data: p } = await supabaseAdmin.from('products').select('quantity').eq('id', item.productId).maybeSingle();
      if (p) await supabaseAdmin.from('products').update({ quantity: (p.quantity || 0) + item.quantity }).eq('id', item.productId);
    }

    res.status(200).json({ status: 'success', data: await getOwnedOrder(req.user.id, order.id) });
  } catch (error) {
    fail(res, error, 'Failed to cancel order');
  }
});

const DISPUTE_REASONS = ['not_received', 'not_as_described', 'damaged', 'wrong_item', 'other'];

/** POST /api/customer/orders/:id/dispute  { reason, details } — freezes the escrow */
router.post('/orders/:id/dispute', async (req, res) => {
  try {
    const { reason, details } = req.body || {};
    if (!DISPUTE_REASONS.includes(reason)) return bad(res, `reason must be one of: ${DISPUTE_REASONS.join(', ')}`);
    if (!String(details || '').trim()) return bad(res, 'Please describe the problem');

    const order = await getOwnedOrder(req.user.id, req.params.id);
    if (!order) return bad(res, 'Order not found', 404);
    if (!order.can.dispute) return bad(res, "A dispute can't be opened for this order");

    const { error } = await supabaseAdmin.from('order_disputes').insert([
      { order_id: order.id, customer_id: req.user.id, reason, details: String(details).trim().slice(0, 2000) },
    ]);
    if (error) throw error;
    const now = new Date().toISOString();
    await supabaseAdmin.from('escrow_transactions').update({ status: 'disputed', updated_at: now }).eq('order_id', order.id);

    res.status(200).json({ status: 'success', data: await getOwnedOrder(req.user.id, order.id) });
  } catch (error) {
    fail(res, error, 'Failed to open dispute');
  }
});

module.exports = router;
