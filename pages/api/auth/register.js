import bcrypt from 'bcryptjs';
import { User } from '../../../models';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  const { iin, password, role = 'user' } = req.body;

  try {
    const existingUser = await User.findOne({ iin });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким ИИН уже зарегистрирован' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ iin, password: hashedPassword, role });
    await newUser.save();

    res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
}