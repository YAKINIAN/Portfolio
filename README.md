# Ian Yakini Okongo — Portfolio

Personal portfolio website with a built-in CMS for managing projects, built with HTML/CSS/Vanilla JS on the frontend and Node.js + PostgreSQL (Neon) on the backend.

## Live Sections

| Section | Description |
|---|---|
| Home | Intro, social links, contact info |
| About | Background, stats |
| Qualification | Education & experience timeline |
| Skills | Tabbed skill bars (Frontend, UI/UX, Backend, Civil Engineering) |
| Work | Filterable project gallery — loaded live from database |
| Services | Service modals |
| Contact | Contact cards + message form |

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JS |
| Icons | Unicons v4 |
| Filter | MixItUp |
| Backend | Node.js, Express |
| Database | PostgreSQL (Neon hosted) |
| Auth | JWT + bcrypt |
| Uploads | Multer |

## Project Structure

```
Portfolio/
├── index.html               # Main portfolio page
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── img/
├── admin/
│   ├── index.html           # CMS login
│   ├── dashboard.html       # CMS dashboard
│   ├── dashboard.css
│   └── dashboard.js
├── server/
│   ├── index.js             # Express server entry
│   ├── db.js                # PostgreSQL (Neon) connection
│   ├── schema.sql           # DB setup
│   ├── routes/
│   │   ├── auth.js          # JWT login
│   │   └── projects.js      # CRUD + file uploads
│   └── uploads/             # Screenshot files (gitignored)
├── .env                     # Credentials (gitignored)
├── .gitignore
├── package.json
└── README.md
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file:

```env
DATABASE_URL=your_neon_postgres_connection_string
JWT_SECRET=your_long_random_secret
PORT=3000
```

### 3. Run database schema

```bash
# Using psql with your Neon connection string
psql "your_connection_string" -f server/schema.sql
```

Or paste the contents of `server/schema.sql` directly into the Neon SQL editor.

### 4. Create admin account

```bash
node -e "
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
bcrypt.hash('your_password', 10).then(hash => {
    pool.query('INSERT INTO admin (username, password) VALUES (\$1, \$2)', ['admin', hash])
        .then(() => { console.log('Admin created'); pool.end(); });
});
"
```

### 5. Start the server

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

- Portfolio → `http://localhost:3000`
- Admin CMS → `http://localhost:3000/admin`

## CMS Features

- **Add / Edit / Delete** projects
- **Multi-screenshot upload** with drag-and-drop
- **Image slider** in portfolio popup (with dot navigation)
- **Zoom lightbox** — click any screenshot to view full size
- **Live filter** by category: Web, App, Design, Engineering
- **Stats dashboard** — project counts by category
- **JWT auth** — 8h session, auto-redirect on expiry
- Projects appear on the portfolio **immediately** after saving

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | — | Returns JWT token |
| GET | `/api/projects` | — | List all projects |
| POST | `/api/projects` | ✓ | Create project + upload screenshots |
| PUT | `/api/projects/:id` | ✓ | Update project |
| DELETE | `/api/projects/:id` | ✓ | Delete project + removes files |

## Deployment Notes

- Use a process manager like `pm2` in production
- Put Nginx in front as a reverse proxy
- Uploads are stored locally in `server/uploads/` — for cloud deployment move to S3 or similar
- Never commit `.env` or `uploads/` (already in `.gitignore`)

## License

MIT — feel free to fork and adapt.
