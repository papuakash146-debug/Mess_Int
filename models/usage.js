const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  usedQuantity: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Usage', usageSchema);