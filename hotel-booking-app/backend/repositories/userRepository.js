const pool = require('../db/connection');

async function getUserByIdentifier(identifier) {
  const [rows] = await pool.query(
    'SELECT * FROM usuarios WHERE usuario = ? OR mail = ? LIMIT 1',
    [identifier, identifier]
  );
  return rows[0] || null;
}

async function getUserById(id) {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function userExists(identifier) {
  const [rows] = await pool.query(
    'SELECT id FROM usuarios WHERE usuario = ? OR mail = ? LIMIT 1',
    [identifier, identifier]
  );
  return rows.length > 0;
}

async function createUsuario({ usuario, nombre, apellido, mail, contrasena }) {
  const [result] = await pool.query(
    'INSERT INTO usuarios (usuario, nombre, apellido, mail, contrasena) VALUES (?, ?, ?, ?, ?)',
    [usuario, nombre, apellido, mail, contrasena]
  );
  return {
    id: result.insertId,
    usuario,
    nombre,
    apellido,
    mail
  };
}

async function getAllUsers() {
  const [rows] = await pool.query('SELECT * FROM usuarios');
  return rows;
}

async function updateUser(id, updates) {
  const sets = [];
  const values = [];

  if (typeof updates.enabled !== 'undefined') {
    sets.push('enabled = ?');
    values.push(updates.enabled);
  }
  if (typeof updates.is_admin !== 'undefined') {
    sets.push('is_admin = ?');
    values.push(updates.is_admin);
  }
  if (typeof updates.nombre !== 'undefined') {
    sets.push('nombre = ?');
    values.push(updates.nombre);
  }
  if (typeof updates.apellido !== 'undefined') {
    sets.push('apellido = ?');
    values.push(updates.apellido);
  }
  if (typeof updates.mail !== 'undefined') {
    sets.push('mail = ?');
    values.push(updates.mail);
  }

  if (!sets.length) {
    return null;
  }

  values.push(id);
  const [result] = await pool.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, values);
  return result.affectedRows > 0;
}

async function deleteUser(id) {
  const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  getUserByIdentifier,
  getUserById,
  userExists,
  createUsuario,
  getAllUsers,
  updateUser,
  deleteUser
};
