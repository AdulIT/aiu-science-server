const Publication = require('../../../models/Publication');

module.exports = async function handler(req, res) {
  const { iin } = req.query;

  try {
    const publications = await Publication.find({ iin });
    res.status(200).json(publications);
  } catch (error) {
    console.error('Ошибка при получении публикаций:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// app.get('/api/user/:iin/publications', async (req, res) => {
//     const { iin } = req.params;
//     try {
//       const publications = await Publication.find({ iin });
//       res.json({ publications });
//     } catch (error) {
//       console.error('Ошибка при получении публикаций:', error);
//       res.status(500).json({ message: 'Ошибка сервера' });
//     }
//   });