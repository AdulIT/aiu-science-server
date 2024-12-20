const { Publication } = require('../../../models');
const { verifyToken } = require('../../../middleware/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await new Promise((resolve, reject) => verifyToken(req, res, (err) => (err ? reject(err) : resolve())));
    
    const { id } = req.query;
    const updatedFields = req.body;

    const updatedPublication = await Publication.findByIdAndUpdate(id, updatedFields, { new: true });

    if (!updatedPublication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    res.status(200).json(updatedPublication);
  } catch (error) {
    console.error('Error updating publication:', error);
    res.status(500).json({ message: 'Error updating publication' });
  }
};