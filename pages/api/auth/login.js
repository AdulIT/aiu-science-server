import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../../models'; // Импортируем модель User

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    // Если метод не POST, возвращаем ошибку
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const { iin, password } = req.body;

  try {
    // Проверка наличия пользователя в базе данных
    const user = await User.findOne({ where: { iin } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Пользователь не найден' });
    }

    // Проверка правильности пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Неверный пароль' });
    }

    // Генерация JWT токена
    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey'; // Используйте безопасный ключ
    const token = jwt.sign({ iin: user.iin }, secretKey, { expiresIn: '1h' });

    // Возвращаем токен клиенту
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('Ошибка при авторизации пользователя:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
}