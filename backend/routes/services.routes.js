// backend/routes/services.routes.js
// Services marketplace.
//   Public   : GET  /api/services, /api/services/categories, /api/services/:id
//   Customer : GET  /api/services/requests/mine
//              POST /api/services/:id/requests
//              POST /api/services/requests/:requestId/cancel
//   Provider : GET/POST/PUT/DELETE /api/services/provider/mine[/:id]   (agency | seller | admin)
//              GET   /api/services/provider/requests
//              PATCH /api/services/provider/requests/:requestId  { status, providerNote }

const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth.middleware');
const { imageUpload, handleUpload, uploadPublicImage } = require('../utils/storage');

const router = express.Router();
const providerOnly = [protect, authorize('agency', 'seller', 'admin')];
const acceptImage = handleUpload(imageUpload.single('image'));

const CATEGORIES = [
  { slug: 'delivery', name: 'Delivery & Logistics' },
  { slug: 'design', name: 'Design & Creative' },
  { slug: 'tech', name: 'Tech & Development' },
  { slug: 'marketing', name: 'Marketing' },
  { slug: 'home', name: 'Home Services' },
  { slug: 'repairs', name: 'Repairs & Maintenance' },
  { slug: 'events', name: 'Events' },
  { slug: 'beauty', name: 'Beauty & Wellness' },
  { slug: 'education', name: 'Lessons & Tutoring' },
  { slug: 'other', name: 'Other' },
];
const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
const PRICE_TYPES = ['fixed', 'starting_at', 'hourly'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const bad = (res, message, code = 400) => res.status(code).json({ status: 'error', message });
const fail = (res, error, fallback) => {
  console.error(fallback, error);
  if (error && (error.code === '42P01' || error.code === 'PGRST205' || /Could not find the table|does not exist/i.test(error.message || ''))) {
    const which = /service_request_messages/.test(error.message || '') ? '005_agency.sql' : '004_services.sql';
    return bad(res, `Run backend/database/migrations/${which} in Supabase first`, 409);
  }
  res.status(500).json({ status: 'error', message: error?.message || fallback });
};

const SERVICE_SELECT = `
  id, provider_id, title, description, category, price, price_type, currency, delivery_time,
  location, image_url, is_active, rating, total_reviews, total_requests, created_at, updated_at,
  provider:users!services_provider_id_fkey ( id, full_name, avatar_url, role, is_verified )
`;

/** Agencies show their company name; everyone else their full name. */
async function providerNames(rows) {
  const agencyUserIds = [...new Set(rows.filter((r) => r.provider?.role === 'agency').map((r) => r.provider_id))];
  if (!agencyUserIds.length) return new Map();
  const { data } = await supabaseAdmin
    .from('agencies')
    .select('user_id, company_name, is_verified')
    .in('user_id', agencyUserIds);
  return new Map((data || []).map((a) => [a.user_id, a]));
}

function toService(row, agencies = new Map()) {
  const agency = agencies.get(row.provider_id);
  const category = CATEGORIES.find((c) => c.slug === row.category) || CATEGORIES[CATEGORIES.length - 1];
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: { slug: category.slug, name: category.name },
    price: Number(row.price),
    priceType: row.price_type,
    currency: row.currency || 'ngn',
    deliveryTime: row.delivery_time || null,
    location: row.location || null,
    image: row.image_url || null,
    isActive: row.is_active,
    rating: Number(row.rating || 0),
    reviews: row.total_reviews || 0,
    requests: row.total_requests || 0,
    provider: {
      id: row.provider_id,
      name: agency?.company_name || row.provider?.full_name || 'Provider',
      avatar: row.provider?.avatar_url || null,
      type: row.provider?.role || null,
      verified: !!(agency?.is_verified || row.provider?.is_verified),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function selectServices(build) {
  let { data, error, count } = await build(SERVICE_SELECT);
  if (error && /relationship|provider/i.test(error.message || '')) {
    ({ data, error, count } = await build(SERVICE_SELECT.replace('users!services_provider_id_fkey', 'users')));
  }
  if (error) throw error;
  const rows = data || [];
  const agencies = await providerNames(rows);
  return { services: rows.map((r) => toService(r, agencies)), count };
}

// ============================================================
// CUSTOMER (declared before "/:id" so the paths don't collide)
// ============================================================

const REQUEST_SELECT = `
  id, service_id, customer_id, message, budget, preferred_date, contact_phone, status,
  provider_note, created_at, updated_at,
  services ( id, title, price, price_type, currency, image_url, provider_id ),
  customer:users!service_requests_customer_id_fkey ( id, full_name, email, phone, avatar_url )
`;

function toRequest(r) {
  return {
    id: r.id,
    status: r.status,
    message: r.message,
    budget: r.budget != null ? Number(r.budget) : null,
    preferredDate: r.preferred_date,
    contactPhone: r.contact_phone,
    providerNote: r.provider_note,
    service: r.services
      ? {
          id: r.services.id,
          title: r.services.title,
          price: Number(r.services.price),
          priceType: r.services.price_type,
          currency: r.services.currency || 'ngn',
          image: r.services.image_url,
          providerId: r.services.provider_id,
        }
      : null,
    customer: r.customer
      ? { id: r.customer.id, name: r.customer.full_name, email: r.customer.email, phone: r.customer.phone, avatar: r.customer.avatar_url }
      : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function selectRequests(build) {
  let { data, error } = await build(REQUEST_SELECT);
  if (error && /relationship|customer/i.test(error.message || '')) {
    ({ data, error } = await build(REQUEST_SELECT.replace('users!service_requests_customer_id_fkey', 'users')));
  }
  if (error) throw error;
  return (data || []).map(toRequest);
}

/** GET /api/services/requests/mine — the customer's requests */
router.get('/requests/mine', protect, async (req, res) => {
  try {
    const requests = await selectRequests((f) =>
      supabaseAdmin.from('service_requests').select(f).eq('customer_id', req.user.id).order('created_at', { ascending: false })
    );
    // attach provider names
    const providerIds = [...new Set(requests.map((r) => r.service?.providerId).filter(Boolean))];
    if (providerIds.length) {
      const { data: users } = await supabaseAdmin.from('users').select('id, full_name, role').in('id', providerIds);
      const { data: agencies } = await supabaseAdmin.from('agencies').select('user_id, company_name').in('user_id', providerIds);
      const names = new Map((users || []).map((u) => [u.id, u.full_name]));
      (agencies || []).forEach((a) => names.set(a.user_id, a.company_name));
      requests.forEach((r) => {
        if (r.service) r.service.providerName = names.get(r.service.providerId) || 'Provider';
      });
    }
    res.status(200).json({ status: 'success', data: { requests } });
  } catch (error) {
    fail(res, error, 'Failed to load your requests');
  }
});

/** POST /api/services/requests/:requestId/cancel — customer cancels a pending request */
router.post('/requests/:requestId/cancel', protect, async (req, res) => {
  try {
    const { data: r, error } = await supabaseAdmin
      .from('service_requests')
      .select('id, status')
      .eq('id', req.params.requestId)
      .eq('customer_id', req.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!r) return bad(res, 'Request not found', 404);
    if (r.status !== 'pending') return bad(res, 'Only pending requests can be cancelled');
    const { error: e } = await supabaseAdmin
      .from('service_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', r.id);
    if (e) throw e;
    const [updated] = await selectRequests((f) => supabaseAdmin.from('service_requests').select(f).eq('id', r.id));
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    fail(res, error, 'Failed to cancel request');
  }
});

// ============================================================
// MESSAGES (thread on each service request: customer <-> provider)
// ============================================================

/** Load a request the user is part of (as customer or as the service provider). */
async function requestForParticipant(requestId, userId) {
  const { data, error } = await supabaseAdmin
    .from('service_requests')
    .select('id, customer_id, status, services ( id, title, provider_id )')
    .eq('id', requestId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const providerId = data.services?.provider_id;
  if (data.customer_id !== userId && providerId !== userId) return null;
  return { ...data, providerId, role: data.customer_id === userId ? 'customer' : 'provider' };
}

const toMessage = (m, userId) => ({
  id: m.id,
  body: m.body,
  senderId: m.sender_id,
  mine: m.sender_id === userId,
  readAt: m.read_at,
  createdAt: m.created_at,
});

/** GET /api/services/threads — every request thread I'm part of, newest activity first */
router.get('/threads', protect, async (req, res) => {
  try {
    const uid = req.user.id;
    const { data: myServices } = await supabaseAdmin.from('services').select('id').eq('provider_id', uid);
    const serviceIds = (myServices || []).map((x) => x.id);

    const requests = await selectRequests((f) => {
      let q = supabaseAdmin.from('service_requests').select(f);
      q = serviceIds.length
        ? q.or(`customer_id.eq.${uid},service_id.in.(${serviceIds.join(',')})`)
        : q.eq('customer_id', uid);
      return q.order('updated_at', { ascending: false });
    });
    if (!requests.length) return res.status(200).json({ status: 'success', data: { threads: [] } });

    const { data: msgs, error } = await supabaseAdmin
      .from('service_request_messages')
      .select('id, request_id, sender_id, body, read_at, created_at')
      .in('request_id', requests.map((r) => r.id))
      .order('created_at', { ascending: false });
    if (error) throw error;

    // provider display names for the customer's side
    const providerIds = [...new Set(requests.map((r) => r.service?.providerId).filter(Boolean))];
    const names = new Map();
    if (providerIds.length) {
      const { data: users } = await supabaseAdmin.from('users').select('id, full_name, avatar_url').in('id', providerIds);
      (users || []).forEach((u) => names.set(u.id, { name: u.full_name, avatar: u.avatar_url }));
      const { data: agencies } = await supabaseAdmin.from('agencies').select('user_id, company_name').in('user_id', providerIds);
      (agencies || []).forEach((a) => names.set(a.user_id, { ...(names.get(a.user_id) || {}), name: a.company_name }));
    }

    const threads = requests.map((r) => {
      const mine = (msgs || []).filter((m) => m.request_id === r.id);
      const last = mine[0] || null;
      const iAmProvider = r.service?.providerId === uid;
      const other = iAmProvider
        ? { name: r.customer?.name || 'Customer', avatar: r.customer?.avatar || null, role: 'customer' }
        : { name: names.get(r.service?.providerId)?.name || 'Provider', avatar: names.get(r.service?.providerId)?.avatar || null, role: 'provider' };
      return {
        requestId: r.id,
        status: r.status,
        service: r.service,
        me: iAmProvider ? 'provider' : 'customer',
        other,
        lastMessage: last ? toMessage(last, uid) : null,
        unread: mine.filter((m) => m.sender_id !== uid && !m.read_at).length,
        // the original request message is the conversation opener
        opener: { body: r.message, createdAt: r.createdAt, fromCustomer: true },
        updatedAt: last?.created_at || r.updatedAt || r.createdAt,
      };
    });
    threads.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.status(200).json({ status: 'success', data: { threads } });
  } catch (error) {
    fail(res, error, 'Failed to load conversations');
  }
});

/** GET /api/services/requests/:requestId/messages — marks the other side's messages read */
router.get('/requests/:requestId/messages', protect, async (req, res) => {
  try {
    const r = await requestForParticipant(req.params.requestId, req.user.id);
    if (!r) return bad(res, 'Conversation not found', 404);
    const { data, error } = await supabaseAdmin
      .from('service_request_messages')
      .select('id, sender_id, body, read_at, created_at')
      .eq('request_id', r.id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    await supabaseAdmin
      .from('service_request_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('request_id', r.id)
      .neq('sender_id', req.user.id)
      .is('read_at', null);
    res.status(200).json({
      status: 'success',
      data: { messages: (data || []).map((m) => toMessage(m, req.user.id)), role: r.role, requestStatus: r.status },
    });
  } catch (error) {
    fail(res, error, 'Failed to load messages');
  }
});

/** POST /api/services/requests/:requestId/messages { body } */
router.post('/requests/:requestId/messages', protect, async (req, res) => {
  try {
    const body = String(req.body?.body || '').trim();
    if (!body) return bad(res, 'Message cannot be empty');
    if (body.length > 4000) return bad(res, 'Message is too long');
    const r = await requestForParticipant(req.params.requestId, req.user.id);
    if (!r) return bad(res, 'Conversation not found', 404);
    if (['declined', 'cancelled'].includes(r.status)) return bad(res, 'This request is closed');
    const { data, error } = await supabaseAdmin
      .from('service_request_messages')
      .insert([{ request_id: r.id, sender_id: req.user.id, body }])
      .select('id, sender_id, body, read_at, created_at')
      .single();
    if (error) throw error;
    await supabaseAdmin.from('service_requests').update({ updated_at: new Date().toISOString() }).eq('id', r.id);
    res.status(201).json({ status: 'success', data: toMessage(data, req.user.id) });
  } catch (error) {
    fail(res, error, 'Failed to send message');
  }
});

// ============================================================
// PROVIDER
// ============================================================

function readServiceBody(body, partial = false) {
  const out = {};
  const errors = [];
  if (!partial || body.title !== undefined) {
    const title = String(body.title || '').trim();
    if (title.length < 3) errors.push('Title must be at least 3 characters');
    out.title = title;
  }
  if (body.description !== undefined) out.description = String(body.description).trim() || null;
  if (!partial || body.category !== undefined) {
    out.category = CATEGORY_SLUGS.includes(body.category) ? body.category : 'other';
  }
  if (!partial || body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) errors.push('A valid price is required');
    out.price = price;
  }
  if (body.priceType !== undefined) {
    out.price_type = PRICE_TYPES.includes(body.priceType) ? body.priceType : 'fixed';
  }
  if (body.currency !== undefined) out.currency = String(body.currency || 'ngn').toLowerCase().slice(0, 8);
  if (body.deliveryTime !== undefined) out.delivery_time = String(body.deliveryTime).trim() || null;
  if (body.location !== undefined) out.location = String(body.location).trim() || null;
  if (body.isActive !== undefined) out.is_active = body.isActive === true || body.isActive === 'true';
  return { values: out, error: errors[0] || null };
}

/** GET /api/services/provider/mine */
router.get('/provider/mine', providerOnly, async (req, res) => {
  try {
    const { services } = await selectServices((f) =>
      supabaseAdmin.from('services').select(f).eq('provider_id', req.user.id).order('created_at', { ascending: false })
    );
    res.status(200).json({ status: 'success', data: { services } });
  } catch (error) {
    fail(res, error, 'Failed to load your services');
  }
});

async function getOwnedService(id, userId) {
  const { services } = await selectServices((f) =>
    supabaseAdmin.from('services').select(f).eq('id', id).eq('provider_id', userId)
  );
  return services[0] || null;
}

/** POST /api/services/provider/mine  (multipart or JSON) */
router.post('/provider/mine', providerOnly, acceptImage, async (req, res) => {
  try {
    const { values, error } = readServiceBody(req.body || {});
    if (error) return bad(res, error);
    const { data, error: e } = await supabaseAdmin
      .from('services')
      .insert([{ ...values, provider_id: req.user.id }])
      .select('id')
      .single();
    if (e) throw e;
    if (req.file) {
      const url = await uploadPublicImage('service-images', data.id, req.file);
      await supabaseAdmin.from('services').update({ image_url: url }).eq('id', data.id);
    }
    res.status(201).json({ status: 'success', data: await getOwnedService(data.id, req.user.id) });
  } catch (error) {
    fail(res, error, 'Failed to create service');
  }
});

/** PUT /api/services/provider/mine/:id */
router.put('/provider/mine/:id', providerOnly, acceptImage, async (req, res) => {
  try {
    const existing = await getOwnedService(req.params.id, req.user.id);
    if (!existing) return bad(res, 'Service not found', 404);
    const { values, error } = readServiceBody(req.body || {}, true);
    if (error) return bad(res, error);
    if (req.file) values.image_url = await uploadPublicImage('service-images', existing.id, req.file);
    values.updated_at = new Date().toISOString();
    const { error: e } = await supabaseAdmin.from('services').update(values).eq('id', existing.id);
    if (e) throw e;
    res.status(200).json({ status: 'success', data: await getOwnedService(existing.id, req.user.id) });
  } catch (error) {
    fail(res, error, 'Failed to update service');
  }
});

/** DELETE /api/services/provider/mine/:id */
router.delete('/provider/mine/:id', providerOnly, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', req.params.id)
      .eq('provider_id', req.user.id);
    if (error) throw error;
    res.status(200).json({ status: 'success' });
  } catch (error) {
    fail(res, error, 'Failed to delete service');
  }
});

/** GET /api/services/provider/requests — requests for my services */
router.get('/provider/requests', providerOnly, async (req, res) => {
  try {
    const { data: mine, error } = await supabaseAdmin.from('services').select('id').eq('provider_id', req.user.id);
    if (error) throw error;
    const ids = (mine || []).map((s) => s.id);
    const requests = ids.length
      ? await selectRequests((f) =>
          supabaseAdmin.from('service_requests').select(f).in('service_id', ids).order('created_at', { ascending: false })
        )
      : [];
    res.status(200).json({ status: 'success', data: { requests } });
  } catch (error) {
    fail(res, error, 'Failed to load requests');
  }
});

const PROVIDER_TRANSITIONS = {
  pending: ['accepted', 'declined'],
  accepted: ['completed', 'declined'],
};

/** PATCH /api/services/provider/requests/:requestId  { status, providerNote? } */
router.patch('/provider/requests/:requestId', providerOnly, async (req, res) => {
  try {
    const { status, providerNote } = req.body || {};
    const { data: r, error } = await supabaseAdmin
      .from('service_requests')
      .select('id, status, services!inner ( provider_id )')
      .eq('id', req.params.requestId)
      .eq('services.provider_id', req.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!r) return bad(res, 'Request not found', 404);
    if (!(PROVIDER_TRANSITIONS[r.status] || []).includes(status)) {
      return bad(res, `Can't change a request from "${r.status}" to "${status}"`);
    }
    const updates = { status, updated_at: new Date().toISOString() };
    if (providerNote !== undefined) updates.provider_note = String(providerNote).trim().slice(0, 1000) || null;
    const { error: e } = await supabaseAdmin.from('service_requests').update(updates).eq('id', r.id);
    if (e) throw e;
    const [updated] = await selectRequests((f) => supabaseAdmin.from('service_requests').select(f).eq('id', r.id));
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    fail(res, error, 'Failed to update request');
  }
});

// ============================================================
// PUBLIC
// ============================================================

/** GET /api/services/categories — all categories with active-service counts */
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('services').select('category').eq('is_active', true);
    if (error) throw error;
    const counts = {};
    (data || []).forEach((r) => (counts[r.category] = (counts[r.category] || 0) + 1));
    res.status(200).json({
      status: 'success',
      data: { categories: CATEGORIES.map((c) => ({ ...c, count: counts[c.slug] || 0 })) },
    });
  } catch (error) {
    fail(res, error, 'Failed to load categories');
  }
});

/** GET /api/services?search=&category=&sort=newest|price_asc|price_desc|popular|rating&page=&limit= */
router.get('/', async (req, res) => {
  try {
    const { search, category, sort = 'newest', provider } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || 24));
    const order = {
      newest: ['created_at', false],
      price_asc: ['price', true],
      price_desc: ['price', false],
      popular: ['total_requests', false],
      rating: ['rating', false],
    }[sort] || ['created_at', false];

    const { services, count } = await selectServices((f) => {
      let q = supabaseAdmin.from('services').select(f, { count: 'exact' }).eq('is_active', true);
      if (search) q = q.ilike('title', `%${String(search).trim()}%`);
      if (category && CATEGORY_SLUGS.includes(category)) q = q.eq('category', category);
      if (provider && UUID_RE.test(provider)) q = q.eq('provider_id', provider);
      return q.order(order[0], { ascending: order[1] }).range((page - 1) * limit, page * limit - 1);
    });
    res.status(200).json({
      status: 'success',
      data: { services, total: count || 0, page, pages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    fail(res, error, 'Failed to load services');
  }
});

/** GET /api/services/:id */
router.get('/:id', async (req, res) => {
  try {
    if (!UUID_RE.test(req.params.id)) return bad(res, 'Service not found', 404);
    const { services } = await selectServices((f) =>
      supabaseAdmin.from('services').select(f).eq('id', req.params.id).eq('is_active', true)
    );
    if (!services.length) return bad(res, 'Service not found', 404);
    res.status(200).json({ status: 'success', data: { service: services[0] } });
  } catch (error) {
    fail(res, error, 'Failed to load service');
  }
});

/** POST /api/services/:id/requests  { message, budget?, preferredDate?, contactPhone? } */
router.post('/:id/requests', protect, async (req, res) => {
  try {
    const { message, budget, preferredDate, contactPhone } = req.body || {};
    if (String(message || '').trim().length < 10) return bad(res, 'Please describe what you need (at least 10 characters)');
    if (budget !== undefined && budget !== '' && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) {
      return bad(res, 'Budget must be a positive number');
    }
    const { data: service, error } = await supabaseAdmin
      .from('services')
      .select('id, provider_id, is_active, total_requests')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!service || !service.is_active) return bad(res, 'Service not found', 404);
    if (service.provider_id === req.user.id) return bad(res, "You can't request your own service");

    const { data, error: e } = await supabaseAdmin
      .from('service_requests')
      .insert([
        {
          service_id: service.id,
          customer_id: req.user.id,
          message: String(message).trim().slice(0, 3000),
          budget: budget === undefined || budget === '' ? null : Number(budget),
          preferred_date: preferredDate || null,
          contact_phone: String(contactPhone || '').trim() || null,
        },
      ])
      .select('id')
      .single();
    if (e) throw e;
    await supabaseAdmin
      .from('services')
      .update({ total_requests: (service.total_requests || 0) + 1 })
      .eq('id', service.id);
    const [created] = await selectRequests((f) => supabaseAdmin.from('service_requests').select(f).eq('id', data.id));
    res.status(201).json({ status: 'success', data: created });
  } catch (error) {
    fail(res, error, 'Failed to send request');
  }
});

module.exports = router;
