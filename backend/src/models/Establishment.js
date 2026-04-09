const mongoose = require('mongoose');

const businessHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true,
  },
  open: { type: String, default: '08:00' },
  close: { type: String, default: '18:00' },
  closed: { type: Boolean, default: false },
}, { _id: false });

const establishmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 200,
  },
  description: { type: String, maxlength: 1000 },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['supermarket', 'pharmacy', 'bakery', 'butcher', 'restaurant', 'convenience', 'petshop', 'electronics', 'clothing', 'other'],
  },
  address: {
    street: { type: String, required: true },
    number: { type: String },
    neighborhood: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String },
    formatted: { type: String },
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  phone: { type: String },
  logo: { type: String },
  coverImage: { type: String },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  businessHours: [businessHoursSchema],
  isSponsored: { type: Boolean, default: false },
  sponsoredUntil: { type: Date },
  sponsoredBoostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Boost' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Geospatial index
establishmentSchema.index({ location: '2dsphere' });
establishmentSchema.index({ category: 1 });
establishmentSchema.index({ isActive: 1 });
establishmentSchema.index({ isSponsored: 1 });
establishmentSchema.index({ name: 'text', description: 'text' });

// Auto-expire sponsorship
establishmentSchema.pre('find', function () {
  this.where({ isActive: true });
});

module.exports = mongoose.model('Establishment', establishmentSchema);
