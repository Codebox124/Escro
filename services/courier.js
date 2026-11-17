// services/courier.js
// Courier app API (/api/couriers). Errors throw { message }.
import api from './api';

const unwrap = async (promise) => {
  try {
    const response = await promise;
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Delivery: {
 *   id, status: 'pending'|'assigned'|'picked_up'|'in_transit'|'delivered'|'failed',
 *   fee, distanceKm|null, estimatedMinutes|null,
 *   order: { id, orderNumber, status, total, trackingNumber, notes, itemCount, items:[{name, quantity}] },
 *   pickup:  { name, logo, address, phone },          // seller/store
 *   dropoff: { name, phone, address, area },           // buyer — name/phone/address are null on open jobs (area only)
 *   pickedUpAt, deliveredAt, createdAt, updatedAt,
 *   // maps (migration 008): pickup.coords / dropoff.coords = { lat, lng, approximate? } | null
 *   // (drop-off is rounded to ~1 km on open jobs), toPickupKm / toPickupMinutes from the courier }
 *
 * Lifecycle: open job (pending) → accept → assigned → picked_up → in_transit → delivered (or failed).
 * An assigned job can be released back before pickup. Picking up marks the order "shipped";
 * delivering marks it "delivered" and credits the fee to the courier. The buyer then confirms receipt.
 */
export const courierApi = {
  /** → { id, name, email, phone, avatar, vehicleType, licenseNumber, isAvailable, isVerified, rating,
   *      totalDeliveries, earningsTotal, memberSince } */
  me: () => unwrap(api.get('/couriers/me')),
  /** { isAvailable?, vehicleType?, licenseNumber?, fullName?, phone? } → profile */
  updateMe: (data) => unwrap(api.patch('/couriers/me', data)),

  /** → { isAvailable, availableJobs, activeDeliveries, completedToday, completedYesterday,
   *      earningsToday, earningsYesterday, totalDeliveries, earningsTotal, rating } */
  dashboard: () => unwrap(api.get('/couriers/dashboard')),

  /** Open jobs, nearest first when a position is known → { jobs: Delivery[], from:{lat,lng}|null }.
   *  Pass the courier's current { lat, lng } if you have it. */
  jobs: (pos) => unwrap(api.get('/couriers/jobs', { params: pos ? { lat: pos.lat, lng: pos.lng } : {} })),
  /** Report the courier's live position (call every ~30s while online). 409 until migration 008 is run. */
  updateLocation: (lat, lng) => unwrap(api.patch('/couriers/me/location', { lat, lng })),
  /** → Delivery (now assigned to me). 409 "just taken" if someone else got it first. */
  accept: (id) => unwrap(api.post(`/couriers/jobs/${id}/accept`)),

  /** scope: active | completed | all → { deliveries: Delivery[] } */
  deliveries: (scope = 'all') => unwrap(api.get('/couriers/deliveries', { params: { scope } })),
  /** status: picked_up | in_transit | delivered | failed → Delivery */
  updateStatus: (id, status) => unwrap(api.patch(`/couriers/deliveries/${id}/status`, { status })),
  /** give an assigned (not yet picked up) job back */
  release: (id) => unwrap(api.post(`/couriers/deliveries/${id}/release`)),

  /** → { total, today, week, month, deliveries:{today,week,month,total}, averagePerDelivery,
   *      chart:[{label, date, amount, deliveries}] (last 7 days), transactions:[{id, amount, orderNumber, store, date}],
   *      payoutsEnabled:false } */
  earnings: () => unwrap(api.get('/couriers/earnings')),
};
