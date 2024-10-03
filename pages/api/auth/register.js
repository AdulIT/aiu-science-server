import bcrypt from 'bcryptjs';
import { User } from '../../../models'; // Импортируем модель User

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    // Если метод не POST, возвращаем ошибку
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const { iin, password } = req.body;

  try {
    // Проверка, есть ли пользователь с таким же ИИН
    const existingUser = await User.findOne({ where: { iin } });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким ИИН уже зарегистрирован' });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание нового пользователя
    await User.create({ iin, password: hashedPassword });

    res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
}