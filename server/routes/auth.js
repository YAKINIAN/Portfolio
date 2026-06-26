const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM admin WHERE username = $1', [username]);
        const admin = result.rows[0];
        if (!admin || !await bcrypt.compare(password, admin.password))
            return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
