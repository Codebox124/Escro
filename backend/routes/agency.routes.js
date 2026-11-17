// backend/routes/agency.routes.js
// Agency dashboard. Mounted at /api/agencies. Agency login required.
//   GET   /profile            agency profile (created on first use)
//   PATCH /profile            { companyName, contactPerson, registration, serviceAreas[], description, phone, email, address, website } (+ logo file)
//   GET   /overview           services, requests (projects), team stats, charts
//   GET   /agents             courier team with performance
//   POST  /agents             { email } add an existing courier account to the team
//   DELETE /agents/:courierId remove from the team
// Projects = service requests on this agency's services (see /api/services/provider/requests).
// Messages = threads on those requests (see /api/services/requests/:id/messages).

const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { protect, authorize } = require('../middleware/auth.middleware');
const { imageUpload, handleUpload, uploadPublicImage } = require('../utils/storage');

const router = express.Router();
router.use(protect, authorize('agency', 'admin'));

const bad = (res, message, code = 400) => res.status(code).json({ status: 'error', message });
const isMissing = (e) =>
  e && (e.code === '42703' || e.code === 'PGRST204' || e.code === 'PGRST205' || e.code === '42P01');
const fail = (res, error, fallback) => {
  console.error(fallback, error);
  if (isMissing(error)) return bad(res, 'Run backend/database/migrations/005_agency.sql in Supabase first', 409);
  res.status(500).json({ status: 'error', message: error?.message || fallback });
};
const num = (v) => Number(v || 0);

async function getAgency(user) {
  const { data, error } = await supabaseAdmin.from('agencies').select('*').eq('user_id', user.id).limit(1);
  if (error) throw error;
  if (data && data.length) return data[0];
  const { data: created, error: e } = await supabaseAdmin
    .from('agencies')
    .insert([{ user_id: user.id, company_name: user.full_name || 'My Agency', contact_person: user.full_name || null }])
    .select('*')
    .single();
  if (e) throw e;
  return created;
}

function toProfile(a, user) {
  return {
    id: a.id,
    companyName: a.company_name,
    contactPerson: a.contact_person || '',
    registration: a.company_registration || '',
    serviceAreas: a.service_areas || [],
    description: a.description || '',
    phone: a.phone || user?.phone || '',
    email: a.email || user?.email || '',
    address: a.address || '',
    website: a.website || '',
    logo: a.logo_url || null,
    isVerified: a.is_verified,
    isActive: a.is_active,
    rating: num(a.rating),
    totalDeliveries: a.total_deliveries || 0,
    createdAt: a.created_at,
    // false until migration 005 adds the extra profile columns
    extendedProfile: Object.prototype.hasOwnProperty.call(a, 'description'),
  };
}

async function loadUser(id) {
  const { data } = await supabaseAdmin.from('users').select('id, full_name, email, phone, avatar_url').eq('id', id).single();
  return data;
}

// ============================================================
// PROFILE
// ============================================================

router.get('/profile', async (req, res) => {
  try {
    const agency = await getAgency(req.user);
    res.status(200).json({ status: 'success', data: toProfile(agency, await loadUser(req.user.id)) });
  } catch (error) {
    fail(res, error, 'Failed to load agency profile');
  }
});

router.patch('/profile', handleUpload(imageUpload.single('logo')), async (req, res) => {
  try {
    const agency = await getAgency(req.user);
    const b = req.body || {};
    const updates = {};
    if (b.companyName !== undefined) {
      if (!String(b.companyName).trim()) return bad(res, 'Company name cannot be empty');
      updates.company_name = String(b.companyName).trim().slice(0, 255);
    }
    if (b.contactPerson !== undefined) updates.contact_person = String(b.contactPerson).trim() || null;
    if (b.registration !== undefined) updates.company_registration = String(b.registration).trim() || null;
    if (b.serviceAreas !== undefined) {
      const list = Array.isArray(b.serviceAreas) ? b.serviceAreas : String(b.serviceAreas).split(',');
      updates.service_areas = list.map((s) => String(s).trim()).filter(Boolean).slice(0, 50);
    }
    const extended = { description: 'description', phone: 'phone', email: 'email', address: 'address', website: 'website' };
    for (const [key, col] of Object.entries(extended)) {
      if (b[key] !== undefined) updates[col] = String(b[key]).trim() || null;
    }
    if (req.file) updates.logo_url = await uploadPublicImage('profile-images', `agencies/${agency.id}`, req.file);

    if (Object.keys(updates).length) {
      updates.updated_at = new Date().toISOString();
      const { error } = await supabaseAdmin.from('agencies').update(updates).eq('id', agency.id);
      if (error) throw error;
    }
    const fresh = await getAgency(req.user);
    res.status(200).json({ status: 'success', data: toProfile(fresh, await loadUser(req.user.id)) });
  } catch (error) {
    fail(res, error, 'Failed to update agency profile');
  }
});

// ============================================================
// TEAM (couriers)
// ============================================================

const ACTIVE = ['assigned', 'picked_up', 'in_transit'];

async function teamWithStats(agencyId) {
  const { data: couriers, error } = await supabaseAdmin
    .from('couriers')
    .select('id, user_id, vehicle_type, license_number, is_available, is_verified, rating, total_deliveries, earnings_total, created_at, users ( full_name, email, phone, avatar_url, is_active )')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const ids = (couriers || []).map((c) => c.id);
  const deliveries = ids.length
    ? (await supabaseAdmin.from('deliveries').select('courier_id, status, delivery_fee, delivered_at').in('courier_id', ids)).data || []
    : [];
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  return (couriers || []).map((c) => {
    const mine = deliveries.filter((d) => d.courier_id === c.id);
    const delivered = mine.filter((d) => d.status === 'delivered');
    return {
      id: c.id,
      userId: c.user_id,
      name: c.users?.full_name || 'Courier',
      email: c.users?.email || null,
      phone: c.users?.phone || null,
      avatar: c.users?.avatar_url || null,
      accountActive: c.users?.is_active !== false,
      vehicleType: c.vehicle_type || null,
      licenseNumber: c.license_number || null,
      isOnline: !!c.is_available,
      isVerified: !!c.is_verified,
      rating: num(c.rating),
      totalDeliveries: c.total_deliveries || 0,
      earningsTotal: num(c.earnings_total),
      activeDeliveries: mine.filter((d) => ACTIVE.includes(d.status)).length,
      deliveredThisWeek: delivered.filter((d) => d.delivered_at && new Date(d.delivered_at) >= weekAgo).length,
      failed: mine.filter((d) => d.status === 'failed').length,
      joinedAt: c.created_at,
    };
  });
}

router.get('/agents', async (req, res) => {
  try {
    const agency = await getAgency(req.user);
    const agents = await teamWithStats(agency.id);
    res.status(200).json({
      status: 'success',
      data: {
        agents,
        stats: {
          total: agents.length,
          online: agents.filter((a) => a.isOnline).length,
          active: agents.filter((a) => a.activeDeliveries > 0).length,
          deliveredThisWeek: agents.reduce((n, a) => n + a.deliveredThisWeek, 0),
          earningsTotal: agents.reduce((n, a) => n + a.earningsTotal, 0),
        },
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to load agents');
  }
});

/** POST /api/agencies/agents { email } — add an existing courier account to the team */
router.post('/agents', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return bad(res, 'Enter the courier’s account email');
    const agency = await getAgency(req.user);

    const { data: user } = await supabaseAdmin.from('users').select('id, role, full_name').ilike('email', email).maybeSingle();
    if (!user) return bad(res, 'No Escro account uses that email. Ask them to sign up as a courier first.', 404);
    if (user.role !== 'courier') return bad(res, `${user.full_name || 'That account'} is not a courier account`);

    let { data: courier } = await supabaseAdmin.from('couriers').select('id, agency_id').eq('user_id', user.id).maybeSingle();
    if (!courier) {
      const { data: created, error } = await supabaseAdmin
        .from('couriers')
        .insert([{ user_id: user.id, is_available: false }])
        .select('id, agency_id')
        .single();
      if (error) throw error;
      courier = created;
    }
    if (courier.agency_id === agency.id) return bad(res, 'This courier is already on your team');
    if (courier.agency_id) return bad(res, 'This courier already belongs to another agency');

    const { error } = await supabaseAdmin.from('couriers').update({ agency_id: agency.id }).eq('id', courier.id);
    if (error) throw error;
    const agents = await teamWithStats(agency.id);
    res.status(201).json({ status: 'success', data: agents.find((a) => a.id === courier.id) });
  } catch (error) {
    fail(res, error, 'Failed to add courier');
  }
});

router.delete('/agents/:courierId', async (req, res) => {
  try {
    const agency = await getAgency(req.user);
    const { data, error } = await supabaseAdmin
      .from('couriers')
      .update({ agency_id: null })
      .eq('id', req.params.courierId)
      .eq('agency_id', agency.id)
      .select('id');
    if (error) throw error;
    if (!data || !data.length) return bad(res, 'Courier not found on your team', 404);
    res.status(200).json({ status: 'success' });
  } catch (error) {
    fail(res, error, 'Failed to remove courier');
  }
});

// ============================================================
// OVERVIEW
// ============================================================

router.get('/overview', async (req, res) => {
  try {
    const agency = await getAgency(req.user);
    const [{ data: services, error: sErr }, team] = await Promise.all([
      supabaseAdmin.from('services').select('id, title, price, is_active, total_requests').eq('provider_id', req.user.id),
      teamWithStats(agency.id).catch((e) => {
        if (isMissing(e)) return null; // migration 005 not run yet
        throw e;
      }),
    ]);
    if (sErr && !isMissing(sErr)) throw sErr;
    const svc = services || [];
    const ids = svc.map((s) => s.id);
    const { data: requests } = ids.length
      ? await supabaseAdmin
          .from('service_requests')
          .select('id, service_id, status, budget, created_at, updated_at')
          .in('service_id', ids)
      : { data: [] };
    const reqs = requests || [];
    const priceOf = (r) => (r.budget != null ? num(r.budget) : num(svc.find((s) => s.id === r.service_id)?.price));

    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      start.setMonth(start.getMonth() - i);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const rows = reqs.filter((r) => new Date(r.created_at) >= start && new Date(r.created_at) < end);
      months.push({
        label: start.toLocaleDateString('en-US', { month: 'short' }),
        requests: rows.length,
        completedValue: rows.filter((r) => r.status === 'completed').reduce((n, r) => n + priceOf(r), 0),
      });
    }

    const completed = reqs.filter((r) => r.status === 'completed');
    res.status(200).json({
      status: 'success',
      data: {
        agency: { id: agency.id, name: agency.company_name, verified: agency.is_verified },
        services: { total: svc.length, active: svc.filter((s) => s.is_active).length },
        projects: {
          total: reqs.length,
          pending: reqs.filter((r) => r.status === 'pending').length,
          active: reqs.filter((r) => r.status === 'accepted').length,
          completed: completed.length,
          declined: reqs.filter((r) => r.status === 'declined').length,
          completedValue: completed.reduce((n, r) => n + priceOf(r), 0),
          pipelineValue: reqs.filter((r) => ['pending', 'accepted'].includes(r.status)).reduce((n, r) => n + priceOf(r), 0),
        },
        team: team
          ? {
              available: true,
              total: team.length,
              online: team.filter((a) => a.isOnline).length,
              activeDeliveries: team.reduce((n, a) => n + a.activeDeliveries, 0),
              deliveredThisWeek: team.reduce((n, a) => n + a.deliveredThisWeek, 0),
              earningsTotal: team.reduce((n, a) => n + a.earningsTotal, 0),
              top: [...team].sort((a, b) => b.totalDeliveries - a.totalDeliveries).slice(0, 5),
            }
          : { available: false },
        chart: months,
      },
    });
  } catch (error) {
    fail(res, error, 'Failed to load overview');
  }
});

module.exports = router;
