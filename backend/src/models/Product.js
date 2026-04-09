const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 200,
  },
  description: { type: String, maxlength: 500 },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  images: [{ type: String }],
  category: { type: String, maxlength: 100 },
  establishmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Establishment',
    required: true,
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ establishmentId: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
