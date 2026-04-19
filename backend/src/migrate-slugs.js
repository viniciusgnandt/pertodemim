require('dotenv').config();
const mongoose = require('mongoose');
const Establishment = require('./models/Establishment');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const establishments = await Establishment.find({}).setOptions({ bypassDocumentMiddleware: false });
  let updated = 0;
  for (const est of establishments) {
    if (!est.slug) {
      await est.save(); // triggers pre('save') slug generation
      updated++;
      console.log(`  slug gerado: ${est.name} → ${est.slug}`);
    }
  }
  console.log(`\nMigração concluída: ${updated} slugs gerados.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
