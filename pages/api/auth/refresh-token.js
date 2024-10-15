import jwt from 'jsonwebtoken';
import { User } from '../../../models';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Отсутствует Refresh Token' });
  }

  const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';

  try {
    // Верификация Refresh Token
    const decoded = jwt.verify(refreshToken, secretKey);
    const user = await User.findOne({ iin: decoded.iin });

    if (!user) {
      return res.status(403).json({ message: 'Пользователь не найден' });
    }

    // Генерация нового Access Token
    const newAccessToken = jwt.sign(
      { iin: user.iin, role: user.role }, 
      process.env.JWT_SECRET || 'defaultSecretKey',
      { expiresIn: '15m' } // Новый Access Token на 15 минут
    );

    res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    console.error('Ошибка при обновлении Access Token:', error);
    res.status(403).json({ message: 'Неверный или истекший Refresh Token' });
  }
}