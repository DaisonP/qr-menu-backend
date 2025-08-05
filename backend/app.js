const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const qrcode = require('qrcode');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(path.resolve(__dirname, '../database/db.sqlite'));

// Создание таблиц
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS restaurant (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL
  )`);
});

// Эндпоинт для получения названия ресторана
app.get('/restaurant', (req, res) => {
  db.get('SELECT name FROM restaurant WHERE id = 1', (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ name: row ? row.name : '' });
  });
});

// Эндпоинт для установки/обновления названия ресторана
app.post('/restaurant', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Введите название ресторана' });
  db.run(
    'INSERT INTO restaurant (id, name) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name',
    [name],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Эндпоинты для категорий
app.get('/categories', (req, res) => {
  db.all('SELECT * FROM categories', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/category', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Введите название категории" });
  db.run(
    'INSERT INTO categories (name) VALUES (?)',
    [name],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Эндпоинты для блюд (уже были)
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
