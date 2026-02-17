const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  totalQuantity: { type: Number, required: true, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);