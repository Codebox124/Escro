const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Escrow routes - To be implemented' });
});

module.exports = router;
