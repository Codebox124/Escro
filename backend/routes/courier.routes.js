// backend/routes/courier.routes.js
// Courier app. Mounted at /api/couriers. Courier login required.
//
// Delivery lifecycle (deliveries.status):
//   pending  — job is open (created when the seller starts processing the order)
//   assigned — a courier accepted it          → courier can release it back
//   picked_up — collected from the seller      → order becomes "shipped"
//   in_transit
//   delivered — handed to the buyer            → order becomes "delivered", courier is credited
//   failed    — couldn't be delivered
// The buyer then confirms receipt, which completes the order and releases escrow to the seller.

const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth.middleware');
const { getPlatformSettings } = require('../utils/platform');
const { roadKm, etaMinutes, validCoord, ensureDeliveryCoords, mapsReady } = require('../utils/geo');

const router = express.Router();
router.use(protect, authorize('courier', 'admin'));

const MAX_ACTIVE_JOBS = 5;
const ACTIVE = ['assigned', 'picked_up', 'in_transit'];

const bad = (res, message, code = 400) => res.status(code).json({ status: 'error', message });
const fail = (res, error, fallback) => {
  console.error(fallback, error);
  res.status(500).json({ status: 'error', message: error?.message || fallback });
};

/** The courier row for this user, created on first use. */
async function getCourier(user) {
  const { data, error } = await supabaseAdmin.from('couriers').select('*').eq('user_id', user.id).limit(1);
  if (error) throw error;
  if (data && data.length) return data[0];
  const { data: created, error: e } = await supabaseAdmin
    .from('couriers')
    .insert([{ user_id: user.id, is_available: true }])
    .select('*')
    .single();
  if (e) throw e;
  return created;
}

const DELIVERY_SELECT = `
  id, order_id, courier_id, status, pickup_address, delivery_address, delivery_fee,
  distance_km, estimated_time, picked_up_at, delivered_at, created_at, updated_at,
  orders ( id, order_number, status, total, notes, tracking_number,
    shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_country,
    stores ( id, store_name, logo_url, seller_id ),
    order_items ( quantity, products ( title ) ) )
`;

async function sellerPhones(rows) {
  const sellerIds = [...new Set(rows.map((r) => r.orders?.stores?.seller_id).filter(Boolean))];
  if (!sellerIds.length) return new Map();
  const { data } = await supabaseAdmin.from('users').select('id, phone, full_name').in('id', sellerIds);
  return new Map((data || []).map((u) => [u.id, u]));
}

function toDelivery(row, sellers = new Map(), { revealContacts = true } = {}) {
  const o = row.orders || {};
  const items = o.order_items || [];
  const seller = sellers.get(o.stores?.seller_id);
  return {
    id: row.id,
    status: row.status,
    fee: Number(row.delivery_fee || 0),
    distanceKm: row.distance_km != null ? Number(row.distance_km) : null,
    estimatedMinutes: row.estimated_time,
    order: {
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      total: Number(o.total || 0),
      trackingNumber: o.tracking_number,
      notes: o.notes,
      itemCount: items.reduce((n, i) => n + (i.quantity || 0), 0),
      items: items.map((i) => ({ name: i.products?.title || 'Item', quantity: i.quantity })),
    },
    pickup: {
      name: o.stores?.store_name || 'Seller',
      logo: o.stores?.logo_url || null,
      address: row.pickup_address || o.stores?.store_name || null,
      phone: revealContacts ? seller?.phone || null : null,
    },
    dropoff: {
      name: revealContacts ? o.shipping_name : null,
      phone: revealContacts ? o.shipping_phone : null,
      // Before accepting, couriers only see the area, not the exact address.
      address: revealContacts ? row.delivery_address : null,
      area: [o.shipping_city, o.shipping_state].filter(Boolean).join(', ') || null,
    },
    pickedUpAt: row.picked_up_at,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Add map pins and distances to a delivery returned by toDelivery. */
function withMapData(delivery, row, { revealContacts = true, from = null } = {}) {
  const pickup = validCoord(row.pickup_lat, row.pickup_lng) ? { lat: row.pickup_lat, lng: row.pickup_lng } : null;
  let dropoff = validCoord(row.dropoff_lat, row.dropoff_lng) ? { lat: row.dropoff_lat, lng: row.dropoff_lng } : null;
  // Before a job is accepted, only show roughly where the buyer is (~1 km).
  if (dropoff && !revealContacts) dropoff = { lat: Math.round(dropoff.lat * 100) / 100, lng: Math.round(dropoff.lng * 100) / 100, approximate: true };
  const toPickupKm = from && pickup ? roadKm(from, pickup) : null;
  delivery.pickup.coords = pickup;
  delivery.dropoff.coords = dropoff;
  delivery.toPickupKm = toPickupKm;
  delivery.toPickupMinutes = etaMinutes(toPickupKm);
  return delivery;
}

const COORD_FIELDS = 'pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,';

async function selectDeliveries(build, opts = {}) {
  const withCoords = await mapsReady();
  const select = withCoords ? DELIVERY_SELECT.replace('distance_km,', `${COORD_FIELDS} distance_km,`) : DELIVERY_SELECT;
  const { data, error } = await build(supabaseAdmin.from('deliveries').select(select));
  if (error) throw error;
  let rows = data || [];

  // Lazily fill coordinates for a few rows that don't have them yet.
  if (withCoords) {
    const missing = rows.filter((r) => r.pickup_lat == null || r.dropoff_lat == null).slice(0, 3);
    if (missing.length) {
      for (const r of missing) Object.assign(r, await ensureDeliveryCoords(r.id));
    }
  }
  const sellers = await sellerPhones(rows);
  return rows.map((r) => withMapData(toDelivery(r, sellers, opts), r, opts));
}

function toProfile(courier, user) {
  return {
    id: courier.id,
    name: user.full_name,
    email: user.email,
    phone: user.phone || '',
    avatar: user.avatar_url || null,
    vehicleType: courier.vehicle_type || '',
    licenseNumber: courier.license_number || '',
    isAvailable: courier.is_available,
    isVerified: courier.is_verified,
    rating: Number(courier.rating || 0),
    totalDeliveries: courier.total_deliveries || 0,
    earningsTotal: Number(courier.earnings_total || 0),
    memberSince: courier.created_at,
    location: validCoord(courier.last_lat, courier.last_lng)
      ? { lat: courier.last_lat, lng: courier.last_lng, updatedAt: courier.last_seen_at }
      : null,
  };
}

async function loadUser(id) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, phone, avatar_url')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// PROFILE
// ============================================================

/** GET /api/couriers/me */
router.get('/me', async (req, res) => {
  try {
    const courier = await getCourier(req.user);
    res.status(200).json({ status: 'success', data: toProfile(courier, await loadUser(req.user.id)) });
  } catch (error) {
    fail(res, error, 'Failed to load profile');
  }
});

/** PATCH /api/couriers/me  { isAvailable?, vehicleType?, licenseNumber?, fullName?, phone? } */
router.patch('/me', async (req, res) => {
  try {
    const courier = await getCourier(req.user);
    const { isAvailable, vehicleType, licenseNumber, fullName, phone } = req.body || {};
    const c = {};
    if (isAvailable !== undefined) c.is_available = !!isAvailable;
    if (vehicleType !== undefined) c.vehicle_type = String(vehicleType).trim().slice(0, 100) || null;
    if (licenseNumber !== undefined) c.license_number = String(licenseNumber).trim().slice(0, 100) || null;
    if (Object.keys(c).length) {
      c.updated_at = new Date().toISOString();
      const { error } = await supabaseAdmin.from('couriers').update(c).eq('id', courier.id);
      if (error) throw error;
    }
    const u = {};
    if (fullName !== undefined) {
      if (!String(fullName).trim()) return bad(res, 'Full name cannot be empty');
      u.full_name = String(fullName).trim();
    }
    if (phone !== undefined) u.phone = String(phone).trim() || null;
    if (Object.keys(u).length) {
      const { error } = await supabaseAdmin.from('users').update(u).eq('id', req.user.id);
      if (error) throw error;
    }
    const fresh = await getCourier(req.user);
    res.status(200).json({ status: 'success', data: toProfile(fresh, await loadUser(req.user.id)) });
  } catch (error) {
    fail(res, error, 'Failed to update profile');
  }
});

/** PATCH /api/couriers/me/location { lat, lng } — live position from the courier's phone */
router.patch('/me/location', async (req, res) => {
  try {
    const { lat, lng } = req.body || {};
    if (!validCoord(lat, lng)) return bad(res, 'A valid lat/lng is required');
    if (!(await mapsReady())) return bad(res, 'Run backend/database/migrations/008_maps.sql in Supabase first', 409);
    const courier = await getCourier(req.user);
    const { error } = await supabaseAdmin
      .from('couriers')
      .update({ last_lat: Number(lat), last_lng: Number(lng), last_seen_at: new Date().toISOString() })
      .eq('id', courier.id);
    if (error) throw error;
    res.status(200).json({ status: 'success' });
  } catch (error) {
    fail(res, error, 'Failed to update location');
  }
});

// ============================================================
// JOBS (open deliveries)
// ============================================================

/** GET /api/couriers/jobs?lat=&lng= — open delivery jobs, nearest first when a position is known */
router.get('/jobs', async (req, res) => {
  try {
    const courier = await getCourier(req.user);
    const from = validCoord(req.query.lat, req.query.lng)
      ? { lat: Number(req.query.lat), lng: Number(req.query.lng) }
      : validCoord(courier.last_lat, courier.last_lng)
      ? { lat: courier.last_lat, lng: courier.last_lng }
      : null;
    const jobs = await selectDeliveries(
      (q) => q.eq('status', 'pending').is('courier_id', null).order('created_at', { ascending: true }),
      { revealContacts: false, from }
    );
    if (from) jobs.sort((a, b) => (a.toPickupKm ?? 1e9) - (b.toPickupKm ?? 1e9));
    res.status(200).json({ status: 'success', data: { jobs, from } });
  } catch (error) {
    fail(res, error, 'Failed to load jobs');
  }
});

/** POST /api/couriers/jobs/:id/accept */
router.post('/jobs/:id/accept', async (req, res) => {
  try {
    const courier = await getCourier(req.user);
    if (!courier.is_available) return bad(res, 'Go online to accept deliveries');

    let maxJobs = MAX_ACTIVE_JOBS;
    try {
      maxJobs = Number((await getPlatformSettings()).settings.courierMaxActiveJobs) || MAX_ACTIVE_JOBS;
    } catch { /* default */ }
    const { count } = await supabaseAdmin
      .from('deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('courier_id', courier.id)
      .in('status', ACTIVE);
    if ((count || 0) >= maxJobs) {
      return bad(res, `You already have ${maxJobs} active deliveries. Finish one first.`);
    }

    // Conditional update so two couriers can't grab the same job.
    const { data, error } = await supabaseAdmin
      .from('deliveries')
      .update({ courier_id: courier.id, status: 'assigned', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('status', 'pending')
      .is('courier_id', null)
      .select('id');
    if (error) throw error;
    if (!data || !data.length) return bad(res, 'This job was just taken by another courier', 409);

    const [delivery] = await selectDeliveries((q) => q.eq('id', req.params.id));
    res.status(200).json({ status: 'success', data: delivery });
  } catch (error) {
    fail(res, error, 'Failed to accept job');
  }
});

// ============================================================
// MY DELIVERIES
// ============================================================

/** GET /api/couriers/deliveries?scope=active|completed|all */
router.get('/deliveries', async (req, res) => {
  try {
    const courier = await getCourier(req.user);
    const scope = req.query.scope || 'all';
    const from = validCoord(courier.last_lat, courier.last_lng) ? { lat: courier.last_lat, lng: courier.last_lng } : null;
    const deliveries = await selectDeliveries((q) => {
      let x = q.eq('courier_id', courier.id);
      if (scope === 'active') x = x.in('status', ACTIVE);
      if (scope === 'completed') x = x.in('status', ['delivered', 'failed']);
      return x.order('updated_at', { ascending: false });
    }, { from });
    res.status(200).json({ status: 'success', data: { deliveries } });
  } catch (error) {
    fail(res, error, 'Failed to load deliveries');
  }
});

const COURIER_TRANSITIONS = {
  assigned: ['picked_up'],
  picked_up: ['in_transit', 'delivered', 'failed'],
  in_transit: ['delivered', 'failed'],
};

/** PATCH /api/couriers/deliveries/:id/status  { status: picked_up | in_transit | delivered | failed } */
router.patch('/deliveries/:id/status', async (req, res) => {
  try {
    const courier = await getCourier(req.user);
    const { status } = req.body || {};
    const { data: d, error } = await supabaseAdmin
      .from('deliveries')
      .select('id, status, order_id, delivery_fee')
      .eq('id', req.params.id)
      .eq('courier_id', courier.id)
      .maybeSingle();
    if (error) throw error;
    if (!d) return bad(res, 'Delivery not found', 404);
    if (!(COURIER_TRANSITIONS[d.status] || []).includes(status)) {
      return bad(res, `Can't change a delivery from "${d.status}" to "${status}"`);
    }

    const now = new Date().toISOString();
    const updates = { status, updated_at: now };
    if (status === 'picked_up') updates.picked_up_at = now;
    if (status === 'delivered') updates.delivered_at = now;
    const { error: e } = await supabaseAdmin.from('deliveries').update(updates).eq('id', d.id);
    if (e) throw e;

    // Keep the order in step with the delivery.
    if (status === 'picked_up') {
      const { data: order } = await supabaseAdmin.from('orders').select('tracking_number').eq('id', d.order_id).single();
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'shipped',
          tracking_number: order?.tracking_number || `DLV-${d.id.slice(0, 8).toUpperCase()}`,
          updated_at: now,
        })
        .eq('id', d.order_id);
    }
    if (status === 'delivered') {
      await supabaseAdmin.from('orders').update({ status: 'delivered', updated_at: now }).eq('id', d.order_id);
      await supabaseAdmin
        .from('couriers')
        .update({
          total_deliveries: (courier.total_deliveries || 0) + 1,
          earnings_total: Number(courier.earnings_total || 0) + Number(d.delivery_fee || 0),
          updated_at: now,
        })
        .eq('id', courier.id);
    }

    const [delivery] = await selectDeliveries((q) => q.eq('id', d.id));
    res.status(200).json({ status: 'success', data: delivery });
  } catch (error) {
    fail(res, error, 'Failed to update delivery');
  }
});

/** POST /api/couriers/deliveries/:id/release — give an accepted job back before pickup */
router.post('/deliveries/:id/release', async (req, res) => {
  try {
    const courier = await getCourier(req.user);
    const { data, error } = await supabaseAdmin
      .from('deliveries')
      .update({ courier_id: null, status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('courier_id', courier.id)
      .eq('status', 'assigned')
      .select('id');
    if (error) throw error;
    if (!data || !data.length) return bad(res, 'Only jobs that have not been picked up can be released');
    res.status(200).json({ status: 'success' });
  } catch (error) {
    fail(res, error, 'Failed to release job');
  }
});

// ============================================================
// DASHBOARD & EARNINGS
// ============================================================

const startOfDay = (offsetDays = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offsetDays);
  return d;
};

async function deliveredRows(courierId) {
  const { data, error } = await supabaseAdmin
    .from('deliveries')
    .select('id, delivery_fee, delivered_at, orders ( order_number, stores ( store_name ) )')
    .eq('courier_id', courierId)
    .eq('status', 'delivered')
    .order('delivered_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

const sumFees = (rows) => rows.reduce((n, r) => n + Number(r.delivery_fee || 0), 0);
const since = (rows, from, to) =>
  rows.filter((r) => {
    const t = new Date(r.delivered_at);
    return t >= from && (!to || t < to);
  });

/** GET /api/couriers/dashboard */
router.get('/dashboard', async (req, res) => {
  try {
    const courier = await getCourier(req.user);
    const [delivered, activeRes, jobsRes] = await Promise.all([
      deliveredRows(courier.id),
      supabaseAdmin.from('deliveries').select('id', { count: 'exact', head: true }).eq('courier_id', courier.id).in('status', ACTIVE),
      supabaseAdmin.from('deliveries').select('id', { count: 'exact', head: true }).eq('status', 'pending').is('courier_id', null),
    ]);
    const today = since(delivered, startOfDay(0));
    const yesterday = since(delivered, startOfDay(1), startOfDay(0));
    res.status(200).json({
      status: 'success',
      data: {
        isAvailable: courier.is_available,
        availableJobs: jobsRes.count || 0,
        activeDeliveries: activeRes.count || 0,
        completedToday: today.length,
        completedYesterday: yesterday.length,
        earningsToday: sumFees(today),
        earningsYesterday: sumFees(yesterday),
        totalDeliveries: courier.total_deliveries || 0,
        earningsTotal: Number(courier.earnings_total || 0),
        rating: Number(courier.rating || 0),
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to load dashboard');
  }
});

/** GET /api/couriers/earnings */
router.get('/earnings', async (req, res) => {
  try {
    const courier = await getCourier(req.user);
    const delivered = await deliveredRows(courier.id);

    const chart = [];
    for (let i = 6; i >= 0; i -= 1) {
      const from = startOfDay(i);
      const to = startOfDay(i - 1);
      const rows = since(delivered, from, to);
      chart.push({ label: from.toLocaleDateString('en-US', { weekday: 'short' }), date: from.toISOString(), amount: sumFees(rows), deliveries: rows.length });
    }

    res.status(200).json({
      status: 'success',
      data: {
        total: Number(courier.earnings_total || 0),
        today: sumFees(since(delivered, startOfDay(0))),
        week: sumFees(since(delivered, startOfDay(6))),
        month: sumFees(since(delivered, startOfDay(29))),
        deliveries: {
          today: since(delivered, startOfDay(0)).length,
          week: since(delivered, startOfDay(6)).length,
          month: since(delivered, startOfDay(29)).length,
          total: delivered.length,
        },
        averagePerDelivery: delivered.length ? Math.round((sumFees(delivered) / delivered.length) * 100) / 100 : 0,
        chart,
        transactions: delivered.slice(0, 50).map((r) => ({
          id: r.id,
          amount: Number(r.delivery_fee || 0),
          orderNumber: r.orders?.order_number || null,
          store: r.orders?.stores?.store_name || null,
          date: r.delivered_at,
        })),
        // Payouts aren't wired to a payment provider yet.
        payoutsEnabled: false,
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to load earnings');
  }
});

module.exports = router;
