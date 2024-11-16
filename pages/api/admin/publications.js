const Publication = require('../../../models/Publication');
const { verifyToken, authenticateAdmin } = require('../../../middleware/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    verifyToken(req, res, () => {
      authenticateAdmin(req, res, async () => {
        try {
          if (!Publication) {
            throw new Error('Модель Publication не определена.');
          }
          const publications = await Publication.find();
          res.status(200).json(publications);
        } catch (error) {
          console.error('Ошибка при загрузке всех публикаций:', error);
          res.status(500).json({ message: 'Ошибка при загрузке всех публикаций' });
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при авторизации или аутентификации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// // router.get('/admin/publications', verifyToken, authenticateAdmin, async (req, res) => {
//     app.get('/api/admin/publications', verifyToken, authenticateAdmin, async (req, res) => {
//         try {
//           const publications = await Publication.find();
//           res.json(publications);
//         } catch (error) {
//           console.error('Ошибка при загрузке всех публикаций:', error);
//           res.status(500).json({ message: 'Ошибка при загрузке всех публикаций' });
//         }
//       });