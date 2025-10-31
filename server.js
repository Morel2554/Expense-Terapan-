const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const port = 8000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'pages')));
app.use(session({
  secret: 'keuangan_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 jam
}));

// Koneksi database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'neraca_keuangan'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Gagal konek ke database:', err);
    process.exit(1);
  }
  console.log('✅ Berhasil konek ke database MySQL');
});

// ===== Middleware =====
function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).send('Silakan login dahulu.');
  next();
}

function checkRole(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.session.user?.role;
    if (!req.session.user || !allowedRoles.includes(userRole)) {
      return res.status(403).send('Akses ditolak.');
    }
    next();
  };
}

// ===== ROUTES DASAR =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.get('/profil.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'profile.html'));
});

app.get('/neraca.html', requireLogin, checkRole(['administrator']), (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'neraca.html'));
});

app.get('/laporan.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'laporan.html'));
});

// ===== AUTH =====

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).send('Username & password wajib diisi');

  const sql = `SELECT * FROM users WHERE username = ? LIMIT 1`;
  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).send('Error server');
    if (results.length === 0) return res.status(401).send('User tidak ditemukan');

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send('Password salah');

    req.session.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role_id === 1 ? 'administrator' : 'member'
    };

    res.redirect('/');
  });
});

// Register (member)
app.post('/register', async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password)
    return res.status(400).send('Semua field wajib diisi');

  const check = `SELECT id FROM users WHERE username = ?`;
  db.query(check, [username], async (err, results) => {
    if (err) return res.status(500).send('Server error');
    if (results.length > 0) return res.status(400).send('Username sudah dipakai');

    const hashed = await bcrypt.hash(password, 10);
    const insert = `INSERT INTO users (name, username, email, password, role_id) VALUES (?, ?, ?, ?, 2)`;
    db.query(insert, [name, username, email, hashed], (err2) => {
      if (err2) return res.status(500).send('Gagal daftar');
      res.redirect('/login.html');
    });
  });
});

// === CRUD UNTUK MEMBER SAJA ===
app.get('/api/members', (req, res) => {
  db.query("SELECT id, username, email FROM users WHERE role_id = (SELECT id FROM roles WHERE name='member')", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

app.post('/api/members', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.query("INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, (SELECT id FROM roles WHERE name='member'))",
    [username, email, hashed],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.sendStatus(200);
    }
  );
});

app.put('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;
  db.query("UPDATE users SET username=?, email=? WHERE id=?", [username, email, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.sendStatus(200);
  });
});

app.delete('/api/members/:id', (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM users WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.sendStatus(200);
  });
});


// Session info
app.get('/session', (req, res) => {
  res.json({ user: req.session.user || null });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// ===== CRUD NERACA (Admin) =====

// Tampilkan semua data neraca
app.get('/api/neraca', requireLogin, (req, res) => {
  const sql = `SELECT * FROM neraca ORDER BY tanggal DESC`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send('Gagal ambil data neraca');
    res.json(results);
  });
});

// Tambah data neraca (admin)
app.post('/api/neraca', requireLogin, checkRole(['administrator']), (req, res) => {
  const { tanggal, keterangan, pemasukan, pengeluaran } = req.body;
  if (!tanggal || !keterangan) return res.status(400).send('Data wajib diisi');

  const sql = `
    INSERT INTO neraca (tanggal, keterangan, pemasukan, pengeluaran)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [tanggal, keterangan, pemasukan || 0, pengeluaran || 0], (err) => {
    if (err) return res.status(500).send('Gagal tambah data neraca');
    res.send('Data neraca berhasil ditambahkan');
  });
});

// Edit data neraca
app.put('/api/neraca/:id', requireLogin, checkRole(['administrator']), (req, res) => {
  const { tanggal, keterangan, pemasukan, pengeluaran } = req.body;
  const sql = `
    UPDATE neraca
    SET tanggal = ?, keterangan = ?, pemasukan = ?, pengeluaran = ?
    WHERE id = ?
  `;
  db.query(sql, [tanggal, keterangan, pemasukan, pengeluaran, req.params.id], (err, result) => {
    if (err) return res.status(500).send('Gagal edit data');
    if (result.affectedRows === 0) return res.status(404).send('Data tidak ditemukan');
    res.send('Data neraca berhasil diperbarui');
  });
});

// Hapus data neraca
app.delete('/api/neraca/:id', requireLogin, checkRole(['administrator']), (req, res) => {
  db.query(`DELETE FROM neraca WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).send('Gagal hapus data');
    res.send('Data neraca dihapus');
  });
});

// ===== LAPORAN KEUANGAN =====

// Simpan laporan transaksi (oleh member)
app.post('/api/laporan', requireLogin, checkRole(['member']), (req, res) => {
  const { tanggal, deskripsi, jumlah } = req.body;
  const userId = req.session.user.id;

  if (!tanggal || !deskripsi || !jumlah)
    return res.status(400).send('Semua kolom wajib diisi');

  const sql = `INSERT INTO laporan (user_id, tanggal, deskripsi, jumlah) VALUES (?, ?, ?, ?)`;
  db.query(sql, [userId, tanggal, deskripsi, jumlah], (err) => {
    if (err) return res.status(500).send('Gagal simpan laporan');
    res.send('Laporan berhasil disimpan');
  });
});

// Ambil laporan (admin bisa semua, member hanya miliknya)
app.get('/api/laporan', requireLogin, (req, res) => {
  const user = req.session.user;
  let sql = `SELECT l.*, u.name AS user_name FROM laporan l JOIN users u ON l.user_id = u.id`;

  if (user.role === 'member') {
    sql += ` WHERE l.user_id = ${db.escape(user.id)}`;
  }

  db.query(sql, (err, results) => {
    if (err) return res.status(500).send('Gagal ambil laporan');
    res.json(results);
  });
});

// ===== KEYS (riwayat transaksi verifikasi) =====
app.get('/api/keys', requireLogin, (req, res) => {
  const sql = `SELECT * FROM keys ORDER BY created_at DESC`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send('Gagal ambil data keys');
    res.json(results);
  });
});
// Neraca Saldo

app.post('/api/neracasaldo', (req, res) => {
  const { akun, debit, kredit, tanggal, keterangan } = req.body;
  const sql = 'INSERT INTO neracasaldo (akun, debit, kredit, tanggal, keterangan) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [akun, debit, kredit, tanggal, keterangan], (err, result) => {
    if (err) {
      console.error('Error insert neracasaldo:', err);
      return res.json({ success: false, message: 'Gagal menyimpan data neraca saldo' });
    }
    res.json({ success: true, message: 'Data neraca saldo berhasil disimpan' });
  });
});

// ===== SERVER RUN =====
app.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`);
});

