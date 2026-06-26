const router = require('express').Router();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS   // Gmail App Password (not your login password)
    }
});

router.post('/', async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message)
        return res.status(400).json({ error: 'Name, email and message are required.' });

    try {
        await transporter.sendMail({
            from: `"${name}" <${process.env.MAIL_USER}>`,
            to: process.env.MAIL_USER,
            replyTo: email,
            subject: subject || `Portfolio message from ${name}`,
            html: `
                <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
                <p><strong>Subject:</strong> ${subject || '—'}</p>
                <hr>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Mail error:', err.message);
        res.status(500).json({ error: 'Failed to send message. Try again later.' });
    }
});

module.exports = router;
