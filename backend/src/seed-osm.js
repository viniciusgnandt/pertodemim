require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const Establishment = require('./models/Establishment');
const User = require('./models/User');

// ── Área de busca: Mogi das Cruzes e região ──────────────────────────────────
// Bounding box: sul, oeste, norte, leste
const BBOX = '-23.5700,-46.2500,-23.4500,-46.1000';

// ── Mapeamento OSM → categoria PertoDeMim ────────────────────────────────────
function mapCategory(tags) {
  const shop = tags.shop;
  const amenity = tags.amenity;

  if (shop === 'supermarket' || shop === 'convenience') return shop === 'convenience' ? 'convenience' : 'supermarket';
  if (shop === 'bakery') return 'bakery';
  if (shop === 'butcher') return 'butcher';
  if (shop === 'pet' || shop === 'pet_shop' || shop === 'pets') return 'petshop';
  if (shop === 'electronics' || shop === 'computer' || shop === 'mobile_phone') return 'electronics';
  if (shop === 'clothes' || shop === 'clothing' || shop === 'fashion') return 'clothing';
  if (amenity === 'pharmacy' || shop === 'pharmacy') return 'pharmacy';
  if (amenity === 'restaurant' || amenity === 'fast_food' || amenity === 'food_court') return 'restaurant';
  if (amenity === 'cafe' || shop === 'coffee') return 'restaurant';
  if (amenity === 'bar') return 'restaurant';
  return 'other';
}

// ── Parse horário OSM (ex: "Mo-Fr 08:00-18:00; Sa 08:00-13:00") ─────────────
function parseOsmHours(openingHours) {
  const DEFAULT = [
    { day: 'monday',    open: '08:00', close: '18:00', closed: false },
    { day: 'tuesday',   open: '08:00', close: '18:00', closed: false },
    { day: 'wednesday', open: '08:00', close: '18:00', closed: false },
    { day: 'thursday',  open: '08:00', close: '18:00', closed: false },
    { day: 'friday',    open: '08:00', close: '18:00', closed: false },
    { day: 'saturday',  open: '08:00', close: '13:00', closed: false },
    { day: 'sunday',    open: '08:00', close: '12:00', closed: true  },
  ];

  if (!openingHours) return DEFAULT;

  try {
    const days = { Mo: 'monday', Tu: 'tuesday', We: 'wednesday', Th: 'thursday', Fr: 'friday', Sa: 'saturday', Su: 'sunday' };
    const result = Object.fromEntries(DEFAULT.map(d => [d.day, { ...d }]));

    const rules = openingHours.split(';').map(s => s.trim());
    for (const rule of rules) {
      const match = rule.match(/^([A-Za-z,\-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
      if (!match) continue;
      const [, daysPart, open, close] = match;

      const affectedDays = [];
      const rangeMatch = daysPart.match(/^([A-Z][a-z])-([A-Z][a-z])$/);
      if (rangeMatch) {
        const order = ['Mo','Tu','We','Th','Fr','Sa','Su'];
        const start = order.indexOf(rangeMatch[1]);
        const end = order.indexOf(rangeMatch[2]);
        if (start !== -1 && end !== -1) {
          for (let i = start; i <= end; i++) affectedDays.push(order[i]);
        }
      } else {
        daysPart.split(',').forEach(d => { if (days[d.trim()]) affectedDays.push(d.trim()); });
      }

      for (const osmDay of affectedDays) {
        const fullDay = days[osmDay];
        if (fullDay && result[fullDay]) {
          result[fullDay].open = open;
          result[fullDay].close = close;
          result[fullDay].closed = false;
        }
      }
    }

    return Object.values(result);
  } catch {
    return DEFAULT;
  }
}

// ── Consulta Overpass API ────────────────────────────────────────────────────
function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const body = `data=${encodeURIComponent(query)}`;
    const options = {
      hostname: 'overpass-api.de',
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'PertoDeMim/1.0 (seed script)',
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Failed to parse Overpass response')); }
      });
    });

    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Overpass request timeout')); });
    req.write(body);
    req.end();
  });
}

// ── Script principal ─────────────────────────────────────────────────────────
async function main() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
  });
  console.log('✅ Connected');

  // Garante usuário sistema
  let systemUser = await User.findOne({ email: 'system@pertodemim.app' });
  if (!systemUser) {
    systemUser = await User.create({
      name: 'PertoDeMim Sistema',
      email: 'system@pertodemim.app',
      password: Math.random().toString(36) + Math.random().toString(36),
      role: 'admin',
    });
    console.log('👤 System user created');
  }

  // Remove estabelecimentos existentes (e seus produtos via cascade no seed)
  console.log('🗑️  Removing existing establishments...');
  const deleted = await Establishment.deleteMany({});
  console.log(`   Removed ${deleted.deletedCount} establishments`);

  // Consulta Overpass
  const osmQuery = `
    [out:json][timeout:60];
    (
      node["shop"~"supermarket|convenience|bakery|butcher|pet|pet_shop|pets|electronics|computer|mobile_phone|clothes|clothing|fashion|pharmacy"](${BBOX});
      node["amenity"~"pharmacy|restaurant|fast_food|food_court|cafe|bar"](${BBOX});
      way["shop"~"supermarket|convenience|bakery|butcher|pet|pet_shop|pets|electronics|computer|mobile_phone|clothes|clothing|fashion|pharmacy"](${BBOX});
      way["amenity"~"pharmacy|restaurant|fast_food|food_court|cafe|bar"](${BBOX});
    );
    out center tags;
  `;

  console.log('🌍 Fetching data from Overpass API (OSM)...');
  const result = await fetchOverpass(osmQuery);
  const elements = result.elements || [];
  console.log(`   Found ${elements.length} OSM elements`);

  let inserted = 0;
  let skipped = 0;

  for (const el of elements) {
    const tags = el.tags || {};
    const name = tags.name || tags['name:pt'];
    if (!name) { skipped++; continue; }

    // Coordenadas (node tem lat/lon, way tem center)
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) { skipped++; continue; }

    const category = mapCategory(tags);

    const street = tags['addr:street'] || tags['addr:place'] || 'Endereço não informado';
    const number = tags['addr:housenumber'] || '';
    const neighborhood = tags['addr:suburb'] || tags['addr:neighbourhood'] || '';
    const city = tags['addr:city'] || 'Mogi das Cruzes';
    const state = tags['addr:state'] || 'SP';
    const zipCode = tags['addr:postcode'] || '';

    const formatted = [street, number, neighborhood, city, state].filter(Boolean).join(', ');

    try {
      await Establishment.create({
        name: name.trim(),
        description: tags.description || '',
        category,
        phone: tags.phone || tags['contact:phone'] || '',
        address: { street, number, neighborhood, city, state, zipCode, formatted },
        location: { type: 'Point', coordinates: [lon, lat] },
        businessHours: parseOsmHours(tags.opening_hours),
        ownerId: systemUser._id,
        isActive: true,
      });
      inserted++;
    } catch (err) {
      skipped++;
    }
  }

  console.log(`\n✅ Done! Inserted: ${inserted} | Skipped: ${skipped}`);
  console.log(`📍 Area: Mogi das Cruzes e região (bbox: ${BBOX})`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
