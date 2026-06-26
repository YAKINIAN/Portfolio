const router = require('express').Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Auth middleware
function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        req.admin = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        res.status(401).json({ error: 'Invalid token' });
    }
}

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Public: get all projects
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: create project
router.post('/', auth, upload.any(), async (req, res) => {
    const { title, category, description, technologies, role, live_url, created_date } = req.body;
    const screenshots = req.files?.map(f => `/uploads/${f.filename}`) || [];
    try {
        const result = await pool.query(
            `INSERT INTO projects (title, category, description, technologies, role, live_url, screenshots, created_date)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [title, category, description, technologies, role, live_url, screenshots, created_date || new Date()]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('POST /projects error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Admin: update project
router.put('/:id', auth, upload.any(), async (req, res) => {
    const { title, category, description, technologies, role, live_url, created_date, existing_screenshots } = req.body;
    const newFiles = req.files?.map(f => `/uploads/${f.filename}`) || [];
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

// Admin: delete project
router.delete('/:id', auth, async (req, res) => {
    try {
        const proj = await pool.query('SELECT screenshots FROM projects WHERE id=$1', [req.params.id]);
        const shots = proj.rows[0]?.screenshots || [];
        shots.forEach(s => {
            const fp = path.join(__dirname, '..', s);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        });
        await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
