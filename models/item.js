const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  totalQuantity: { type: Number, required: true, min: 0 },   // now ALWAYS in base unit (g or ml)
  unit: { 
    type: String, 
    required: true, 
    enum: ['g', 'kg', 'ml', 'L', 'piece', 'packet', 'dozen', 'bunch'],  // add more as needed
    default: 'g'
  }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);