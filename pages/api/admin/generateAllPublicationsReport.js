const { User, Publication } = require('../../../models');
const { generateAllPublicationsReport } = require('../../../services/reportGenerator');
const { verifyToken } = require('../../../middleware/auth');
const fs = require('fs');

module.exports = async function handler(req, res) {
  // await corsMiddleware(req, res);
  // await dbConnect();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await verifyToken(req, res);

    const publicationsByUser = {};
    const users = await User.find({});
  
    for (const user of users) {
      publicationsByUser[user.iin] = {
        user,
        publications: await Publication.find({ iin: user.iin }),
      };
    }

    const filePath = await generateAllPublicationsReport(publicationsByUser);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename=all_publications_${new Date().getFullYear()}.docx`);
      
      res.download(filePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).json({ message: 'Error sending file' });
        }
      });
    } else {
      console.error('File not found:', filePath);
      res.status(404).json({ message: 'Report file not found' });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
}

// app.post('/api/admin/generateAllPublicationsReport', verifyToken, async (req, res) => {
//     const publicationsByUser = {};
  
//     try {
//       const users = await User.find({});
    
//       for (const user of users) {
//         publicationsByUser[user.iin] = {
//           user,
//           publications: await Publication.find({ iin: user.iin }),
//         };
//       }
  
//       const filePath = await generateAllPublicationsReport(publicationsByUser);
  
//       if (fs.existsSync(filePath)) {
//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
//         res.setHeader('Content-Disposition', `attachment; filename=all_publications_${new Date().getFullYear()}.docx`);
        
//         res.download(filePath, (err) => {
//           if (err) {
//             console.error('Error sending file:', err);
//             res.status(500).json({ message: 'Error sending file' });
//           }
//         });
//       } else {
//         console.error('File not found:', filePath);
//         res.status(404).json({ message: 'Report file not found' });
//       }
//     } catch (error) {
//       console.error('Error generating report:', error);
//       res.status(500).json({ message: 'Error generating report' });
//     }
//   });