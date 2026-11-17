// services/agency.js
// Agency dashboard API (/api/agencies) + service-request conversations (/api/services/...).
// Errors throw { message }. A message mentioning 005_agency.sql means that DB migration hasn't run.
import api from './api';

const unwrap = async (promise) => {
  try {
    const response = await promise;
    return response.data.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const agencyApi = {
  /** → { id, companyName, contactPerson, registration, serviceAreas[], description, phone, email, address,
   *      website, logo, isVerified, isActive, rating, totalDeliveries, createdAt, extendedProfile } */
  profile: () => unwrap(api.get('/agencies/profile')),
  /** FormData or object with any of: companyName, contactPerson, registration, serviceAreas (array or comma string),
   *  description, phone, email, address, website, logo (File) → profile */
  updateProfile: (data) =>
    unwrap(api.patch('/agencies/profile', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})),

  /** → { agency:{id,name,verified}, services:{total,active},
   *      projects:{ total, pending, active, completed, declined, completedValue, pipelineValue },   // NGN
   *      team: { available:true, total, online, activeDeliveries, deliveredThisWeek, earningsTotal, top: Agent[] } | { available:false },
   *      chart: [{ label:'Jun', requests, completedValue }] (6 months) } */
  overview: () => unwrap(api.get('/agencies/overview')),

  /** Agent: { id (courier id), userId, name, email, phone, avatar, accountActive, vehicleType, licenseNumber,
   *   isOnline, isVerified, rating, totalDeliveries, earningsTotal, activeDeliveries, deliveredThisWeek, failed, joinedAt }
   *  → { agents: Agent[], stats: { total, online, active, deliveredThisWeek, earningsTotal } } */
  agents: () => unwrap(api.get('/agencies/agents')),
  /** add an existing courier account by email → Agent */
  addAgent: (email) => unwrap(api.post('/agencies/agents', { email })),
  removeAgent: (courierId) => unwrap(api.delete(`/agencies/agents/${courierId}`)),
};

/**
 * Conversations on service requests (works for both the provider and the customer).
 * Thread: { requestId, status, service:{ id, title, price, priceType, currency, image, providerId }, me:'provider'|'customer',
 *   other:{ name, avatar, role }, lastMessage: Message|null, unread, opener:{ body, createdAt, fromCustomer:true }, updatedAt }
 * Message: { id, body, senderId, mine, readAt, createdAt }
 */
export const messagesApi = {
  /** → { threads: Thread[] } */
  threads: () => unwrap(api.get('/services/threads')),
  /** → { messages: Message[], role, requestStatus }  (also marks incoming messages read) */
  messages: (requestId) => unwrap(api.get(`/services/requests/${requestId}/messages`)),
  /** → Message. Closed (declined/cancelled) requests reject new messages. */
  send: (requestId, body) => unwrap(api.post(`/services/requests/${requestId}/messages`, { body })),
};
