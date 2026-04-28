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

const hotels = [
  {
    id: 1,
    name: 'Hotel Paradise',
    city: 'Miami',
    price: 150,
    rating: 4.5,
    available: true
  },
  {
    id: 2,
    name: 'Mountain Resort',
    city: 'Denver',
    price: 120,
    rating: 4.2,
    available: true
  },
  {
    id: 3,
    name: 'Beach Club',
    city: 'Cancun',
    price: 200,
    rating: 4.8,
    available: false
  }
];

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
        enabled: typeof row.enabled !== 'undefined' ? row.enabled : 1
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
        enabled: typeof row.enabled !== 'undefined' ? row.enabled : 1
      };
    }
  } catch (err) {
    if (!err.message.includes('Unknown column') && !err.message.includes("doesn't exist")) {
      throw err;
    }
  }

  const [rows3] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [identifier]);
  return rows3[0];
}

async function getBookingsByUser(userId) {
  const [rows] = await pool.query('SELECT * FROM bookings WHERE user_id = ?', [userId]);
  return rows;
}

async function createBooking(hotelId, userId, checkIn, checkOut) {
  const [result] = await pool.query(
    'INSERT INTO bookings (hotel_id, user_id, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)',
    [hotelId, userId, checkIn, checkOut, 'confirmed']
  );

  return {
    id: result.insertId,
    hotelId,
    userId,
    checkIn,
    checkOut,
    status: 'confirmed'
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
        email: user.email
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

app.get('/api/hotels', (req, res) => {
  const { city, maxPrice } = req.query;

  let filtered = hotels;

  if (city) {
    filtered = filtered.filter(h => h.city.toLowerCase().includes(city.toLowerCase()));
  }

  if (maxPrice) {
    filtered = filtered.filter(h => h.price < maxPrice);
  }

  res.json(filtered);
});

app.get('/api/hotels/:id', (req, res) => {
  const hotel = hotels.find(h => h.id == req.params.id);
  if (!hotel) {
    return res.status(404).json({ error: 'Hotel not found' });
  }
  res.json(hotel);
});

app.post('/api/bookings', async (req, res) => {
  const { hotelId, userId, checkIn, checkOut } = req.body;

  if (!hotelId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const hotel = hotels.find(h => h.id == hotelId);
  if (!hotel) {
    return res.status(404).json({ error: 'Hotel not found' });
  }

  try {
    const booking = await createBooking(hotelId, userId, checkIn, checkOut);
    res.status(201).json(booking);
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Could not create booking' });
  }
});

app.get('/api/bookings/:userId', async (req, res) => {
  try {
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
