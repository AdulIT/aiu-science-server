const jwt = require('jsonwebtoken');
const { User } = require('../../../models/index');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Отсутствует Refresh Token' });
  }

  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'defaultRefreshSecret';

    const decoded = jwt.verify(refreshToken, refreshSecret);
    const iin = decoded.iin;

    const user = await User.findOne({ iin });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const accessToken = jwt.sign(
      { iin: user.iin, role: user.role },
      process.env.JWT_SECRET || 'defaultSecretKey',
      { expiresIn: '15m' }
    );

    res.status(200).json({ success: true, accessToken });
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    res.status(403).json({ message: 'Недействительный Refresh Token' });
  }
}