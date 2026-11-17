const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrder,
  confirmDelivery,
  cancelOrder
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, createOrder);
router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.post('/:id/confirm', protect, confirmDelivery);
router.post('/:id/cancel', protect, cancelOrder);

module.exports = router;
