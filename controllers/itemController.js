const Item = require('../models/item');
const Usage = require('../models/usage');

exports.addItem = async (req, res) => {
  try {
    const { name, totalQuantity } = req.body;
    const item = new Item({ name, totalQuantity });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getStockSummary = async (req, res) => {
  try {
    const items = await Item.find();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const summaries = await Promise.all(items.map(async (item) => {
      const todayUsage = await Usage.aggregate([
        { $match: { item: item._id, date: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, totalUsed: { $sum: '$usedQuantity' } } }
      ]);
      const todayUsed = todayUsage.length ? todayUsage[0].totalUsed : 0;
      const remaining = item.totalQuantity - todayUsed;
      return { name: item.name, totalQuantity: item.totalQuantity, todayUsed, remaining };
    }));

    res.json(summaries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getThirtyDaysReport = async (req, res) => {
  try {
    const items = await Item.find();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reports = await Promise.all(items.map(async (item) => {
      const last30Usage = await Usage.aggregate([
        { $match: { item: item._id, date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, totalUsed: { $sum: '$usedQuantity' } } }
      ]);
      const totalUsed30 = last30Usage.length ? last30Usage[0].totalUsed : 0;
      const remaining = item.totalQuantity - totalUsed30;
      return { name: item.name, totalQuantity: item.totalQuantity, totalUsed30, remaining };
    }));

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};