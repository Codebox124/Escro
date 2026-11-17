// backend/routes/seller.routes.js
// SIMPLIFIED VERSION - For quick testing without full auth setup

const express = require('express');
const router = express.Router();

// OPTION 1: Use auth middleware (recommended for production)
// Uncomment these lines when auth middleware is working:
// const { protect, restrictTo } = require('../middleware/auth');
// router.use(protect);
// router.use(restrictTo('seller'));

// OPTION 2: Simple token check (temporary for testing)
// This just checks if a token exists, doesn't validate it fully
const simpleAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Not authorized'
        });
    }
    // For testing, just set a dummy user
    req.user = { id: 'test-seller-123', role: 'seller', name: 'Test Seller' };
    next();
};

// Apply simple auth to all routes (comment this out if you want no auth during testing)
// Real, database-backed product management (with image upload).
// Registered before the testing stubs below so it handles /products itself.
router.use('/products', require('./seller.products.routes'));
router.use('/profile', require('./seller.profile.routes'));
router.use(require('./seller.store.routes')); // dashboard stats, orders, payment/shipping settings

router.use(simpleAuth);

/**
 * @route   GET /api/seller/store
 * @desc    Get seller's store information
 * @access  Private (Seller only)
 */
router.get('/store', async (req, res) => {
    try {
        const sellerId = req.user?.id || 'default-seller';

        console.log('Fetching store info for seller:', sellerId);

        // TODO: Replace with actual database query
        // const Store = require('../models/Store');
        // const store = await Store.findOne({ seller: sellerId });
        // 
        // if (!store) {
        //   return res.status(404).json({
        //     status: 'error',
        //     message: 'Store not found'
        //   });
        // }

        // Sample data
        const store = {
            id: sellerId,
            name: (req.user?.name || 'Default') + "'s Store",
            description: 'Quality products at great prices',
            logo: '/images/store-logo.jpg',
            banner: '/images/store-banner.jpg',
            address: '123 Main St, City, State 12345',
            phone: '+1 234 567 8900',
            email: req.user?.email || 'store@example.com'
        };

        res.status(200).json({
            status: 'success',
            data: store
        });
    } catch (error) {
        console.error('Error fetching store:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch store information'
        });
    }
});

/**
 * @route   PUT /api/seller/store
 * @desc    Update seller's store information
 * @access  Private (Seller only)
 */
router.put('/store', async (req, res) => {
    try {
        const sellerId = req.user?.id || 'default-seller';
        const updateData = req.body;

        console.log('Updating store for seller:', sellerId);

        // TODO: Replace with actual database update
        // const Store = require('../models/Store');
        // const store = await Store.findOneAndUpdate(
        //   { seller: sellerId },
        //   updateData,
        //   { new: true, runValidators: true }
        // );

        // Sample response
        const updatedStore = {
            id: sellerId,
            ...updateData
        };

        res.status(200).json({
            status: 'success',
            data: updatedStore
        });
    } catch (error) {
        console.error('Error updating store:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update store information'
        });
    }
});

/**
 * @route   GET /api/seller/revenue
 * @desc    Get seller's revenue analytics
 * @access  Private (Seller only)
 */
router.get('/revenue', async (req, res) => {
    try {
        const sellerId = req.user?.id || 'default-seller';
        const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y

        console.log('Fetching revenue for seller:', sellerId);

        // TODO: Replace with actual database aggregation
        // Calculate revenue based on period

        // Sample data
        const revenue = {
            total: 84290,
            lastMonth: 72150,
            growth: 16.8,
            byCategory: [
                { category: 'Electronics', amount: 35000, percentage: 41.5 },
                { category: 'Clothing', amount: 28000, percentage: 33.2 },
                { category: 'Books', amount: 21290, percentage: 25.3 }
            ],
            timeline: [
                { date: '2024-01-01', amount: 2500 },
                { date: '2024-01-08', amount: 3200 },
                { date: '2024-01-15', amount: 2800 },
                { date: '2024-01-22', amount: 3500 },
                { date: '2024-01-29', amount: 4100 }
            ]
        };

        res.status(200).json({
            status: 'success',
            data: revenue
        });
    } catch (error) {
        console.error('Error fetching revenue:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch revenue data'
        });
    }
});

module.exports = router;