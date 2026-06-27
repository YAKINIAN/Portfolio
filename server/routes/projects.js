const router = require('express').Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

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

router.post('/', auth, async (req, res) => {
    const { title, category, description, technologies, role, live_url, created_date, screenshots, screenshot_ids } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO projects (title, category, description, technologies, role, live_url, screenshots, screenshot_ids, created_date)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [title, category, description, technologies, role, live_url, screenshots || [], screenshot_ids || [], created_date || new Date()]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    const { title, category, description, technologies, role, live_url, created_date, screenshots, screenshot_ids } = req.body;
    try {
        const result = await pool.query(
            `UPDATE projects SET title=$1, category=$2, description=$3, technologies=$4,
             role=$5, live_url=$6, screenshots=$7, screenshot_ids=$8, created_date=$9 WHERE id=$10 RETURNING *`,
            [title, category, description, technologies, role, live_url, screenshots || [], screenshot_ids || [], created_date, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
