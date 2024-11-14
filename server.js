const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// auth
const authLogin = require('./api/auth/login')
const authRegister = require('./api/auth/register')
const authRefreshToken = require('./api/auth/register')

// admin
const adminCreate = require('./api/admin/create')
const adminGenerateAllPublicationsReport = require('./api/admin/generateAllPublicationsReport')
const adminGenerateUserReport = require('./api/admin/generateUserReport')
const adminPublications = require('./api/admin/publications')
const adminUser = require('./api/admin/user')
const adminUsers = require('./api/admin/users')

// user
const userDownloadResumeDocx = require('./api/user/downloadResumeDocx')
const userDownloadResumePdf = require('./api/user/downloadResumePdf')
const userGenerateResume = require('./api/user/generateResume')
const userProfile = require('./api/user/profile')
const userPublications = require('./api/user/publications')
const userUpdate = require('./api/user/update')
const userUploadPhoto = require('./api/user/uploadPhoto')

// user/publications
const userPublicationsUpload = require('./api/user/publications/upload')

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
app.use('/api/admin/user', adminUser);
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