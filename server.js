const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// auth
const authLogin = require('./pages/api/auth/login')
const authRegister = require('./pages/api/auth/register')
const authRefreshToken = require('./pages/api/auth/register')

// admin
const adminCreate = require('./pages/api/admin/create')
const adminGenerateAllPublicationsReport = require('./pages/api/admin/generateAllPublicationsReport')
const adminGenerateUserReport = require('./pages/api/admin/generateUserReport')
const adminPublications = require('./pages/api/admin/publications')
const adminUser = require('./pages/api/admin/user')
const adminUsers = require('./pages/api/admin/users')

// user
const userDownloadResumeDocx = require('./pages/api/user/downloadResumeDocx')
const userDownloadResumePdf = require('./pages/api/user/downloadResumePdf')
const userGenerateResume = require('./pages/api/user/generateResume')
const userProfile = require('./pages/api/user/profile')
const userPublications = require('./pages/api/user/publications')
const userUpdate = require('./pages/api/user/update')
const userUploadPhoto = require('./pages/api/user/uploadPhoto')

// user/publications
const userPublicationsUpload = require('./pages/api/user/publications/upload')

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


// Import routes
// auth
app.use('/api/auth/login', authLogin);
app.use('/api/auth/register', authRegister);
app.use('/api/auth/refresh-token', authRefreshToken);

// admin
app.use('/api/admin/create', adminCreate);
app.use('/api/admin/generateAllPublicationsReport', adminGenerateAllPublicationsReport);
app.use('/api/admin/generateUserReport', adminGenerateUserReport);
app.use('/api/admin/publications', adminPublications);
app.use('/api/admin/user/:iin', adminUser);
app.use('/api/admin/users', adminUsers);

// user
app.use('/api/user/downloadResumeDocx', userDownloadResumeDocx);
app.use('/api/user/downloadResumePdf', userDownloadResumePdf);
app.use('/api/user/generateResume', userGenerateResume);
app.use('/api/user/profile', userProfile);
app.use('/api/user/publications', userPublications);
app.use('/api/user/update', userUpdate);
app.use('/api/user/uploadPhoto', userUploadPhoto);

// user/publications
app.use('/api/user/publications/upload', userPublicationsUpload);

const MONGO_URI = process.env.MONGO_URI

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((error) => console.error('MongoDB connection error:', error));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// module.exports = app;

// export default {dbConnect, corsMiddleware};