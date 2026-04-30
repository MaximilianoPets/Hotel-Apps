const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// ================= DB =================

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hotelbookingapp',
  waitForConnections: true,
  connectionLimit: 10
});

// ================= HELPERS =================

async function getUserByIdentifier(identifier) {
  const [rows] = await pool.query(
    'SELECT * FROM usuarios WHERE usuario = ? OR mail = ? LIMIT 1',
    [identifier, identifier]
  );

  if (!rows.length) return null;

  const row = rows[0];

  return {
    id: row.id,
    username: row.usuario,
    email: row.mail,
    password: row.contrasena,
    enabled: row.enabled,
    is_admin: row.is_admin
  };
}

async function userExists(identifier) {
  const [rows] = await pool.query(
    'SELECT id FROM usuarios WHERE usuario = ? OR mail = ? LIMIT 1',
    [identifier, identifier]
  );
  return rows.length > 0;
}

async function createUsuario({ usuario, nombre, apellido, mail, contrasena }) {
  const hashedPassword = await bcrypt.hash(contrasena, 10);

  const [result] = await pool.query(
    'INSERT INTO usuarios (usuario, nombre, apellido, mail, contrasena) VALUES (?, ?, ?, ?, ?)',
    [usuario, nombre, apellido, mail, hashedPassword]
  );

  return {
    id: result.insertId,
    usuario,
    nombre,
    apellido,
    mail
  };
}

// ================= ROUTES =================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// ---------- LOGIN ----------

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username y password requeridos' });
  }

  try {
    const user = await getUserByIdentifier(username);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (!user.enabled) {
      return res.status(403).json({ error: 'Usuario deshabilitado' });
    }

    const validPassword = user.password.startsWith('$2')
      ? await bcrypt.compare(password, user.password)
      : user.password === password;

    if (!validPassword) {
      return res.status(401).json({ error: 'Password incorrecta' });
    }

    res.json({
      success: true,
      token: `fake-jwt-${user.id}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login error' });
  }
});

// ---------- REGISTER ----------

app.post('/api/register', async (req, res) => {
  const { usuario, nombre, apellido, mail, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Usuario y contraseña obligatorios' });
  }

  try {
    if (await userExists(usuario)) {
      return res.status(409).json({ error: 'Usuario ya existe' });
    }

    if (mail && await userExists(mail)) {
      return res.status(409).json({ error: 'Mail ya registrado' });
    }

    const user = await createUsuario({
      usuario,
      nombre,
      apellido,
      mail,
      contrasena
    });

    res.status(201).json({ success: true, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en registro' });
  }
});

// ---------- HOTELS ----------

app.get('/api/locations', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT CONCAT(city, ', ', country) AS location FROM hotels WHERE country IS NOT NULL AND country != '' ORDER BY location"
    );
    res.json(rows.map(r => r.location));
  } catch (err) {
    res.status(500).json({ error: 'Error locations' });
  }
});

app.get('/api/hotels', async (req, res) => {
  const { location, maxPrice } = req.query;

  try {
    let query = 'SELECT * FROM hotels WHERE 1=1';
    const values = [];

    if (location) {
      query += " AND LOWER(CONCAT(city, ', ', country)) LIKE ?";
      values.push(`%${location.toLowerCase()}%`);
    }

    if (maxPrice) {
      query += ' AND price < ?';
      values.push(maxPrice);
    }

    const [rows] = await pool.query(query, values);

    res.json(rows.map(h => ({
      ...h,
      available: h.available === 1
    })));

  } catch (err) {
    res.status(500).json({ error: 'Error hoteles' });
  }
});

app.post('/api/hotels', async (req, res) => {
  const { name, city, country, price, rating, available } = req.body;

  if (!name || !city || !country || price === undefined || rating === undefined) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO hotels (name, city, country, price, rating, available) VALUES (?, ?, ?, ?, ?, ?)',
      [name, city, country, price, rating, available !== undefined ? available : 1]
    );
    res.status(201).json({ id: result.insertId, name, city, country, price, rating, available: true });
  } catch (err) {
    res.status(500).json({ error: 'Error creando hotel' });
  }
});

app.put('/api/hotels/:id', async (req, res) => {
  const { name, city, country, price, rating, available } = req.body;

  if (!name || !city || !country || price === undefined || rating === undefined) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE hotels SET name = ?, city = ?, country = ?, price = ?, rating = ?, available = ? WHERE id = ?',
      [name, city, country, price, rating, available ? 1 : 0, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Hotel no encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando hotel' });
  }
});

app.delete('/api/hotels/:id', async (req, res) => {
  try {
    const [bookings] = await pool.query(
      "SELECT COUNT(*) AS count FROM bookings WHERE hotel_id = ? AND status = 'confirmed'",
      [req.params.id]
    );
    if (bookings[0].count > 0) {
      return res.status(409).json({ error: 'No se puede eliminar el hotel ya que tiene reservas vigentes' });
    }

    const [result] = await pool.query('DELETE FROM hotels WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Hotel no encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando hotel' });
  }
});

// ---------- BOOKINGS ----------

app.post('/api/bookings', async (req, res) => {
  const { hotelId, userId, checkIn, checkOut } = req.body;

  if (!hotelId || !userId) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  try {
    const [hotelRows] = await pool.query('SELECT price FROM hotels WHERE id = ?', [hotelId]);
    if (!hotelRows.length) return res.status(404).json({ error: 'Hotel no existe' });

    const price = hotelRows[0].price;
    const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000));
    const total = price * nights;

    const [result] = await pool.query(
      'INSERT INTO bookings (hotel_id, user_id, check_in, check_out, price_per_night, total_price) VALUES (?, ?, ?, ?, ?, ?)',
      [hotelId, userId, checkIn, checkOut, price, total]
    );

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Error booking' });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, h.name AS hotel_name, h.city AS hotel_city, u.usuario AS user_name
      FROM bookings b
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN usuarios u ON b.user_id = u.id
      ORDER BY b.check_in DESC
    `);

    res.json(rows.map(r => ({
      id: r.id,
      hotelId: r.hotel_id,
      hotelName: r.hotel_name,
      hotelCity: r.hotel_city,
      userId: r.user_id,
      userName: r.user_name,
      checkIn: r.check_in instanceof Date ? r.check_in.toISOString().split('T')[0] : r.check_in,
      checkOut: r.check_out instanceof Date ? r.check_out.toISOString().split('T')[0] : r.check_out,
      status: r.status,
      pricePerNight: r.price_per_night,
      totalPrice: r.total_price
    })));
  } catch (err) {
    res.status(500).json({ error: 'Error bookings' });
  }
});

app.get('/api/bookings/:userId', async (req, res) => {
  try {
    if (req.params.userId === 'undefined' || !req.params.userId) return res.json([]);

    const [rows] = await pool.query('SELECT * FROM bookings WHERE user_id = ?', [req.params.userId]);

    res.json(rows.map(r => ({
      id: r.id,
      hotelId: r.hotel_id,
      userId: r.user_id,
      checkIn: r.check_in instanceof Date ? r.check_in.toISOString().split('T')[0] : r.check_in,
      checkOut: r.check_out instanceof Date ? r.check_out.toISOString().split('T')[0] : r.check_out,
      status: r.status,
      pricePerNight: r.price_per_night,
      totalPrice: r.total_price
    })));
  } catch (err) {
    res.status(500).json({ error: 'Error bookings' });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM bookings WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando reserva' });
  }
});

// ---------- ADMIN ----------

app.get('/api/admin/usuarios', async (req, res) => {
  const adminId = req.headers['x-admin-id'];

  const [admin] = await pool.query('SELECT is_admin FROM usuarios WHERE id = ?', [adminId]);
  if (!admin[0]?.is_admin) return res.status(403).json({ error: 'No autorizado' });

  const [rows] = await pool.query('SELECT * FROM usuarios');
  res.json(rows);
});

app.put('/api/admin/usuarios/:id', async (req, res) => {
  const adminId = req.headers['x-admin-id'];
  const { enabled, is_admin, nombre, apellido, mail } = req.body;

  const [admin] = await pool.query('SELECT is_admin FROM usuarios WHERE id = ?', [adminId]);
  if (!admin[0]?.is_admin) return res.status(403).json({ error: 'No autorizado' });

  const updates = [];
  const values = [];

  if (typeof enabled !== 'undefined') { updates.push('enabled = ?'); values.push(enabled); }
  if (typeof is_admin !== 'undefined') { updates.push('is_admin = ?'); values.push(is_admin); }
  if (nombre) { updates.push('nombre = ?'); values.push(nombre); }
  if (apellido) { updates.push('apellido = ?'); values.push(apellido); }
  if (mail) { updates.push('mail = ?'); values.push(mail); }

  if (!updates.length) return res.status(400).json({ error: 'Nada que actualizar' });

  values.push(req.params.id);
  const [result] = await pool.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, values);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

  res.json({ success: true });
});

app.delete('/api/admin/usuarios/:id', async (req, res) => {
  const adminId = req.headers['x-admin-id'];

  const [admin] = await pool.query('SELECT is_admin FROM usuarios WHERE id = ?', [adminId]);
  if (!admin[0]?.is_admin) return res.status(403).json({ error: 'No autorizado' });

  const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

  res.json({ success: true });
});

// ================= START =================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});