const { Publication } = require('../../../models');
const { verifyToken } = require('../../../middleware/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await new Promise((resolve, reject) => verifyToken(req, res, (err) => (err ? reject(err) : resolve())));

    const { id } = req.query;

    const deletedPublication = await Publication.findByIdAndDelete(id);

    if (!deletedPublication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    res.status(200).json({ message: 'Publication deleted successfully' });
  } catch (error) {
    console.error('Error deleting publication:', error);
    res.status(500).json({ message: 'Error deleting publication' });
  }
};