import { Publication } from '../../../models';
import { verifyToken, authenticateAdmin } from '../../../middleware/auth';
import dbConnect from '../../../middleware/dbConnect';
import corsMiddleware from '../../../middleware/corsMiddleware';

export default async function handler(req, res) {
  await corsMiddleware(req, res);
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await verifyToken(req, res);
    await authenticateAdmin(req, res);

    const publications = await Publication.find();
    res.json(publications);
  } catch (error) {
    console.error('Ошибка при загрузке всех публикаций:', error);
    res.status(500).json({ message: 'Ошибка при загрузке всех публикаций' });
  }
}

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