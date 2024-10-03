const { Sequelize, DataTypes } = require('sequelize');

// Создаем новое подключение к базе данных SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // Путь к файлу базы данных
});

// Определение модели пользователя
const User = sequelize.define('User', {
  iin: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Синхронизируем модель с базой данных
sequelize.sync()
  .then(() => console.log('База данных и таблицы созданы'))
  .catch((error) => console.error('Ошибка при создании базы данных:', error));

module.exports = {
  User,
  sequelize,
};