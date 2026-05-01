const express = require('express');
const userRepository = require('../repositories/userRepository');
const { authenticate } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/isAdmin');

const router = express.Router();

router.get('/admin/usuarios', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await userRepository.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.put('/admin/usuarios/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const allowedUpdates = {
      enabled: req.body.enabled,
      is_admin: req.body.is_admin,
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      mail: req.body.mail
    };
    const updated = await userRepository.updateUser(req.params.id, allowedUpdates);
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.delete('/admin/usuarios/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const deleted = await userRepository.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
