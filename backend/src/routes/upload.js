const router = require('express').Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

// Use memory storage for OCI upload, disk for local dev
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
    cb(null, true);
  },
});

// POST /api/upload/image
router.post('/image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const ociKey = process.env.OCI_ACCESS_KEY_ID;
    const hasOCI = ociKey && ociKey !== 'your_oci_access_key';

    if (hasOCI) {
      // OCI Object Storage upload
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

      const client = new S3Client({
        region: process.env.OCI_REGION || 'sa-saopaulo-1',
        endpoint: `https://${process.env.OCI_NAMESPACE}.compat.objectstorage.${process.env.OCI_REGION}.oraclecloud.com`,
        credentials: {
          accessKeyId: process.env.OCI_ACCESS_KEY_ID,
          secretAccessKey: process.env.OCI_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
      });

      const fileName = `${uuidv4()}${path.extname(req.file.originalname)}`;
      await client.send(new PutObjectCommand({
        Bucket: process.env.OCI_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read',
      }));

      const url = `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com/n/${process.env.OCI_NAMESPACE}/b/${process.env.OCI_BUCKET_NAME}/o/${fileName}`;
      return res.json({ url });
    }

    // Dev fallback: save locally and return placeholder
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `${uuidv4()}${path.extname(req.file.originalname)}`;
    fs.writeFileSync(path.join(uploadsDir, fileName), req.file.buffer);

    // Return a placeholder URL (in production this would be OCI URL)
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
    res.json({ url: `${baseUrl}/uploads/${fileName}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
