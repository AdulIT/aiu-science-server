const { Publication } = require('../../models');

module.exports = async function handler(req, res) {
  // await corsMiddleware(req, res);
  // await dbConnect();
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { iin } = req.query; // use req.query instead of req.params for serverless functions

  try {
    const publications = await Publication.find({ iin });
    res.status(200).json({ publications });
  } catch (error) {
    console.error('Ошибка при получении публикаций:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}

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