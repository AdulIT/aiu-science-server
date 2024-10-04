const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Успешное подключение к MongoDB'))
.catch((error) => console.error('Ошибка подключения к MongoDB:', error));

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
});

const User = mongoose.model('User', userSchema);

module.exports = { User };