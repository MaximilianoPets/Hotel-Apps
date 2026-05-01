function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  if (req.user.is_admin !== 1) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  next();
}

module.exports = { isAdmin };
