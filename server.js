const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();
const { User } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((error) => console.error('MongoDB connection error:', error));

// const userSchema = new mongoose.Schema({
//   iin: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
// });

// const User = mongoose.model('User', userSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.post('/api/auth/register', async (req, res) => {
  const { iin, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ iin });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this IIN already registered' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ iin, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { iin, password } = req.body;

  try {
    // Find user by IIN
    const user = await User.findOne({ iin });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Generate JWT token
    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
    const token = jwt.sign({ iin: user.iin }, secretKey, { expiresIn: '1h' });

    // Return token
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Обновление информации о пользователе
app.put('/api/user/update', async (req, res) => {
  console.log('Запрос на обновление информации получен');

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Ошибка авторизации: токен отсутствует или некорректный');
    return res.status(401).json({ message: 'Отсутствует токен авторизации' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
    const decoded = jwt.verify(token, secretKey);
    const iin = decoded.iin;

    console.log('Токен успешно верифицирован. ИИН:', iin);

    const user = await User.findOne({ iin });
    if (!user) {
      console.error('Пользователь не найден');
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const { scopusId, wosId, orcid, birthDate, phone, email, researchArea } = req.body;
    console.log('Данные для обновления:', req.body);

    user.scopusId = scopusId || user.scopusId;
    user.wosId = wosId || user.wosId;
    user.orcid = orcid || user.orcid;
    user.birthDate = birthDate || user.birthDate;
    user.phone = phone || user.phone;
    user.email = email || user.email;
    user.researchArea = researchArea || user.researchArea;

    await user.save();

    console.log('Информация пользователя успешно обновлена');
    res.status(200).json({ message: 'Данные успешно обновлены' });
  } catch (error) {
    console.error('Ошибка при обновлении данных пользователя:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
});

// Загрузка фотографии профиля пользователя
app.post('/api/user/uploadPhoto', upload.single('profilePhoto'), async (req, res) => {
  console.log('Запрос на загрузку фотографии получен');

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Ошибка авторизации: токен отсутствует или некорректный');
    return res.status(401).json({ message: 'Отсутствует токен авторизации' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
    const decoded = jwt.verify(token, secretKey);
    const iin = decoded.iin;

    console.log('Токен успешно верифицирован. ИИН:', iin);

    if (!req.file) {
      console.error('Файл не был загружен');
      return res.status(400).json({ message: 'Файл не был загружен' });
    }

    console.log('Файл успешно загружен:', req.file.filename);
    const filePath = `/uploads/${req.file.filename}`;

    const user = await User.findOne({ iin });
    if (!user) {
      console.error('Пользователь не найден');
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    user.profilePhoto = filePath;
    await user.save();

    console.log('Фотография успешно сохранена в базе данных');
    res.status(200).json({ message: 'Фотография успешно загружена', profilePhoto: filePath });
  } catch (error) {
    console.error('Ошибка при обработке запроса:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
});

app.get('/api/user/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Ошибка авторизации: токен отсутствует или некорректный');
    return res.status(401).json({ message: 'Отсутствует токен авторизации' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
    const decoded = jwt.verify(token, secretKey);
    const iin = decoded.iin;

    console.log('Токен успешно верифицирован. ИИН:', iin);

    const user = await User.findOne({ iin }).select('-password');
    if (!user) {
      console.error('Пользователь не найден');
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    console.log('Данные пользователя найдены:', user);
    res.status(200).json(user);
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});