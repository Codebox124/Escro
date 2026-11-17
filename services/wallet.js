// services/wallet.js
// Earnings wallet (/api/wallet) for stores and couriers. Errors throw { message }.
//
// When a buyer confirms delivery (or an admin releases a dispute) the escrowed
// order total is split:
//   Escro commission = commissionRate% of the items subtotal
//   courier          = the delivery fee (only if an Escro courier delivered it)
//   store            = order total − commission − courier fee
import api from './api';

export const walletApi = {
  /**
   * → { available (false until DB migration 007 is run), balance, totalEarned, totalPaidOut,
   *     commissionRate (%), payoutsEnabled:false,
   *     transactions: [{ id, type:'sale'|'delivery'|'commission'|'payout'|'adjustment', amount (+credit/−debit),
   *                      orderId, description, createdAt }] }
   */
  get: async () => {
    try {
      const response = await api.get('/wallet');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

/** Preview how an order's escrow will be split (mirrors backend/utils/wallet.js). */
export function previewSplit({ subtotal = 0, total = 0, courierFee = 0, commissionRate = 5 }) {
  const r2 = (n) => Math.round(Number(n || 0) * 100) / 100;
  const commission = r2((Number(subtotal) * Number(commissionRate)) / 100);
  const courier = r2(courierFee);
  const store = r2(Math.max(0, Number(total) - commission - courier));
  return { commission, courier, store };
}
