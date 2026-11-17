// backend/utils/deliveries.js
// Creates / clears courier delivery jobs as orders move through their lifecycle.

const { supabaseAdmin } = require('../config/supabase');
const { getPlatformSettings } = require('./platform');

const DEFAULT_DELIVERY_FEE = 1500; // NGN, used when an order has no shipping fee

const joinAddress = (parts) => parts.map((p) => String(p || '').trim()).filter(Boolean).join(', ');

/** Open a delivery job for an order (idempotent). Called when the seller starts processing. */
async function openDeliveryJob(orderId) {
  const { data: existing } = await supabaseAdmin
    .from('deliveries')
    .select('id, status')
    .eq('order_id', orderId)
    .neq('status', 'failed')
    .limit(1);
  if (existing && existing.length) return existing[0];

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, shipping_fee, shipping_address, shipping_city, shipping_state, shipping_country, store_id')
    .eq('id', orderId)
    .single();
  if (error) throw error;

  let pickup = '';
  if (order.store_id) {
    let { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('store_name, address')
      .eq('id', order.store_id)
      .maybeSingle();
    if (storeError) {
      ({ data: store } = await supabaseAdmin.from('stores').select('store_name').eq('id', order.store_id).maybeSingle());
    }
    pickup = joinAddress([store?.store_name, store?.address]);
  }

  let defaultFee = DEFAULT_DELIVERY_FEE;
  try {
    defaultFee = Number((await getPlatformSettings()).settings.defaultDeliveryFee) || DEFAULT_DELIVERY_FEE;
  } catch { /* fall back to the built-in default */ }
  const fee = Number(order.shipping_fee) > 0 ? Number(order.shipping_fee) : defaultFee;
  const { data: created, error: insertError } = await supabaseAdmin
    .from('deliveries')
    .insert([
      {
        order_id: order.id,
        status: 'pending',
        pickup_address: pickup || null,
        delivery_address: joinAddress([order.shipping_address, order.shipping_city, order.shipping_state, order.shipping_country]),
        delivery_fee: fee,
      },
    ])
    .select('id, status')
    .single();
  if (insertError) throw insertError;
  return created;
}

/** Remove a job nobody has accepted yet (order cancelled / seller ships it themselves). */
async function closeUnassignedJob(orderId) {
  await supabaseAdmin.from('deliveries').delete().eq('order_id', orderId).eq('status', 'pending').is('courier_id', null);
}

/** The active (non-failed) delivery for an order, if any. */
async function activeDeliveryFor(orderId) {
  const { data } = await supabaseAdmin
    .from('deliveries')
    .select('id, status, courier_id')
    .eq('order_id', orderId)
    .neq('status', 'failed')
    .limit(1);
  return data?.[0] || null;
}

module.exports = { openDeliveryJob, closeUnassignedJob, activeDeliveryFor, DEFAULT_DELIVERY_FEE };
