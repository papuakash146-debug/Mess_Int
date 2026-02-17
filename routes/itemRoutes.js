const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

router.post('/', itemController.addItem);
router.get('/summary', itemController.getStockSummary);
router.get('/report', itemController.getThirtyDaysReport);

module.exports = router;