// services/shop.js
// Public marketplace (no login needed) + buyer cart/checkout/orders.
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
 * Product shape:
 * { id, name, slug, description, price, comparePrice, stock, inStock, rating, reviews, sales,
 *   image, images[], category: {id,name,slug}|null,
 *   store: { id, name, slug, logo, verified, currency }, createdAt }
 */
export const shopService = {
  /** params: { search, category (slug), store (id), sort: newest|price_asc|price_desc|popular|rating,
   *  minPrice, maxPrice, inStock, page, limit } → { products, total, page, pages } */
  getProducts: (params = {}) => unwrap(api.get('/shop/products', { params })),
  /** id or slug → { product, related[] } */
  getProduct: (id) => unwrap(api.get(`/shop/products/${id}`)),
  /** → { categories: [{ id, name, slug, count }] } */
  getCategories: () => unwrap(api.get('/shop/categories')),
  /** → { stores: [{ id, name, slug, description, tagline, logo, banner, verified, rating, reviews, currency, productCount, createdAt }] } */
  getStores: (params = {}) => unwrap(api.get('/shop/stores', { params })),
  /** id or slug → { store } (use getProducts({ store: id }) for its products) */
  getStore: (id) => unwrap(api.get(`/shop/stores/${id}`)),
};

/**
 * Cart: { items: [{ id, productId, quantity, product, lineTotal, available }], count }
 * Order: { id, orderNumber, status, store:{id,name,slug,logo}, items:[{id,productId,name,image,quantity,price,total}],
 *   subtotal, shippingFee, tax, total, shipping:{name,phone,address,city,state,zip,country}, trackingNumber, notes,
 *   escrow:{status:'held'|'released'|'refunded'|'disputed', amount, heldAt, releasedAt, refundedAt}|null,
 *   dispute:{id,reason,details,status,createdAt}|null, can:{confirm,cancel,dispute}, createdAt, updatedAt }
 */
export const buyerService = {
  getCart: () => unwrap(api.get('/customer/cart')),
  addToCart: (productId, quantity = 1) => unwrap(api.post('/customer/cart', { productId, quantity })),
  /** quantity 0 removes */
  updateCartItem: (productId, quantity) => unwrap(api.patch(`/customer/cart/${productId}`, { quantity })),
  removeFromCart: (productId) => unwrap(api.delete(`/customer/cart/${productId}`)),
  clearCart: () => unwrap(api.delete('/customer/cart')),

  /** → { addresses: [{ id, label, fullName, phone, address, city, state, zip, country, isDefault }] } */
  getAddresses: () => unwrap(api.get('/customer/addresses')),
  addAddress: (address) => unwrap(api.post('/customer/addresses', address)),
  deleteAddress: (id) => unwrap(api.delete(`/customer/addresses/${id}`)),

  /** → { stores:[{ store, items, subtotal, shipping, tax, total }], itemCount, subtotal, shipping, tax, total, unavailable[] } */
  getCheckoutSummary: () => unwrap(api.get('/customer/checkout/summary')),
  /** payload: { addressId } or { address, saveAddress }, plus notes → { orders, testMode } */
  checkout: (payload) => unwrap(api.post('/customer/checkout', payload)),

  /** → { orders, stats: { total, active, completed, cancelled, inEscrow } } */
  getOrders: () => unwrap(api.get('/customer/orders')),
  getOrder: (id) => unwrap(api.get(`/customer/orders/${id}`)),
  confirmDelivery: (id) => unwrap(api.post(`/customer/orders/${id}/confirm`)),
  cancelOrder: (id) => unwrap(api.post(`/customer/orders/${id}/cancel`)),
  /** reason: not_received | not_as_described | damaged | wrong_item | other */
  openDispute: (id, reason, details) => unwrap(api.post(`/customer/orders/${id}/dispute`, { reason, details })),
};

/**
 * Services marketplace.
 * Service: { id, title, description, category:{slug,name}, price, priceType:'fixed'|'starting_at'|'hourly',
 *   currency, deliveryTime, location, image, isActive, rating, reviews, requests,
 *   provider:{ id, name, avatar, type, verified }, createdAt, updatedAt }
 * ServiceRequest: { id, status:'pending'|'accepted'|'declined'|'completed'|'cancelled', message, budget,
 *   preferredDate, contactPhone, providerNote,
 *   service:{ id, title, price, priceType, currency, image, providerId, providerName? },
 *   customer:{ id, name, email, phone, avatar }|null, createdAt, updatedAt }
 * Errors throw { message }; a message mentioning 004_services.sql means the DB migration hasn't run.
 */
export const servicesService = {
  /** params: { search, category (slug), sort: newest|price_asc|price_desc|popular|rating, provider, page, limit }
   *  → { services, total, page, pages } */
  list: (params = {}) => unwrap(api.get('/services', { params })),
  /** → { categories: [{ slug, name, count }] } */
  categories: () => unwrap(api.get('/services/categories')),
  /** → { service } */
  get: (id) => unwrap(api.get(`/services/${id}`)),

  // customer
  /** { message (min 10 chars), budget?, preferredDate? (YYYY-MM-DD), contactPhone? } → ServiceRequest */
  request: (serviceId, payload) => unwrap(api.post(`/services/${serviceId}/requests`, payload)),
  /** → { requests } */
  myRequests: () => unwrap(api.get('/services/requests/mine')),
  cancelRequest: (requestId) => unwrap(api.post(`/services/requests/${requestId}/cancel`)),

  // provider (agency / seller)
  /** → { services } */
  mine: () => unwrap(api.get('/services/provider/mine')),
  /** FormData or object: { title, description, category, price, priceType, currency, deliveryTime, location, isActive, image(File) } */
  create: (data) =>
    unwrap(api.post('/services/provider/mine', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})),
  update: (id, data) =>
    unwrap(api.put(`/services/provider/mine/${id}`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {})),
  remove: (id) => unwrap(api.delete(`/services/provider/mine/${id}`)),
  /** → { requests } */
  incomingRequests: () => unwrap(api.get('/services/provider/requests')),
  /** status: accepted | declined | completed */
  respond: (requestId, status, providerNote) =>
    unwrap(api.patch(`/services/provider/requests/${requestId}`, { status, providerNote })),
};
