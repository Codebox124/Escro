// backend/utils/wallet.js
// Splits a released escrow between the store, the courier and Escro, and reads
// wallet balances. All amounts are in the order's currency (NGN by default).
//
// Split rule (when the buyer confirms delivery, or an admin releases a dispute):
//   commission = commissionRate% of the items subtotal          → Escro
//   courier    = the delivery fee, if an Escro courier delivered → courier
//   store      = order total − commission − courier fee          → seller
// so store + courier + commission always equals what the buyer paid.

const { supabaseAdmin } = require('../config/supabase');
const { getPlatformSettings } = require('./platform');

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;
const isMissing = (e) => e && (e.code === 'PGRST205' || e.code === '42P01');

/** Work out the three shares for an order (no writes). */
async function computeSplit(orderId) {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, subtotal, tax, total, store_id, stores ( seller_id, store_name )')
    .eq('id', orderId)
    .single();
  if (error) throw error;

  let rate = 5;
  try {
    rate = Number((await getPlatformSettings()).settings.commissionRate);
    if (!Number.isFinite(rate)) rate = 5;
  } catch { /* default */ }

  const { data: deliveries } = await supabaseAdmin
    .from('deliveries')
    .select('id, status, delivery_fee, couriers ( user_id )')
    .eq('order_id', orderId)
    .eq('status', 'delivered')
    .limit(1);
  const delivery = deliveries?.[0] || null;

  const total = round2(order.total);
  const commission = round2((Number(order.subtotal || 0) * rate) / 100);
  const courierFee = delivery?.couriers?.user_id ? round2(delivery.delivery_fee) : 0;
  const store = round2(Math.max(0, total - commission - courierFee));

  return {
    order,
    rate,
    shares: {
      store: { userId: order.stores?.seller_id || null, amount: store },
      courier: delivery?.couriers?.user_id ? { userId: delivery.couriers.user_id, amount: courierFee, deliveryId: delivery.id } : null,
      commission: { userId: null, amount: commission },
    },
  };
}

/**
 * Credit the shares for a released order. Idempotent: a unique index stops the
 * same share being written twice. Returns the split, or null if wallets aren't
 * set up yet (migration 007 not run) — the order still completes in that case.
 */
async function settleOrder(orderId) {
  const split = await computeSplit(orderId);
  const { order, rate, shares } = split;
  const label = `Order #${order.order_number}`;
  const rows = [];
  if (shares.store.userId && shares.store.amount > 0) {
    rows.push({
      user_id: shares.store.userId,
      type: 'sale',
      amount: shares.store.amount,
      order_id: order.id,
      description: `${label} — sale (after ${rate}% Escro fee${shares.courier ? ' and delivery' : ''})`,
      metadata: { total: round2(order.total), commission: shares.commission.amount, courierFee: shares.courier?.amount || 0, rate },
    });
  }
  if (shares.courier && shares.courier.amount > 0) {
    rows.push({
      user_id: shares.courier.userId,
      type: 'delivery',
      amount: shares.courier.amount,
      order_id: order.id,
      delivery_id: shares.courier.deliveryId,
      description: `${label} — delivery fee`,
    });
  }
  if (shares.commission.amount > 0) {
    rows.push({
      user_id: null,
      type: 'commission',
      amount: shares.commission.amount,
      order_id: order.id,
      description: `${label} — ${rate}% commission`,
      metadata: { rate, store: order.stores?.store_name || null },
    });
  }

  for (const row of rows) {
    const { error } = await supabaseAdmin.from('wallet_transactions').insert([row]);
    if (error) {
      if (isMissing(error)) return null; // wallets not set up yet
      if (error.code === '23505') continue; // already settled — fine
      throw error;
    }
  }
  return split;
}

/** Balance + recent ledger for a user. `available:false` until migration 007 is run. */
async function getWallet(userId, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('wallet_transactions')
    .select('id, type, amount, order_id, description, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissing(error)) return { available: false, balance: 0, totalEarned: 0, totalPaidOut: 0, transactions: [] };
    throw error;
  }
  const rows = data || [];
  const sum = (filter) => round2(rows.filter(filter).reduce((n, r) => n + Number(r.amount), 0));
  return {
    available: true,
    balance: sum(() => true),
    totalEarned: sum((r) => Number(r.amount) > 0),
    totalPaidOut: Math.abs(sum((r) => r.type === 'payout')),
    transactions: rows.slice(0, limit).map((r) => ({
      id: r.id,
      type: r.type,
      amount: Number(r.amount),
      orderId: r.order_id,
      description: r.description,
      createdAt: r.created_at,
    })),
  };
}

/** Escro's own revenue (commission entries). */
async function getPlatformRevenue(sinceIso) {
  let q = supabaseAdmin.from('wallet_transactions').select('amount, created_at').eq('type', 'commission').is('user_id', null);
  if (sinceIso) q = q.gte('created_at', sinceIso);
  const { data, error } = await q;
  if (error) {
    if (isMissing(error)) return { available: false, total: 0 };
    throw error;
  }
  return { available: true, total: round2((data || []).reduce((n, r) => n + Number(r.amount), 0)) };
}

module.exports = { computeSplit, settleOrder, getWallet, getPlatformRevenue };
