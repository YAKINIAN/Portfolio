const router = require('express').Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: { folder: 'portfolio', allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'] },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        req.admin = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', auth, upload.any(), async (req, res) => {
    const { title, category, description, technologies, role, live_url, created_date } = req.body;
    const screenshots = req.files?.map(f => f.path) || [];
    try {
        const result = await pool.query(
            `INSERT INTO projects (title, category, description, technologies, role, live_url, screenshots, created_date)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [title, category, description, technologies, role, live_url, screenshots, created_date || new Date()]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', auth, upload.any(), async (req, res) => {
    const { title, category, description, technologies, role, live_url, created_date, existing_screenshots } = req.body;
    const newFiles = req.files?.map(f => f.path) || [];
    const existing = existing_screenshots ? JSON.parse(existing_screenshots) : [];
    const screenshots = [...existing, ...newFiles];
    try {
        const result = await pool.query(
            `UPDATE projects SET title=$1, category=$2, description=$3, technologies=$4,
             role=$5, live_url=$6, screenshots=$7, created_date=$8 WHERE id=$9 RETURNING *`,
            [title, category, description, technologies, role, live_url, screenshots, created_date, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const proj = await pool.query('SELECT screenshots FROM projects WHERE id=$1', [req.params.id]);
        const shots = proj.rows[0]?.screenshots || [];
        // Delete from Cloudinary
        await Promise.all(shots.map(url => {
            const publicId = url.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '');
            return cloudinary.uploader.destroy(publicId);
        }));
        await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
