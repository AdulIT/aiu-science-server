const multer = require('multer');
const path = require('path');
const { verifyToken, authenticateUser } = require('../../../../middleware/auth');
const Publication = require('../../../../models/Publication');
// import dbConnect from '../../../middleware/dbConnect';
// import corsMiddleware from '../../../middleware/corsMiddleware';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/publications/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return cb(new Error('Файл должен быть формата PDF'), false);
    }
    cb(null, true);
  },
});

module.exports = async (req, res) => {
  // await corsMiddleware(req, res);
  // await dbConnect();

  if (req.method === 'POST') {
    try {
      await verifyToken(req, res);
      await authenticateUser(req, res);

      upload.single('file')(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message });

        const { iin } = req.user;
        const { authors, title, year, output, doi, isbn, scopus, wos, publicationType } = req.body;

        const newPublication = new Publication({
          iin,
          authors,
          title,
          year,
          output,
          doi,
          isbn,
          scopus: scopus || false,
          wos: wos || false,
          publicationType,
          file: req.file ? `public/uploads/publications/${req.file.filename}` : null,
        });

        const savedPublication = await newPublication.save();
        console.log('Saved publication:', savedPublication);

        res.status(201).json(savedPublication);
      });
    } catch (error) {
      console.error('Ошибка при добавлении публикации:', error);
      res.status(500).json({ message: 'Ошибка при добавлении публикации' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};