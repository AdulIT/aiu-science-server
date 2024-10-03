const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // Загружаем переменные окружения из .env файла

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Простая база данных пользователей (для демонстрации)
const users = [];

// Маршрут для регистрации пользователя
app.post('/api/register', async (req, res) => {
  const { iin, password } = req.body;

  // Проверка, есть ли пользователь с таким же ИИН
  const existingUser = users.find((user) => user.iin === iin);
  if (existingUser) {
    return res.status(400).json({ message: 'Пользователь с таким ИИН уже зарегистрирован' });
  }

  // Хеширование пароля
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ iin, password: hashedPassword });

  res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
});

// Маршрут для входа пользователя
app.post('/api/login', async (req, res) => {
  const { iin, password } = req.body;

  const user = users.find((user) => user.iin === iin);
  if (!user) {
    return res.status(400).json({ message: 'Пользователь не найден' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Неверный пароль' });
  }

  // Генерация JWT токена
  const token = jwt.sign({ iin: user.iin }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Пример защищенного маршрута
app.get('/api/protected', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Нет доступа' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Токен невалиден' });
    }
    res.json({ message: 'Защищенные данные', user });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});