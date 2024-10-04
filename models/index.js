const mongoose = require('mongoose');

// Подключение к базе данных MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Успешное подключение к MongoDB'))
  .catch((error) => console.error('Ошибка подключения к MongoDB:', error));

// Определение модели пользователя
const userSchema = new mongoose.Schema({
  iin: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePhoto: {
    type: String, // URL фотографии пользователя
  },
  scopusId: String,
  wosId: String,
  orcid: String,
  birthDate: String,
  phone: String,
  email: String,
  researchArea: String,
});

const User = mongoose.model('User', userSchema);

module.exports = { User };