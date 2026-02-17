const Item = require('../models/item');
const Usage = require('../models/usage');

// Helper function – formats quantity and chooses appropriate unit
function formatQuantity(quantity, unit) {
  if (quantity == null || isNaN(quantity)) return '0 ' + (unit || 'g');

  let qty = Number(quantity);
  let displayUnit = unit || 'g';

  // Convert to more readable unit when it makes sense
  if (unit === 'g' && qty >= 1000) {
    qty /= 1000;
    displayUnit = 'kg';
  } else if (unit === 'ml' && qty >= 1000) {
    qty /= 1000;
    displayUnit = 'L';
  }
  // You can add more rules here later (piece → dozen, etc.)

  // Format number nicely
  const formattedQty = Number.isInteger(qty)
    ? qty.toString()
    : qty.toFixed(2).replace(/\.?0+$/, ''); // remove trailing zeros

  return `${formattedQty} ${displayUnit}`;
}

exports.addItem = async (req, res) => {
  try {
    let { name, totalQuantity, unit } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    if (!totalQuantity || totalQuantity <= 0) {
      return res.status(400).json({ error: 'Total quantity must be positive' });
    }

    unit = unit || 'g';

    // Convert to base unit
    let baseQuantity = Number(totalQuantity);
    if (unit === 'kg') baseQuantity *= 1000;
    else if (unit === 'L') baseQuantity *= 1000;
    // Add more unit conversions here when needed

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

        const todayUsedBase = todayUsage[0]?.totalUsed || 0;
        const remainingBase = Math.max(0, item.totalQuantity - todayUsedBase);

        return {
          name: item.name,
          totalQuantity: formatQuantity(item.totalQuantity, item.unit),
          todayUsed: formatQuantity(todayUsedBase, item.unit),
          remaining: formatQuantity(remainingBase, item.unit),
        };
      })
    );

    res.json(summaries);
  } catch (err) {
    console.error('Stock summary error:', err);
    res.status(500).json({ error: 'Failed to load stock summary' });
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

        const used30Base = last30Usage[0]?.totalUsed || 0;
        const remainingBase = Math.max(0, item.totalQuantity - used30Base);

        return {
          name: item.name,
          totalQuantity: formatQuantity(item.totalQuantity, item.unit),
          totalUsed30: formatQuantity(used30Base, item.unit),
          remaining: formatQuantity(remainingBase, item.unit),
        };
      })
    );

    res.json(reports);
  } catch (err) {
    console.error('30-day report error:', err);
    res.status(500).json({ error: 'Failed to generate 30-day report' });
  }
};