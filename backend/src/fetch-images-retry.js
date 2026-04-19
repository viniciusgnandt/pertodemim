require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const Establishment = require('./models/Establishment');

const s3 = new S3Client({
  region: process.env.OCI_REGION,
  endpoint: `https://${process.env.OCI_NAMESPACE}.compat.objectstorage.${process.env.OCI_REGION}.oraclecloud.com`,
  credentials: {
    accessKeyId: process.env.OCI_ACCESS_KEY_ID,
    secretAccessKey: process.env.OCI_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

// Logos alternativas (sem Wikipedia)
const KNOWN_LOGOS = {
  "McDonald's":       { logo: 'https://logospng.org/download/mcdonalds/logo-mcdonalds-256.png' },
  'Burger King':      { logo: 'https://logospng.org/download/burger-king/logo-burger-king-256.png' },
  'Droga Raia':       { logo: 'https://logospng.org/download/droga-raia/logo-droga-raia-256.png' },
  'Assaí Atacadista': { logo: 'https://logospng.org/download/assai-atacadista/logo-assai-atacadista-256.png' },
  'Atacadão':         { logo: 'https://logospng.org/download/atacadao/logo-atacadao-256.png' },
  'Shell Select':     { logo: 'https://logospng.org/download/shell/logo-shell-256.png' },
  'Ipiranga':         { logo: 'https://logospng.org/download/ipiranga/logo-ipiranga-256.png' },
  'Dia':              { logo: 'https://logospng.org/download/dia-supermercados/logo-dia-256.png' },
};

// Covers por categoria — URLs alternativas Unsplash com IDs fixos
const CATEGORY_COVERS = {
  supermarket: [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80',
    'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=800&q=80',
  ],
  pharmacy:    ['https://images.unsplash.com/photo-1583912267550-d974b6e85fc3?w=800&q=80'],
  bakery:      ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80'],
  butcher:     ['https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80'],
  restaurant:  [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80',
  ],
  convenience: ['https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=800&q=80'],
  petshop:     ['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80'],
  electronics: ['https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80'],
  clothing:    ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80'],
  other:       ['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80'],
};

let coverCounters = {};

function getCoverUrl(category) {
  const urls = CATEGORY_COVERS[category] || CATEGORY_COVERS.other;
  coverCounters[category] = (coverCounters[category] || 0);
  const url = urls[coverCounters[category] % urls.length];
  coverCounters[category]++;
  return url;
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)', 'Accept': 'image/*' },
      timeout: 12000,
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/jpeg' }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function uploadToOCI(buffer, contentType, ext = 'jpg') {
  const key = `establishments/${uuidv4()}.${ext}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.OCI_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }));
  return `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com/n/${process.env.OCI_NAMESPACE}/b/${process.env.OCI_BUCKET_NAME}/o/${key}`;
}

function extFromContentType(ct) {
  if (ct.includes('png')) return 'png';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('svg')) return 'svg';
  return 'jpg';
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Busca só os que ainda não têm logo ou cover
  const ests = await Establishment.find({
    $or: [
      { logo: { $exists: false } },
      { logo: null },
      { coverImage: { $exists: false } },
      { coverImage: null },
    ]
  }, '_id name category logo coverImage').lean();

  console.log(`Reprocessando ${ests.length} estabelecimentos sem imagem...\n`);

  let logos = 0, covers = 0;
  for (let i = 0; i < ests.length; i++) {
    const est = ests[i];
    process.stdout.write(`[${i + 1}/${ests.length}] ${est.name}... `);
    const update = {};

    // Logo
    if (!est.logo) {
      const known = KNOWN_LOGOS[est.name];
      if (known?.logo) {
        try {
          const { buffer, contentType } = await fetchBuffer(known.logo);
          update.logo = await uploadToOCI(buffer, contentType, extFromContentType(contentType));
          logos++;
        } catch (e) {
          process.stdout.write(`logo_err(${e.message}) `);
        }
      }
    }

    // Cover
    if (!est.coverImage) {
      try {
        const url = getCoverUrl(est.category);
        const { buffer, contentType } = await fetchBuffer(url);
        update.coverImage = await uploadToOCI(buffer, contentType, extFromContentType(contentType));
        covers++;
      } catch (e) {
        process.stdout.write(`cover_err(${e.message}) `);
      }
    }

    if (Object.keys(update).length > 0) {
      await Establishment.updateOne({ _id: est._id }, { $set: update });
    }

    console.log(`logo=${update.logo ? '✓' : '–'} cover=${update.coverImage ? '✓' : '–'}`);

    // Pequena pausa para não sobreaquecer
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nConcluído: +${logos} logos, +${covers} covers`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
