const { User, Publication } = require('../../../models');
const { generateSingleUserReport } = require('../../../services/reportGenerator');
const { verifyToken } = require('../../../middleware/auth');
const fs = require('fs');

module.exports = async function handler(req, res) {
  // await corsMiddleware(req, res);
  // await dbConnect();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { iin } = req.body;

  try {
    await verifyToken(req, res);

    const user = await User.findOne({ iin });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const publications = await Publication.find({ iin });
    if (publications.length === 0) return res.status(404).json({ message: 'No publications found for this user' });

    const filePath = await generateSingleUserReport(user, publications);
    const sanitizedFileName = `${user.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_work_list.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${sanitizedFileName}`);
    res.download(filePath);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
}

// app.post('/api/admin/generateUserReport', verifyToken, async (req, res) => {
  
//     const { iin } = req.body;
  
//     try {
//       const user = await User.findOne({ iin });
//       if (!user) return res.status(404).json({ message: 'User not found' });
  
//       const publications = await Publication.find({ iin });
//       if (publications.length === 0) return res.status(404).json({ message: 'No publications found for this user' });
  
//       const filePath = await generateSingleUserReport(user, publications);
  
//       const sanitizedFileName = `${user.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_work_list.docx`;
  
//       res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
//       res.setHeader('Content-Disposition', `attachment; filename=${sanitizedFileName}`);
  
//       res.download(filePath);
//     } catch (error) {
//       console.error('Error generating report:', error);
//       res.status(500).json({ message: 'Error generating report' });
//     }
//   });