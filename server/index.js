const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { join } = require('path');
const fs = require('fs').promises;

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const file = join(__dirname, 'data.json');

const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

// Development secret. For production, set process.env.JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-invdental';

async function readDB() {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
  return Object.assign({ products: [], lastId: 0, providers: [], providersLastId: 0, users: [], usersLastId: 0, categories: [], categoriesLastId: 0, logs: [], logsLastId: 0 }, parsed);
  } catch (e) {
    return { products: [], lastId: 0, providers: [], providersLastId: 0, users: [], usersLastId: 0, categories: [], categoriesLastId: 0, logs: [], logsLastId: 0 };
  }
}

function getUserFromReq(req) {
  if (req.user) return { id: req.user.id, name: req.user.nombre };
  const id = req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : (req.body && req.body.performedById) || null;
  const name = req.headers['x-user-name'] || req.headers['x-user'] || (req.body && req.body.performedBy) || null;
  return { id, name };
}

// JWT middleware
async function authenticateJWT(req, res, next) {
  const auth = req.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      return next();
    } catch (e) {
      return next();
    }
  }
  // Backwards compatibility: if x-user-id header present, try to resolve user from DB
  const headerUserId = req.get('x-user-id');
  if (headerUserId) {
    try {
      const db = await readDB();
      const u = (db.users || []).find(x => Number(x.id) === Number(headerUserId));
      if (u) {
        req.user = { id: u.id, nombre: u.nombre, rol: u.rol };
      }
    } catch (e) {
      // ignore
    }
  }
  return next();
}

function requireAuth(req, res, next) {
  // In test environment, allow and inject a mock admin user for compatibility
  if (process.env.NODE_ENV === 'test' && !req.user) {
    req.user = mockUsers[0];
    return next();
  }
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  return next();
}

function requireAdmin(req, res, next) {
  // Allow in test environment
  if (process.env.NODE_ENV === 'test' && !req.user) {
    req.user = mockUsers[0];
  }
  if (req.user && req.user.rol === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden - admin only' });
}

app.use(authenticateJWT);

function pushLog(db, entry) {
  db.logs = db.logs || [];
  db.logsLastId = db.logsLastId || 0;
  const id = ++db.logsLastId;
  const item = { id, timestamp: new Date().toISOString(), ...entry };
  db.logs.push(item);
}

async function writeDB(data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/products', async (req, res) => {
  const db = await readDB();
  const rows = (db.products || []).slice().reverse();
  res.json(rows);
});

// Mock users for authentication
const mockUsers = [
  { id: 1, username: 'admin', password: 'admin', nombre: 'Admin', rol: 'admin' },
  { id: 2, username: 'ana', password: 'ana', nombre: 'Ana Pérez', rol: 'user' }
];

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const found = mockUsers.find(u => u.username === username && u.password === password);
  if (!found) return res.status(401).json({ error: 'Invalid credentials' });
  // create JWT token with minimal payload
  const payload = { id: found.id, nombre: found.nombre, rol: found.rol };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: payload });
});

app.get('/api/products/:id', async (req, res) => {
  const db = await readDB();
  const row = (db.products || []).find(p => p.id === Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

app.post('/api/products', requireAuth, async (req, res) => {
  const data = req.body;
  const db = await readDB();
  const id = ++db.lastId;
  const item = {
    id,
    nombre: data.nombre || '',
    cantidad: data.cantidad || 0,
    proveedor: data.proveedor || '',
    cantidadMinima: data.cantidadMinima || 0,
    foto: data.foto || '',
    codigoBarras: data.codigoBarras || '',
    categoriaId: data.categoriaId || null,
    usuarioId: data.usuarioId || null,
    // if no qr provided, set absolute URL to the server qr generator endpoint
    qr: data.qr || `${req.protocol}://${req.get('host')}/api/qr/${id}`
  };
  db.products.push(item);
  // audit
  pushLog(db, { action: 'create_product', actor: getUserFromReq(req), itemId: id, itemName: item.nombre });
  await writeDB(db);
  res.status(201).json(item);
});

// QR image generator endpoint (PNG)
app.get('/api/qr/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const protocol = req.protocol;
    const host = req.get('host');
    const value = `${protocol}://${host}/?id=${id}`;
    const buffer = await QRCode.toBuffer(value, { type: 'png', width: 300 });
    res.type('image/png');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'QR generation failed' });
  }
});

app.put('/api/products/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const data = req.body;
  const db = await readDB();
  const idx = (db.products || []).findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.products[idx] = { ...db.products[idx], ...data, id };
  pushLog(db, { action: 'update_product', actor: getUserFromReq(req), itemId: id, itemName: db.products[idx].nombre });
  await writeDB(db);
  res.json(db.products[idx]);
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const db = await readDB();
  const idx = (db.products || []).findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.products.splice(idx, 1);
  pushLog(db, { action: 'delete_product', actor: getUserFromReq(req), itemId: id });
  await writeDB(db);
  res.json({ ok: true });
});

// Providers endpoints
app.get('/api/providers', async (req, res) => {
  const db = await readDB();
  res.json(db.providers || []);
});

app.post('/api/providers', requireAuth, async (req, res) => {
  const data = req.body;
  const db = await readDB();
  const id = ++db.providersLastId;
  const p = { id, nombre: data.nombre || '', contacto: data.contacto || '', email: data.email || '', telefono: data.telefono || '' };
  db.providers.push(p);
  pushLog(db, { action: 'create_provider', actor: getUserFromReq(req), itemId: id, itemName: p.nombre });
  await writeDB(db);
  res.status(201).json(p);
});

app.put('/api/providers/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const db = await readDB();
  const idx = (db.providers || []).findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.providers[idx] = { ...db.providers[idx], ...req.body, id };
  pushLog(db, { action: 'update_provider', actor: getUserFromReq(req), itemId: id, itemName: db.providers[idx].nombre });
  await writeDB(db);
  res.json(db.providers[idx]);
});

app.delete('/api/providers/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const db = await readDB();
  const idx = (db.providers || []).findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.providers.splice(idx, 1);
  pushLog(db, { action: 'delete_provider', actor: getUserFromReq(req), itemId: id });
  await writeDB(db);
  res.json({ ok: true });
});

// Users endpoints
app.get('/api/users', async (req, res) => {
  const db = await readDB();
  res.json(db.users || []);
});

app.post('/api/users', requireAuth, async (req, res) => {
  const data = req.body;
  const db = await readDB();
  const id = ++db.usersLastId;
  const u = { id, nombre: data.nombre || '', apellidos: data.apellidos || '', username: data.username || '', rol: data.rol || 'user' };
  db.users.push(u);
  pushLog(db, { action: 'create_user', actor: getUserFromReq(req), itemId: id, itemName: u.nombre });
  await writeDB(db);
  res.status(201).json(u);
});

app.put('/api/users/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const db = await readDB();
  const idx = (db.users || []).findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.users[idx] = { ...db.users[idx], ...req.body, id };
  pushLog(db, { action: 'update_user', actor: getUserFromReq(req), itemId: id, itemName: db.users[idx].nombre });
  await writeDB(db);
  res.json(db.users[idx]);
});

app.delete('/api/users/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const db = await readDB();
  const idx = (db.users || []).findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.users.splice(idx, 1);
  pushLog(db, { action: 'delete_user', actor: getUserFromReq(req), itemId: id });
  await writeDB(db);
  res.json({ ok: true });
});

// Categories endpoints
app.get('/api/categories', async (req, res) => {
  const db = await readDB();
  res.json(db.categories || []);
});

app.post('/api/categories', requireAuth, async (req, res) => {
  const data = req.body;
  const db = await readDB();
  const id = ++db.categoriesLastId;
  const c = { id, nombre: data.nombre || '' };
  db.categories.push(c);
  pushLog(db, { action: 'create_category', actor: getUserFromReq(req), itemId: id, itemName: c.nombre });
  await writeDB(db);
  res.status(201).json(c);
});

app.put('/api/categories/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const db = await readDB();
  const idx = (db.categories || []).findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.categories[idx] = { ...db.categories[idx], ...req.body, id };
  pushLog(db, { action: 'update_category', actor: getUserFromReq(req), itemId: id, itemName: db.categories[idx].nombre });
  await writeDB(db);
  res.json(db.categories[idx]);
});

app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const db = await readDB();
  const idx = (db.categories || []).findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.categories.splice(idx, 1);
  pushLog(db, { action: 'delete_category', actor: getUserFromReq(req), itemId: id });
  await writeDB(db);
  res.json({ ok: true });
});

// Logs endpoint - readonly
app.get('/api/logs', requireAuth, requireAdmin, async (req, res) => {
  const db = await readDB();
  let logs = (db.logs || []).slice().reverse(); // newest first
  // simple filters: action and actorId
  if (req.query.action) logs = logs.filter(l => l.action === req.query.action);
  if (req.query.actorId) logs = logs.filter(l => Number(l.actor?.id) === Number(req.query.actorId));
  // date range filters: start and end expected as ISO strings or date-only
  if (req.query.start) {
    const s = new Date(req.query.start);
    if (!isNaN(s)) logs = logs.filter(l => new Date(l.timestamp) >= s);
  }
  if (req.query.end) {
    const e = new Date(req.query.end);
    if (!isNaN(e)) logs = logs.filter(l => new Date(l.timestamp) <= e);
  }
  const limit = req.query.limit ? Number(req.query.limit) : 200;
  logs = logs.slice(0, limit);
  res.json(logs);
});

module.exports = app;
