const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.usuario,
      email: user.mail,
      is_admin: user.is_admin
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function login({ username, password }) {
  const user = await userRepository.getUserByIdentifier(username);
  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.status = 401;
    throw error;
  }
  if (!user.enabled) {
    const error = new Error('Usuario deshabilitado');
    error.status = 403;
    throw error;
  }

  const validPassword = user.contrasena?.startsWith('$2')
    ? await bcrypt.compare(password, user.contrasena)
    : user.contrasena === password;

  if (!validPassword) {
    const error = new Error('Password incorrecta');
    error.status = 401;
    throw error;
  }

  return {
    token: signToken(user),
    user: {
      id: user.id,
      username: user.usuario,
      email: user.mail,
      is_admin: user.is_admin
    }
  };
}

async function register({ usuario, nombre, apellido, mail, contrasena }) {
  if (!usuario || !contrasena) {
    const error = new Error('Usuario y contraseña obligatorios');
    error.status = 400;
    throw error;
  }

  if (await userRepository.userExists(usuario)) {
    const error = new Error('Usuario ya existe');
    error.status = 409;
    throw error;
  }
  if (mail && await userRepository.userExists(mail)) {
    const error = new Error('Mail ya registrado');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(contrasena, 10);
  const user = await userRepository.createUsuario({ usuario, nombre, apellido, mail, contrasena: hashedPassword });
  return { user };
}

module.exports = {
  login,
  register,
  verifyToken
};
