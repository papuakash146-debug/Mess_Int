const Item = require('../models/item');
const Usage = require('../models/usage');

// Helper function to format quantity nicely (used in both summary and report)
function formatQuantity(quantity, unit) {
  let displayQty = quantity;
  let displayUnit = unit;

  // Auto-convert to larger unit when it makes sense
  if (unit === 'g' && quantity >= 1000) {
    displayQty = quantity / 1000;
    displayUnit = 'kg';
  } else if (unit === 'ml' && quantity >= 1000) {
    displayQty = quantity / 1000;
    displayUnit = 'L';
  }
  // You can add more conversions here (e.g. 'piece' → 'dozen' if >=12)

  // Format number: no decimal if whole, max 2 decimals otherwise
  const formattedQty =
    Number.isInteger(displayQty) || displayQty % 1 === 0
      ? displayQty.toFixed(0)
      : displayQty.toFixed(2);

  return `${formattedQty} ${displayUnit}`;
}

exports.addItem = async (req, res) => {
  try {
    let { name, totalQuantity, unit } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Item name is required' });
    }

    if (!totalQuantity || totalQuantity <= 0) {
      return res.status(400).json({ error: 'Total quantity must be positive' });
    }

    if (!unit) unit = 'g'; // fallback

    // Convert input to base unit (grams or ml)
    let baseQuantity = totalQuantity;
    if (unit === 'kg') baseQuantity = totalQuantity * 1000;
    else if (unit === 'L') baseQuantity = totalQuantity * 1000;
    // Add more conversions here when you expand units (e.g. dozen → ×12)

    const item = new Item({
      name: name.trim(),
      totalQuantity: baseQuantity,
      unit,
    });

    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getStockSummary = async (req, res) => {
  try {
    const items = await Item.find().sort({ name: 1 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const summaries = await Promise.all(
      items.map(async (item) => {
        const todayUsage = await Usage.aggregate([
          {
            $match: {
              item: item._id,
              date: { $gte: today, $lt: tomorrow },
            },
          },
          { $group: { _id: null, totalUsed: { $sum: '$usedQuantity' } } },
        ]);

        const todayUsedBase = todayUsage.length ? todayUsage[0].totalUsed : 0;
        const remainingBase = item.totalQuantity - todayUsedBase;

        return {
          name: item.name,
          totalQuantity: formatQuantity(item.totalQuantity, item.unit),
          todayUsed: formatQuantity(todayUsedBase, item.unit),
          remaining: formatQuantity(remainingBase, item.unit),
          unit: item.unit, // useful for frontend if you want to re-format
          baseTotal: item.totalQuantity, // optional - for debugging
        };
      })
    );

    res.json(summaries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stock summary' });
  }
};

exports.getThirtyDaysReport = async (req, res) => {
  try {
    const items = await Item.find().sort({ name: 1 });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const reports = await Promise.all(
      items.map(async (item) => {
        const last30Usage = await Usage.aggregate([
          {
            $match: {
              item: item._id,
              date: { $gte: thirtyDaysAgo },
            },
          },
          { $group: { _id: null, totalUsed: { $sum: '$usedQuantity' } } },
        ]);

        const used30Base = last30Usage.length ? last30Usage[0].totalUsed : 0;
        const remainingBase = item.totalQuantity - used30Base;

        return {
          name: item.name,
          totalQuantity: formatQuantity(item.totalQuantity, item.unit),
          totalUsed30: formatQuantity(used30Base, item.unit),
          remaining: formatQuantity(remainingBase, item.unit),
          unit: item.unit,
          baseTotal: item.totalQuantity, // optional
        };
      })
    );

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate 30-day report' });
  }
};