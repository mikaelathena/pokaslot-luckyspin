const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const app = express();

const PORT = process.env.PORT || 3000;

// Session setup
app.use(session({
  secret: 'helios168secret',
  resave: false,
  saveUninitialized: false
}));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve public assets
app.use(express.static(path.join(__dirname, 'public')));

// Proteksi seluruh /admin, kecuali login & login.html
app.use('/admin', (req, res, next) => {
  const allowed = ['/login', '/login.html'];
  if (allowed.includes(req.path)) return next();
  if (req.session && req.session.loggedIn) return next();
  res.redirect('/admin/login.html');
});

// Serve static files dari folder /admin (di luar /public)
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Login admin
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'Mercedesbenzc63$$$';

app.post('/admin/login', express.urlencoded({ extended: true }), (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.loggedIn = true;
    return res.redirect('/admin/index.html');
  } else {
    return res.send('<script>alert("Login gagal!"); location.href="/admin/login.html"</script>');
  }
});

// SQLite setup
const db = new sqlite3.Database(path.join(__dirname, 'database', 'spin.db'));
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    prize TEXT,
    claimed INTEGER DEFAULT 0
  )`);
});

// API: Spin
app.get('/api/spin/:code', (req, res) => {
  const code = req.params.code;
  db.get('SELECT * FROM codes WHERE code = ?', [code], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (!row) return res.json({ success: false, message: 'Kode tidak ditemukan' });
    if (row.claimed) return res.json({ success: false, message: 'Kode sudah digunakan' });

    db.run('UPDATE codes SET claimed = 1 WHERE code = ?', [code], (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Gagal update status kode' });
      return res.json({ success: true, prize: row.prize });
    });
  });
});

// API: Generate code
app.post('/api/admin/generate', (req, res) => {
  const { prize } = req.body;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const code = Array(8).fill('').map(() => charset.charAt(Math.floor(Math.random() * charset.length))).join('');

  db.run('INSERT INTO codes (code, prize) VALUES (?, ?)', [code, prize], function (err) {
    if (err) return res.status(500).json({ success: false, message: 'Gagal generate kode' });
    return res.json({ success: true, code, prize });
  });
});

// API: Lihat daftar kode
app.get('/api/admin/codes', (req, res) => {
  db.all('SELECT * FROM codes ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Gagal ambil data kode' });
    return res.json({ success: true, codes: rows });
  });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
