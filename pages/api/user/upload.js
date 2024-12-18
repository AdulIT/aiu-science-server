const express = require('express');
const multer = require('multer');
const path = require('path');
const { verifyToken, authenticateUser } = require('../../../middleware/auth');
const Publication = require('../../../models/Publication');

const router = express.Router();

// Настройка multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/publications/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return cb(new Error('Файл должен быть формата PDF'));
    }
    cb(null, true);
  },
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'authors', maxCount: 1 },
  { name: 'title', maxCount: 1 },
  { name: 'year', maxCount: 1 },
  { name: 'output', maxCount: 1 },
  { name: 'doi', maxCount: 1 },
  { name: 'isbn', maxCount: 1 },
  { name: 'scopus', maxCount: 1 },
  { name: 'wos', maxCount: 1 },
  { name: 'publicationType', maxCount: 1 },
]);

router.post('/upload', verifyToken, authenticateUser, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Ошибка загрузки файла:', err.message);
      return res.status(400).json({ message: err.message });
    }

    const { authors, title, year, output, doi, isbn, scopus, wos, publicationType } = req.body;

    if (!authors || !title || !year || !output || !publicationType) {
      return res.status(400).json({ message: 'Все обязательные поля должны быть заполнены.' });
    }

    try {
      const newPublication = new Publication({
        iin: req.user.iin,
        authors: authors.split(',').map((a) => a.trim()),
        title,
        year,
        output,
        doi: doi || null,
        isbn: isbn || null,
        scopus: scopus === 'true',
        wos: wos === 'true',
        publicationType,
        file: req.files['file']
          ? `public/uploads/publications/${req.files['file'][0].filename}`
          : null,
      });

      const savedPublication = await newPublication.save();
      console.log('Сохранённая публикация:', savedPublication);

      return res.status(201).json(savedPublication);
    } catch (error) {
      console.error('Ошибка сохранения публикации:', error);
      return res.status(500).json({ message: 'Ошибка при сохранении публикации.' });
    }
  });
});

module.exports = router;