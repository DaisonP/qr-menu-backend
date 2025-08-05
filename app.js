const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const qrcode = require('qrcode');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(path.resolve(__dirname, '../database/db.sqlite'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL
  )`);
});

app.get('/menu', (req, res) => {
  db.all('SELECT * FROM dishes', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/dish', (req, res) => {
  const { name, price, category } = req.body;
  if (!name || !price || !category) return res.status(400).json({ error: "Заполните все поля" });
  db.run(
    'INSERT INTO dishes (name, price, category) VALUES (?, ?, ?)',
    [name, price, category],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.delete('/dish/:id', (req, res) => {
  db.run('DELETE FROM dishes WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/qrcode', (req, res) => {
  const url = req.query.url || 'http://localhost:3000';
  qrcode.toDataURL(url, (err, qr) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ qr });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend запущен на порту ${PORT}`));
