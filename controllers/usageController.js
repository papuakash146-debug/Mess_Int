const Usage = require('../models/usage');

exports.addUsage = async (req, res) => {
  try {
    const { itemId, usedQuantity } = req.body;
    const usage = new Usage({ item: itemId, usedQuantity });
    await usage.save();
    res.status(201).json(usage);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};