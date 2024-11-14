const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [process.env.LOCAL_ORIGIN, process.env.PRODUCTION_ORIGIN].filter(Boolean);
const corsOptions = {
  origin: allowedOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((error) => console.error('MongoDB connection error:', error));

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });


// const express = require('express');
// const mongoose = require('mongoose');
// const dotenv = require('dotenv');
// const cors = require('cors');

// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// dotenv.config();

// const router = express.Router();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // app.use(cors());
// const allowedOrigins = [process.env.LOCAL_ORIGIN, process.env.PRODUCTION_ORIGIN].filter(Boolean);

// const corsOptions = {
//   origin: allowedOrigins,
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
//   credentials: true,
// };

// app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));
// app.use(express.json());

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log('Connected to MongoDB successfully'))
//   .catch((error) => console.error('MongoDB connection error:', error));

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadPath = path.join(__dirname, 'public/uploads');
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
//   },
// });

// const upload = multer({ storage });

// app.use('/public', express.static(path.join(__dirname, 'public')));
// // app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// // app.use('/api', userPublications);
// // app.use('/api', adminPublications);
// // app.post('/api/auth/refresh-token', refreshTokenHandler);
// module.exports = router;

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });