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

// Logos conhecidas de marcas nacionais/internacionais
const KNOWN_LOGOS = {
  "McDonald's":       { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/600px-McDonald%27s_Golden_Arches.svg.png', cover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/McDonald%27s_drive-thru.jpg/1280px-McDonald%27s_drive-thru.jpg' },
  'Burger King':      { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Burger_King_logo_%281999%29.svg/600px-Burger_King_logo_%281999%29.svg.png', cover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/03161jfBulacan_distrits_Burger_King_SM_City_Malolosfvf.jpg/1280px-03161jfBulacan_distrits_Burger_King_SM_City_Malolosfvf.jpg' },
  'Droga Raia':       { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Droga_Raia_logo.svg/600px-Droga_Raia_logo.svg.png' },
  'Drogasil':         { logo: 'https://logospng.org/download/drogasil/logo-drogasil-256.png' },
  'Drogaria São Paulo': { logo: 'https://logospng.org/download/drogaria-sao-paulo/logo-drogaria-sao-paulo-256.png' },
  'Assaí Atacadista': { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Ass%C3%A1%C3%AD_Atacadista_logo.svg/600px-Ass%C3%A1%C3%AD_Atacadista_logo.svg.png' },
  'Atacadão':         { logo: 'https://logospng.org/download/atacadao/logo-atacadao-256.png' },
  'Riachuelo':        { logo: 'https://logospng.org/download/riachuelo/logo-riachuelo-256.png' },
  'Ultrafarma':       { logo: 'https://logospng.org/download/ultrafarma/logo-ultrafarma-256.png' },
  'UltraFarma Popular': { logo: 'https://logospng.org/download/ultrafarma/logo-ultrafarma-256.png' },
  'Onofre':           { logo: 'https://logospng.org/download/onofre/logo-onofre-256.png' },
  'Dia':              { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Dia_supermercados_logo.svg/600px-Dia_supermercados_logo.svg.png' },
  'Ipiranga':         { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Ipiranga_logo.svg/600px-Ipiranga_logo.svg.png' },
  'Shell Select':     { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Shell_logo.svg/600px-Shell_logo.svg.png' },
  'BR Mania':         { logo: 'https://logospng.org/download/br-mania/logo-br-mania-256.png' },
};

// Imagens genéricas por categoria (Unsplash - uso livre)
const CATEGORY_COVERS = {
  supermarket: 'https://images.unsplash.com/photo-1604719312566-8912e9c8a213?w=800&q=80',
  pharmacy:    'https://images.unsplash.com/photo-1563213126-a4273aed2016?w=800&q=80',
  bakery:      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  butcher:     'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80',
  restaurant:  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  convenience: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800&q=80',
  petshop:     'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80',
  electronics: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80',
  clothing:    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&q=80',
  other:       'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
};

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/*' }, timeout: 10000 }, res => {
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
  if (ct.includes('gif')) return 'gif';
  if (ct.includes('svg')) return 'svg';
  return 'jpg';
}

async function processOne(est) {
  const known = KNOWN_LOGOS[est.name];
  let logoUrl = null;
  let coverUrl = null;

  // Logo
  const logoSrc = known?.logo;
  if (logoSrc) {
    try {
      const { buffer, contentType } = await fetchBuffer(logoSrc);
      logoUrl = await uploadToOCI(buffer, contentType, extFromContentType(contentType));
    } catch (e) {
      console.log(`  logo falhou (${est.name}): ${e.message}`);
    }
  }

  // Cover: known cover ou genérica por categoria
  const coverSrc = known?.cover || CATEGORY_COVERS[est.category];
  if (coverSrc) {
    try {
      const { buffer, contentType } = await fetchBuffer(coverSrc);
      coverUrl = await uploadToOCI(buffer, contentType, extFromContentType(contentType));
    } catch (e) {
      console.log(`  cover falhou (${est.name}): ${e.message}`);
    }
  }

  if (logoUrl || coverUrl) {
    const update = {};
    if (logoUrl) update.logo = logoUrl;
    if (coverUrl) update.coverImage = coverUrl;
    await Establishment.updateOne({ _id: est._id }, { $set: update });
  }

  return { logo: !!logoUrl, cover: !!coverUrl };
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const ests = await Establishment.find({ logo: { $exists: false }, coverImage: { $exists: false } }, '_id name category').lean();
  console.log(`Processando ${ests.length} estabelecimentos...\n`);

  let logos = 0, covers = 0;
  for (let i = 0; i < ests.length; i++) {
    const est = ests[i];
    process.stdout.write(`[${i + 1}/${ests.length}] ${est.name}... `);
    const result = await processOne(est);
    if (result.logo) logos++;
    if (result.cover) covers++;
    console.log(`logo=${result.logo ? '✓' : '–'} cover=${result.cover ? '✓' : '–'}`);
  }

  console.log(`\nConcluído: ${logos} logos, ${covers} covers`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
