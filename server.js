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
const Publication = require('./models/Publication');
const { verifyToken, authenticateAdmin } = require('./middleware/auth');
const userPublications = require('./routes/userPublications');
const adminPublications = require('./routes/adminPublications');
const { generateAllPublicationsReport, generateSingleUserReport } = require('./services/reportGenerator');
const refreshTokenHandler = require('./pages/api/auth/refresh-token'); // Импорт функции обработчика

const router = express.Router();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((error) => console.error('MongoDB connection error:', error));

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

app.use('/public', express.static(path.join(__dirname, 'public')));
// app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.post('/api/auth/register', async (req, res) => {
  const { iin, password } = req.body;

  try {
    const existingUser = await User.findOne({ iin });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this IIN already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
    const user = await User.findOne({ iin });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
    const accessToken = jwt.sign(
      { iin: user.iin, role: user.role },
      secretKey,
      { expiresIn: '15m' }
    );

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'defaultRefreshSecret';
    const refreshToken = jwt.sign(
      { iin: user.iin },
      refreshSecret,
      { expiresIn: '7d' }
    );

    res.status(200).json({ success: true, accessToken, refreshToken });
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

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

    const { fullName, scopusId, wosId, orcid, birthDate, phone, email, researchArea, higherSchool } = req.body;
    console.log('Данные для обновления:', req.body);

    user.fullName = fullName || user.fullName;
    user.scopusId = scopusId || user.scopusId;
    user.wosId = wosId || user.wosId;
    user.orcid = orcid || user.orcid;
    user.birthDate = birthDate || user.birthDate;
    user.phone = phone || user.phone;
    user.email = email || user.email;
    user.researchArea = researchArea || user.researchArea;
    user.higherSchool = higherSchool || user.higherSchool;

    await user.save();

    console.log('Информация пользователя успешно обновлена');
    res.status(200).json({ message: 'Данные успешно обновлены' });
  } catch (error) {
    console.error('Ошибка при обновлении данных пользователя:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
});

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
app.use('/api', userPublications);
app.use('/api', adminPublications);

app.post('/api/admin/create', async (req, res) => {
  const { iin, password } = req.body;

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Отсутствует токен авторизации' });
    }

    const token = authHeader.split(' ')[1];
    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
    const decoded = jwt.verify(token, secretKey);

    const requestingUser = await User.findOne({ iin: decoded.iin });
    if (requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const existingUser = await User.findOne({ iin });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким ИИН уже зарегистрирован' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new User({ iin, password: hashedPassword, role: 'admin' });
    await newAdmin.save();

    res.status(201).json({ message: 'Администратор успешно создан' });
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Отсутствует токен авторизации' });
    }

    const token = authHeader.split(' ')[1];
    const secretKey = process.env.JWT_SECRET || 'defaultSecretKey';
    const decoded = jwt.verify(token, secretKey);

    const requestingUser = await User.findOne({ iin: decoded.iin });
    if (requestingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const users = await User.find({});
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    res.status(500).json({ message: 'Произошла ошибка на сервере. Попробуйте позже.' });
  }
});

// router.get('/admin/publications', verifyToken, authenticateAdmin, async (req, res) => {
app.get('/api/admin/publications', verifyToken, authenticateAdmin, async (req, res) => {
  try {
    const publications = await Publication.find();
    res.json(publications);
  } catch (error) {
    console.error('Ошибка при загрузке всех публикаций:', error);
    res.status(500).json({ message: 'Ошибка при загрузке всех публикаций' });
  }
});

// Добавляем новый маршрут для получения профиля пользователя по ИИН
app.get('/api/admin/user/:iin', verifyToken, authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findOne({ iin: req.params.iin });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Ошибка при получении профиля пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/admin/generateUserReport', verifyToken, async (req, res) => {
  
  const { iin } = req.body;

  try {
    const user = await User.findOne({ iin });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const publications = await Publication.find({ iin });
    if (publications.length === 0) return res.status(404).json({ message: 'No publications found for this user' });

    const filePath = await generateSingleUserReport(user, publications);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${user.fullName}_work_list.docx`);

    res.download(filePath);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

app.post('/api/admin/generateAllPublicationsReport', verifyToken, async (req, res) => {
  const publicationsByUser = {};

  try {
    const users = await User.find({});
  
    for (const user of users) {
      publicationsByUser[user.iin] = {
        user,
        publications: await Publication.find({ iin: user.iin }),
      };
    }

    const filePath = await generateAllPublicationsReport(publicationsByUser);

    if (fs.existsSync(filePath)) {
      // Устанавливаем заголовки для скачивания файла
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename=all_publications_${new Date().getFullYear()}.docx`);
      
      // Передача файла в ответе
      res.download(filePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({ message: 'Error sending file' });
        }
      });
    } else {
      console.error('File not found:', filePath);
      res.status(404).json({ message: 'Report file not found' });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
});

app.post('/api/auth/refresh-token', refreshTokenHandler);

module.exports = router;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// const bcrypt = require('bcryptjs');
// bcrypt.hash('840915301433admin!', 10).then(console.log);

// $2a$10$B7.dZMGyAzLosAS/kiooYu58aIRqMCwszlodn5KARx2Rr5Xwf18Wq

// {
// 	"iin": "840915301433",
// 	"password": "840915301433admin!",
// 	"role": "admin"
// }