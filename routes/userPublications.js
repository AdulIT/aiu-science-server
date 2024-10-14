const express = require('express');
const { verifyToken, authenticateUser } = require('../middleware/auth');
const Publication = require('../models/Publication');

const router = express.Router();

router.get('/user/publications', verifyToken, authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const publications = await Publication.find({ userId });

    res.json(publications);
  } catch (error) {
    console.error('Ошибка при загрузке публикаций:', error);
    res.status(500).json({ message: 'Ошибка при загрузке публикаций' });
  }
});

router.post('/user/publications', verifyToken, authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { authors, title, year, output, doi, percentile } = req.body;

    const newPublication = new Publication({
      userId,
      authors,
      title,
      year,
      output,
      doi,
      percentile,
    });

    const savedPublication = await newPublication.save();
    res.status(201).json(savedPublication);
  } catch (error) {
    console.error('Ошибка при добавлении публикации:', error);
    res.status(500).json({ message: 'Ошибка при добавлении публикации' });
  }
});

module.exports = router;