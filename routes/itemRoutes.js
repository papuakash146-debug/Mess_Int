const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ name: 1 }); // optional: sort alphabetically
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/', itemController.addItem);
router.get('/summary', itemController.getStockSummary);
router.get('/report', itemController.getThirtyDaysReport);

module.exports = router;