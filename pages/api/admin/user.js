import { User } from '../../../models';
import { verifyToken, authenticateAdmin } from '../../../middleware/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await verifyToken(req, res);
    await authenticateAdmin(req, res);

    const user = await User.findOne({ iin: req.query.iin });
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Ошибка при получении профиля пользователя:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}

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
  