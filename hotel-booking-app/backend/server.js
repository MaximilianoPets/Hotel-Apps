const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hotelbookingapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});



async function initDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(100),
      password VARCHAR(255) NOT NULL,
      enabled BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await connection.query(`CREATE TABLE IF NOT EXISTS bookings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      hotel_id INT NOT NULL,
      user_id INT NOT NULL,
      check_in DATE,
      check_out DATE,
      status VARCHAR(50) DEFAULT 'confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await connection.query(`CREATE TABLE IF NOT EXISTS usuarios (
      id INT PRIMARY KEY AUTO_INCREMENT,
      usuario VARCHAR(50) UNIQUE,
      nombre VARCHAR(100),
      apellido VARCHAR(100),
      mail VARCHAR(100),
      contrasena VARCHAR(255),
      enabled BOOLEAN DEFAULT TRUE,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await connection.query(`CREATE TABLE IF NOT EXISTS hotels (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      city VARCHAR(100) NOT NULL,
      country VARCHAR(100) DEFAULT '',
      price DECIMAL(10, 2) NOT NULL,
      rating DECIMAL(3, 1) DEFAULT 0.0,
      available BOOLEAN DEFAULT TRUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    const [hotelRows] = await connection.query('SELECT COUNT(*) AS count FROM hotels');
    if (hotelRows[0].count === 0) {
      await connection.query(
        'INSERT INTO hotels (name, city, country, price, rating, available) VALUES ?',
        [[
          ['Hotel Paradise', 'Miami', 'USA', 150.00, 4.5, 1],
          ['Mountain Resort', 'Denver', 'USA', 120.00, 4.2, 1],
          ['Beach Club', 'Cancun', 'Mexico', 200.00, 4.8, 0]
        ]]
      );
    }

    try {
      await connection.query(`ALTER TABLE hotels ADD COLUMN country VARCHAR(100) DEFAULT '' AFTER city`);
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.log('Column already exists or other error:', err.message);
      }
    }

    try {
      await connection.query(`ALTER TABLE bookings ADD COLUMN price_per_night DECIMAL(10, 2) AFTER status`);
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.log('Column already exists or other error:', err.message);
      }
    }

    try {
      await connection.query(`ALTER TABLE bookings ADD COLUMN total_price DECIMAL(10, 2) AFTER price_per_night`);
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.log('Column already exists or other error:', err.message);
      }
    }

    // Add missing columns if they don't exist
    try {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN contrasena VARCHAR(255) AFTER mail`);
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.log('Column already exists or other error:', err.message);
      }
    }

    try {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN enabled BOOLEAN DEFAULT TRUE AFTER contrasena`);
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.log('Column already exists or other error:', err.message);
      }
    }

    try {
      await connection.query(`ALTER TABLE usuarios ADD COLUMN is_admin BOOLEAN DEFAULT FALSE AFTER enabled`);
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.log('Column already exists or other error:', err.message);
      }
    }

    const [rows] = await connection.query('SELECT COUNT(*) AS count FROM users');
    if (rows[0].count === 0) {
      const password1 = await bcrypt.hash('password123', 10);
      const password2 = await bcrypt.hash('password123', 10);
      const password3 = await bcrypt.hash('admin123', 10);

      await connection.query(
        'INSERT INTO users (username, email, password, enabled) VALUES ?',
        [[
          ['testuser', 'test@example.com', password1, 1],
          ['disableduser', 'disabled@example.com', password2, 0],
          ['admin', 'admin@example.com', password3, 1]
        ]]
      );
    }

    // Create admin user in usuarios table if doesn't exist
    const [usuariosRows] = await connection.query('SELECT COUNT(*) AS count FROM usuarios');
    if (usuariosRows[0].count === 0) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        'INSERT INTO usuarios (usuario, nombre, apellido, mail, contrasena, enabled, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['admin', 'Administrador', 'Sistema', 'admin@example.com', adminPassword, 1, 1]
      );
    }
  } finally {
    connection.release();
  }
}

async function getUserByIdentifier(identifier) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE usuario = ? OR nombre = ? OR mail = ? LIMIT 1',
      [identifier, identifier, identifier]
    );
    if (rows.length) {
      const row = rows[0];
      return {
        id: row.id,
        username: row.usuario || row.nombre || row.username || row.user || row.mail,
        email: row.mail || row.email,
        password: row.contrasena || row.password,
        enabled: typeof row.enabled !== 'undefined' ? row.enabled : 1,
        is_admin: typeof row.is_admin !== 'undefined' ? row.is_admin : 0
      };
    }
  } catch (err) {
    if (!err.message.includes('Unknown column') && !err.message.includes("doesn't exist")) {
      throw err;
    }
  }

  try {
    const [rows2] = await pool.query('SELECT * FROM usuarios WHERE nombre = ? OR mail = ? LIMIT 1', [identifier, identifier]);
    if (rows2.length) {
      const row = rows2[0];
      return {
        id: row.id,
        username: row.nombre || row.username || row.user || row.mail,
        email: row.mail || row.email,
        password: row.contrasena || row.password,
        enabled: typeof row.enabled !== 'undefined' ? row.enabled : 1,
        is_admin: typeof row.is_admin !== 'undefined' ? row.is_admin : 0
      };
    }
  } catch (err) {
    if (!err.message.includes('Unknown column') && !err.message.includes("doesn't exist")) {
      throw err;
    }
  }

  const [rows3] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [identifier]);
  if (rows3.length) {
    return { ...rows3[0], id: rows3[0].id + 10000, is_admin: 0 };
  }
  return null;
}

async function getBookingsByUser(userId) {
  const [rows] = await pool.query('SELECT * FROM bookings WHERE user_id = ?', [userId]);
  return rows.map(r => ({
    id: r.id,
    hotelId: r.hotel_id,
    userId: r.user_id,
    checkIn: r.check_in instanceof Date ? r.check_in.toISOString().split('T')[0] : r.check_in,
    checkOut: r.check_out instanceof Date ? r.check_out.toISOString().split('T')[0] : r.check_out,
    status: r.status,
    pricePerNight: r.price_per_night,
    totalPrice: r.total_price
  }));
}

async function createBooking(hotelId, userId, checkIn, checkOut, pricePerNight, totalPrice) {
  const [result] = await pool.query(
    'INSERT INTO bookings (hotel_id, user_id, check_in, check_out, status, price_per_night, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [hotelId, userId, checkIn, checkOut, 'confirmed', pricePerNight, totalPrice]
  );

  return {
    id: result.insertId,
    hotelId,
    userId,
    checkIn,
    checkOut,
    status: 'confirmed',
    pricePerNight,
    totalPrice
  };
}

async function deleteBooking(id) {
  const [result] = await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
  return result.affectedRows;
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

// ==================== ROUTES ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await getUserByIdentifier(username);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (typeof user.enabled !== 'undefined' && !user.enabled) {
      return res.status(403).json({ error: 'User is disabled' });
    }

    const validPassword = user.password && user.password.startsWith('$2')
      ? await bcrypt.compare(password, user.password)
      : user.password === password;

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({
      success: true,
      token: `fake-jwt-token-${user.id}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});
app.post('/api/register', async (req, res) => {
  const { usuario, nombre, apellido, mail, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  const normalizedMail = mail?.trim() || null;
  const normalizedNombre = nombre?.trim() || null;
  const normalizedApellido = apellido?.trim() || null;

  try {
    if (await userExists(usuario)) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }

    if (normalizedMail && await userExists(normalizedMail)) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const user = await createUsuario({
      usuario,
      nombre: normalizedNombre,
      apellido: normalizedApellido,
      mail: normalizedMail,
      contrasena
    });
    res.status(201).json({ success: true, user });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Usuario o correo ya existen' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.get('/api/locations', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT DISTINCT CONCAT(city, ', ', country) AS location FROM hotels WHERE country IS NOT NULL AND country != '' ORDER BY location");
    res.json(rows.map(r => r.location));
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ error: 'Could not fetch locations' });
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

    const [filtered] = await pool.query(query, values);
    
    const formatted = filtered.map(h => ({
      ...h,
      available: h.available === 1
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching hotels:', err);
    res.status(500).json({ error: 'Could not fetch hotels' });
  }
});

app.get('/api/hotels/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hotels WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    const hotel = { ...rows[0], available: rows[0].available === 1 };
    res.json(hotel);
  } catch (err) {
    console.error('Error fetching hotel:', err);
    res.status(500).json({ error: 'Could not fetch hotel' });
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
    res.status(201).json({ id: result.insertId, name, city, country, price, rating, available: available !== undefined ? available : true });
  } catch (err) {
    console.error('Error creating hotel:', err);
    res.status(500).json({ error: 'Could not create hotel' });
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
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating hotel:', err);
    res.status(500).json({ error: 'Could not update hotel' });
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
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting hotel:', err);
    res.status(500).json({ error: 'Could not delete hotel' });
  }
});

app.post('/api/bookings', async (req, res) => {
  const { hotelId, userId, checkIn, checkOut } = req.body;

  if (!hotelId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [hotelRows] = await pool.query('SELECT id, price FROM hotels WHERE id = ?', [hotelId]);
    if (hotelRows.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    const hotel = hotelRows[0];

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate - checkInDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const nights = diffDays > 0 ? diffDays : 1;

    const pricePerNight = hotel.price;
    const totalPrice = pricePerNight * nights;

    const booking = await createBooking(hotelId, userId, checkIn, checkOut, pricePerNight, totalPrice);
    res.status(201).json(booking);
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Could not create booking' });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, h.name as hotel_name, h.city as hotel_city, u.usuario as user_name 
      FROM bookings b 
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN usuarios u ON b.user_id = u.id
      ORDER BY b.check_in DESC
    `);
    const allBookings = rows.map(r => ({
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
    }));
    res.json(allBookings);
  } catch (err) {
    console.error('All bookings fetch error:', err);
    res.status(500).json({ error: 'Could not load all bookings' });
  }
});

app.get('/api/bookings/:userId', async (req, res) => {
  try {
    if (req.params.userId === 'undefined' || !req.params.userId) {
      return res.json([]);
    }
    const userBookings = await getBookingsByUser(req.params.userId);
    res.json(userBookings);
  } catch (err) {
    console.error('Bookings fetch error:', err);
    res.status(500).json({ error: 'Could not load bookings' });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const affectedRows = await deleteBooking(req.params.id);
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ error: 'Could not delete booking' });
  }
});

// ==================== ADMIN ROUTES ====================

app.get('/api/admin/usuarios', async (req, res) => {
  const adminUserId = req.headers['x-admin-id'];
  
  try {
    const [adminUser] = await pool.query('SELECT is_admin FROM usuarios WHERE id = ?', [adminUserId]);
    
    if (!adminUser || !adminUser[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [usuarios] = await pool.query('SELECT id, usuario, nombre, apellido, mail, enabled, is_admin, created_at FROM usuarios');
    res.json(usuarios);
  } catch (err) {
    console.error('Admin list usuarios error:', err);
    res.status(500).json({ error: 'Could not list usuarios' });
  }
});

app.delete('/api/admin/usuarios/:id', async (req, res) => {
  const adminUserId = req.headers['x-admin-id'];
  const usuarioId = req.params.id;

  try {
    const [adminUser] = await pool.query('SELECT is_admin FROM usuarios WHERE id = ?', [adminUserId]);
    
    if (!adminUser || !adminUser[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [usuarioId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario not found' });
    }

    res.json({ success: true, message: 'Usuario deleted' });
  } catch (err) {
    console.error('Admin delete usuario error:', err);
    res.status(500).json({ error: 'Could not delete usuario' });
  }
});

app.put('/api/admin/usuarios/:id', async (req, res) => {
  const adminUserId = req.headers['x-admin-id'];
  const usuarioId = req.params.id;
  const { enabled, is_admin, nombre, apellido, mail } = req.body;

  try {
    const [adminUser] = await pool.query('SELECT is_admin FROM usuarios WHERE id = ?', [adminUserId]);
    
    if (!adminUser || !adminUser[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const updates = [];
    const values = [];

    if (typeof enabled !== 'undefined') {
      updates.push('enabled = ?');
      values.push(enabled);
    }
    if (typeof is_admin !== 'undefined') {
      updates.push('is_admin = ?');
      values.push(is_admin);
    }
    if (nombre) {
      updates.push('nombre = ?');
      values.push(nombre);
    }
    if (apellido) {
      updates.push('apellido = ?');
      values.push(apellido);
    }
    if (mail) {
      updates.push('mail = ?');
      values.push(mail);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(usuarioId);
    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario not found' });
    }

    res.json({ success: true, message: 'Usuario updated' });
  } catch (err) {
    console.error('Admin update usuario error:', err);
    res.status(500).json({ error: 'Could not update usuario' });
  }
});

const PORT = process.env.PORT || 5000;

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });
