function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }
  next();
}

function requireRole(...roles) {
  return [requireAuth, (req, res, next) => {
    if (!roles.includes(req.session.userRole)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  }];
}

module.exports = { requireAuth, requireRole };
