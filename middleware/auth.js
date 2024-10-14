const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Нет токена, авторизация отклонена' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecretKey');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Неверный токен' });
  }
}

// Аутентификация обычного пользователя
function authenticateUser(req, res, next) {
  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }
  next();
}

// Аутентификация администратора
function authenticateAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }
  next();
}

module.exports = {
  verifyToken,
  authenticateUser,
  authenticateAdmin,
};