const mongoose = require('mongoose');

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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
  slug: { type: String, unique: true, sparse: true },
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
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Geospatial index
establishmentSchema.index({ location: '2dsphere' });
establishmentSchema.index({ category: 1 });
establishmentSchema.index({ isActive: 1 });
establishmentSchema.index({ isSponsored: 1 });
establishmentSchema.index({ name: 'text', description: 'text' });

// Generate unique slug on save
establishmentSchema.pre('save', async function () {
  if (!this.isModified('name') && this.slug) return;
  const base = generateSlug(this.name);
  let slug = base;
  let i = 1;
  while (await mongoose.model('Establishment').exists({ slug, _id: { $ne: this._id } })) {
    slug = `${base}-${i++}`;
  }
  this.slug = slug;
});

// Auto-expire sponsorship
establishmentSchema.pre('find', function () {
  this.where({ isActive: true });
});

module.exports = mongoose.model('Establishment', establishmentSchema);
