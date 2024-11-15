const { User } = require('../../../models');
const { verifyToken, authenticateAdmin } = require('../../../middleware/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    verifyToken(req, res, () => {
      authenticateAdmin(req, res, async () => {
        try {
          const user = await User.findOne({ iin: req.params.iin });
          if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
          }
          res.status(200).json({ user });
        } catch (error) {
          console.error('Ошибка при получении профиля пользователя:', error);
          res.status(500).json({ message: 'Ошибка сервера' });
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при авторизации или аутентификации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// app.get('/api/admin/user/:iin', verifyToken, authenticateAdmin, async (req, res) => {
//     try {
//       const user = await User.findOne({ iin: req.params.iin });
//       if (!user) {
//         return res.status(404).json({ message: 'Пользователь не найден' });
//       }
//       res.json({ user });
//     } catch (error) {
//       console.error('Ошибка при получении профиля пользователя:', error);
//       res.status(500).json({ message: 'Ошибка сервера' });
//     }
//   });
  